from flask import Blueprint, request, jsonify
import hashlib
import hmac
import re
import secrets
import time
import requests
from utils.maps_api import GoogleMapsAPI
from utils.route_generator import RouteGenerator
from utils.route_optimizer import RouteOptimizer
from utils.railway_stations import (
    get_state_summary,
    get_station_by_code,
    search_stations,
    total_station_count,
)
from models.route_history import RouteHistory
from models.saved_routes import SavedRoutes
from config.config import Config

route_bp = Blueprint('routes', __name__, url_prefix='/api/routes')

_api_cache = {}
CACHE_TTL_SECONDS = 600

maps_api = GoogleMapsAPI()
route_generator = RouteGenerator()
optimizer = RouteOptimizer()

@route_bp.route('/search', methods=['POST'])
def search_routes():
    """
    Search for routes between origin and destination
    Returns multiple route options with traffic and optimization
    """
    try:
        data = request.get_json()
        
        origin = data.get('origin')
        destination = data.get('destination')
        travel_mode = data.get('travel_mode', 'driving')
        user_id = data.get('user_id')
        
        if not all([origin, destination]):
            return jsonify({'error': 'Origin and destination are required'}), 400
        
        # Geocode addresses (Google first, OSM fallback)
        origin_coords = maps_api.geocode_address(origin)
        dest_coords = maps_api.geocode_address(destination)
        data_source = 'google'

        if not origin_coords:
            origin_coords = route_generator.geocode_address(origin)
        if not dest_coords:
            dest_coords = route_generator.geocode_address(destination)

        if not origin_coords or not dest_coords:
            return jsonify({'error': 'Could not geocode addresses'}), 400

        routes = None
        # Coordinate-based routing is more accurate than address strings
        origin_str = f"{origin_coords['lat']},{origin_coords['lng']}"
        dest_str = f"{dest_coords['lat']},{dest_coords['lng']}"

        if Config.GOOGLE_MAPS_API_KEY:
            routes = maps_api.get_routes(origin_str, dest_str, travel_mode, alternatives=True)

        if not routes:
            data_source = 'osrm'
            routes = route_generator.get_routes(origin_coords, dest_coords, travel_mode)

        if not routes:
            return jsonify({'error': 'No routes found'}), 404
        
        # Format routes
        formatted_routes = []
        for idx, route in enumerate(routes):
            formatted = maps_api.format_route_response(route, idx)
            if formatted:
                formatted_routes.append(formatted)
        
        analysis = optimizer.analyze_routes(routes)
        recommendations = optimizer.get_recommendations(routes, analysis)
        recommendations = optimizer.enrich_recommendations(recommendations, formatted_routes)
        
        # Apply Dijkstra for shortest path
        dijkstra_result = optimizer.apply_dijkstra(routes)
        
        # Apply A* for fastest path
        astar_result = optimizer.apply_astar(routes)
        
        response = {
            'origin': {
                'address': origin,
                'resolved': origin_coords.get('formatted_address', origin),
                'coordinates': origin_coords,
            },
            'destination': {
                'address': destination,
                'resolved': dest_coords.get('formatted_address', destination),
                'coordinates': dest_coords,
            },
            'travel_mode': travel_mode,
            'routes': formatted_routes,
            'analysis': analysis,
            'recommendations': recommendations,
            'algorithms': {
                'dijkstra': dijkstra_result,
                'astar': astar_result
            },
            'total_routes': len(formatted_routes),
            'data_source': data_source,
        }

        if user_id and formatted_routes:
            best_idx = (
                recommendations.get('best', {}) or {}
            ).get('route_index')
            if best_idx is None:
                fastest = recommendations.get('fastest')
                best_idx = fastest['route_index'] if fastest else 0
            best_route = formatted_routes[best_idx]
            RouteHistory.create({
                'user_id': user_id,
                'source': origin,
                'destination': destination,
                'source_coords': origin_coords,
                'destination_coords': dest_coords,
                'route_name': best_route['route_name'],
                'distance': best_route['distance']['value'],
                'duration': best_route['duration']['value'],
                'traffic_status': best_route['traffic']['status'],
                'delay_time': best_route['traffic']['delay'],
                'travel_mode': travel_mode,
                'route_type': 'best'
            })

            saved = SavedRoutes.save_or_update({
                'user_id': user_id,
                'route_name': best_route['route_name'],
                'route_index': best_idx,
                'source': origin,
                'destination': destination,
                'source_coords': origin_coords,
                'destination_coords': dest_coords,
                'distance': best_route['distance']['value'],
                'duration': best_route['duration']['value'],
                'travel_mode': travel_mode,
                'traffic_status': best_route['traffic']['status'],
                'delay_time': best_route['traffic'].get('delay', 0),
                'via_summary': best_route.get('via_summary', best_route.get('summary', '')),
                'auto_saved': True,
            })
            response['auto_saved'] = True
            response['saved_route_id'] = str(saved['_id'])

        return jsonify(response), 200
        
    except Exception as e:
        print(f"Route search error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@route_bp.route('/compare', methods=['POST'])
def compare_routes():
    """Compare specific routes in detail"""
    try:
        data = request.get_json()
        route_indices = data.get('route_indices', [])
        routes_data = data.get('routes', [])
        
        if not routes_data:
            return jsonify({'error': 'No routes provided'}), 400
        
        comparison = []
        
        for idx in route_indices:
            if idx < len(routes_data):
                route = routes_data[idx]
                comparison.append({
                    'route_index': idx,
                    'route_name': route.get('route_name'),
                    'distance': route.get('distance'),
                    'duration': route.get('duration'),
                    'traffic': route.get('traffic'),
                    'summary': route.get('summary')
                })
        
        return jsonify({
            'comparison': comparison,
            'total_compared': len(comparison)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@route_bp.route('/traffic/incidents', methods=['GET'])
def get_live_traffic_incidents():
    """Proxy TomTom incidentDetails so the browser avoids CORS/timeouts."""
    bbox = request.args.get('bbox', '').strip()
    if not bbox:
        return jsonify({'error': 'bbox query required (minLon,minLat,maxLon,maxLat)'}), 400

    key = Config.TOMTOM_TRAFFIC_API_KEY
    if not key:
        return jsonify({'error': 'TOMTOM_TRAFFIC_API_KEY not set on server (.env)'}), 503

    url = 'https://api.tomtom.com/traffic/services/5/incidentDetails'
    try:
        response = requests.get(url, params={'bbox': bbox, 'key': key}, timeout=12)
        data = response.json()
        if not response.ok:
            msg = (
                data.get('detailedError', {}).get('message')
                or data.get('error')
                or f'HTTP {response.status_code}'
            )
            return jsonify({'error': msg}), response.status_code
        return jsonify({'incidents': data.get('incidents', [])}), 200
    except requests.Timeout:
        return jsonify({'error': 'Traffic service timed out'}), 504
    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 502


def _classify_osm_poi(tags):
    if not tags:
        return None
    tourism = tags.get('tourism', '')
    amenity = tags.get('amenity', '')
    shop = tags.get('shop', '')

    if tourism in ('hotel', 'motel', 'guest_house'):
        return 'hotel', tourism
    if amenity in ('hospital', 'clinic'):
        return 'hospital', amenity
    if amenity in ('school', 'college', 'university', 'kindergarten'):
        return 'school', amenity
    if shop or amenity in ('marketplace', 'mall', 'supermarket', 'convenience'):
        return 'shop', shop or amenity
    if amenity in ('restaurant', 'cafe', 'fast_food', 'pharmacy'):
        return 'shop', amenity
    return None, None


def _parse_overpass_places(elements):
    places = []
    seen = set()
    for el in elements or []:
        tags = el.get('tags') or {}
        poi_type, detail = _classify_osm_poi(tags)
        if not poi_type:
            continue

        lat = el.get('lat')
        lon = el.get('lon')
        if lat is None or lon is None:
            center = el.get('center') or {}
            lat = center.get('lat')
            lon = center.get('lon')
        if lat is None or lon is None:
            continue

        el_id = el.get('id')
        key = (el_id, round(lat, 5), round(lon, 5))
        if key in seen:
            continue
        seen.add(key)

        name = tags.get('name') or tags.get('brand') or tags.get('operator') or 'Unnamed place'
        places.append({
            'id': el_id,
            'lat': lat,
            'lon': lon,
            'name': name,
            'type': poi_type,
            'detail': detail,
        })
    return places


@route_bp.route('/places/nearby', methods=['GET'])
def get_nearby_places():
    """POIs (hotels, schools, shops) via OpenStreetMap Overpass for the traffic map."""
    bbox = request.args.get('bbox', '').strip()
    if not bbox:
        return jsonify({'error': 'bbox query required (south,west,north,east)'}), 400

    try:
        parts = [float(x.strip()) for x in bbox.split(',')]
        if len(parts) != 4:
            raise ValueError('bbox must have 4 numbers')
        south, west, north, east = parts
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid bbox (south,west,north,east)'}), 400

    if north <= south or east <= west:
        return jsonify({'error': 'Invalid bbox bounds'}), 400

    if (north - south) > 0.15 or (east - west) > 0.15:
        return jsonify({'error': 'Area too large — zoom in to see places'}), 400

    query = f"""[out:json][timeout:28];
(
  node["tourism"~"hotel|motel|guest_house"]({south},{west},{north},{east});
  way["tourism"~"hotel|motel|guest_house"]({south},{west},{north},{east});
  node["amenity"~"school|college|university|kindergarten"]({south},{west},{north},{east});
  way["amenity"~"school|college|university|kindergarten"]({south},{west},{north},{east});
  node["shop"]({south},{west},{north},{east});
  way["shop"]({south},{west},{north},{east});
  node["amenity"~"restaurant|cafe|fast_food|marketplace|mall|supermarket|convenience|hospital|pharmacy"]({south},{west},{north},{east});
);
out center 200;"""

    try:
        response = requests.post(
            'https://overpass-api.de/api/interpreter',
            data={'data': query},
            timeout=30,
        )
        data = response.json()
        if not response.ok:
            return jsonify({'error': data.get('remark', 'Overpass request failed')}), 502
    except requests.Timeout:
        return jsonify({'error': 'Places service timed out'}), 504
    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 502

    places = _parse_overpass_places(data.get('elements', []))
    return jsonify({'places': places}), 200


@route_bp.route('/traffic/<route_id>', methods=['GET'])
def get_traffic_info(route_id):
    """Get detailed traffic information for a route"""
    try:
        # This would fetch real-time traffic data
        # For now, return mock data structure
        
        traffic_data = {
            'route_id': route_id,
            'current_traffic': 'Medium',
            'delay_minutes': 8,
            'congestion_points': [
                {
                    'location': 'Main Street & 5th Ave',
                    'severity': 'High',
                    'delay': '5 min'
                },
                {
                    'location': 'Highway 101 Exit 23',
                    'severity': 'Medium',
                    'delay': '3 min'
                }
            ],
            'updated_at': 'Just now'
        }
        
        return jsonify(traffic_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@route_bp.route('/optimize', methods=['POST'])
def optimize_route():
    """
    Optimize a specific route using algorithms
    """
    try:
        data = request.get_json()
        routes = data.get('routes', [])
        optimization_type = data.get('type', 'both')  # shortest, fastest, both
        
        if not routes:
            return jsonify({'error': 'No routes provided'}), 400
        
        result = {}
        
        if optimization_type in ['shortest', 'both']:
            dijkstra_result = optimizer.apply_dijkstra(routes)
            result['shortest'] = dijkstra_result
        
        if optimization_type in ['fastest', 'both']:
            astar_result = optimizer.apply_astar(routes)
            result['fastest'] = astar_result
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def _cache_get(key):
    entry = _api_cache.get(key)
    if entry and time.time() - entry['ts'] < CACHE_TTL_SECONDS:
        return entry['data']
    return None


def _cache_set(key, data):
    _api_cache[key] = {'ts': time.time(), 'data': data}


def _format_aviation_time(value):
    if not value:
        return '—'
    text = str(value)
    if 'T' in text:
        return text.split('T')[1][:5]
    if re.match(r'^\d{2}:\d{2}', text):
        return text[:5]
    return text[:16]


def _parse_aviationstack_flight(item, context_iata):
    dep = item.get('departure') or {}
    arr = item.get('arrival') or {}
    airline = (item.get('airline') or {}).get('name') or 'Unknown'
    flight = item.get('flight') or {}
    flight_no = flight.get('iata') or str(flight.get('number') or '—')
    dep_iata = dep.get('iata') or '—'
    arr_iata = arr.get('iata') or '—'

    if dep_iata == context_iata:
        leg_type = 'Departure'
        delay = dep.get('delay') or 0
    elif arr_iata == context_iata:
        leg_type = 'Arrival'
        delay = arr.get('delay') or 0
    else:
        leg_type = 'Transit'
        delay = dep.get('delay') or arr.get('delay') or 0

    status = item.get('flight_status') or 'scheduled'
    if delay and int(delay) > 0:
        status_text = f'Delayed {delay}m'
    elif status == 'active':
        status_text = 'En route'
    elif status == 'landed':
        status_text = 'Landed'
    elif status == 'cancelled':
        status_text = 'Cancelled'
    else:
        status_text = 'On Time'

    return {
        'flightNo': flight_no,
        'airline': airline,
        'type': leg_type,
        'source': dep_iata,
        'destination': arr_iata,
        'dep': _format_aviation_time(dep.get('estimated') or dep.get('scheduled')),
        'arr': _format_aviation_time(arr.get('estimated') or arr.get('scheduled')),
        'duration': '—',
        'status': status_text,
    }


def _fetch_aviationstack_flights(iata, flight_type):
    key = Config.AVIATIONSTACK_API_KEY
    if not key:
        return None, 'AVIATIONSTACK_API_KEY not set on server (.env)'

    base_url = 'http://api.aviationstack.com/v1/flights'
    flights = []
    seen = set()

    def pull(param_name):
        try:
            response = requests.get(
                base_url,
                params={'access_key': key, param_name: iata, 'limit': 25},
                timeout=15,
            )
            data = response.json()
            if not response.ok:
                msg = data.get('error', {}).get('message') or data.get('error') or f'HTTP {response.status_code}'
                return msg
            for item in data.get('data') or []:
                parsed = _parse_aviationstack_flight(item, iata)
                dedupe_key = f"{parsed['flightNo']}|{parsed['dep']}|{parsed['type']}"
                if dedupe_key in seen:
                    continue
                seen.add(dedupe_key)
                flights.append(parsed)
            return None
        except requests.Timeout:
            return 'Aviation service timed out'
        except requests.RequestException as exc:
            return str(exc)

    errors = []
    if flight_type in ('departure', 'both'):
        err = pull('dep_iata')
        if err:
            errors.append(err)
    if flight_type in ('arrival', 'both'):
        err = pull('arr_iata')
        if err:
            errors.append(err)

    flights.sort(key=lambda f: f.get('dep') or '')
    if flights:
        return {'flights': flights, 'live': True, 'source': 'aviationstack'}, None
    if errors:
        return None, errors[0]
    return {'flights': [], 'live': True, 'source': 'aviationstack'}, None


def _railway_time_only(value):
    if not value:
        return '—'
    text = str(value).strip()
    if re.match(r'^\d{2}:\d{2}', text):
        return text[:5]
    match = re.search(r'(\d{2}:\d{2})', text)
    return match.group(1) if match else text[:12]


def _parse_indian_rail_train(item):
    delay_arr = str(item.get('DelayInArrival') or '').strip()
    delay_dep = str(item.get('DelayInDeparture') or '').strip()
    if delay_arr in ('RT', '00:00', '') and delay_dep in ('RT', '00:00', ''):
        status = 'On Time'
    elif delay_arr not in ('RT', '00:00', ''):
        status = f'Delayed {delay_arr}'
    elif delay_dep not in ('RT', '00:00', ''):
        status = f'Delayed {delay_dep}'
    else:
        status = 'On Time'

    platform = str(
        item.get('PlatformNumber')
        or item.get('ExpectedPlatformNo')
        or item.get('Platform')
        or '—'
    ).strip() or '—'

    return {
        'trainNo': str(item.get('Number') or '—'),
        'name': str(item.get('Name') or '—'),
        'type': 'At station',
        'source': str(item.get('Source') or '—'),
        'destination': str(item.get('Destination') or '—'),
        'dep': _railway_time_only(item.get('ExpectedDeparture') or item.get('ScheduleDeparture')),
        'arr': _railway_time_only(item.get('ExpectedArrival') or item.get('ScheduleArrival')),
        'platform': platform,
        'duration': str(item.get('Halt') or '—'),
        'status': status,
    }


IRCTC_CONNECT_BASE = 'https://api.irctc.rajivdubey.tech'
IRCTC_SDK_SIGNING_SECRET = (
    '97c56e08b27b161124f88acd4f24d1bd50f48075f11dc23b9ea6c0bc9b2f8794'
)


def _irctc_connect_headers(method, path, api_key):
    timestamp = str(int(time.time() * 1000))
    nonce = secrets.token_hex(32)
    payload_hash = hashlib.sha256(b'').hexdigest()
    canonical = '\n'.join([method.upper(), path, timestamp, nonce, payload_hash, api_key])
    signature = hmac.new(
        IRCTC_SDK_SIGNING_SECRET.encode(),
        canonical.encode(),
        hashlib.sha256,
    ).hexdigest()
    return {
        'x-api-key': api_key,
        'Accept': 'application/json',
        'x-irctc-sdk-ts': timestamp,
        'x-irctc-sdk-nonce': nonce,
        'x-irctc-sdk-payload-sha256': payload_hash,
        'x-irctc-sdk-signature': signature,
        'x-irctc-sdk-version': '1',
    }


def _parse_ntes_delay(value):
    text = str(value or '').strip()
    if not text or text.lower() in ('on time', 'rt', '00:00'):
        return 'On Time'
    if 'delay' in text.lower():
        return text
    return f'Delayed {text}'


def _parse_ntes_train(item):
    delay_arr = item.get('DelayArr')
    delay_dep = item.get('DelayDep')
    if delay_arr and str(delay_arr).strip().lower() not in ('on time', 'rt', ''):
        status = _parse_ntes_delay(delay_arr)
    elif delay_dep and str(delay_dep).strip().lower() not in ('on time', 'rt', ''):
        status = _parse_ntes_delay(delay_dep)
    else:
        status = 'On Time'

    platform = str(item.get('Platform') or item.get('ExpectedPlatform') or '—').strip() or '—'
    return {
        'trainNo': str(item.get('TrainNumber') or '—'),
        'name': str(item.get('TrainName') or '—'),
        'type': 'At station',
        'source': str(item.get('Source') or item.get('From') or '—'),
        'destination': str(item.get('Destination') or item.get('To') or '—'),
        'dep': _railway_time_only(item.get('ETD') or item.get('STD')),
        'arr': _railway_time_only(item.get('ETA') or item.get('STA')),
        'platform': platform,
        'duration': str(item.get('Halt') or '—'),
        'status': status,
    }


def _parse_irctc_connect_train(item):
    platform = str(
        item.get('platform')
        or item.get('Platform')
        or item.get('pfNo')
        or '—'
    ).strip() or '—'
    delay = str(item.get('delay') or item.get('Delay') or '').strip()
    status = 'On Time'
    if delay and delay.lower() not in ('', 'on time', '0', '00:00', 'rt'):
        status = f'Delayed {delay}' if 'delay' not in delay.lower() else delay

    return {
        'trainNo': str(item.get('trainno') or item.get('trainNo') or '—'),
        'name': str(item.get('trainname') or item.get('trainName') or '—'),
        'type': 'At station',
        'source': str(item.get('source') or '—'),
        'destination': str(item.get('dest') or item.get('destination') or '—'),
        'dep': _railway_time_only(item.get('timeat') or item.get('departure')),
        'arr': _railway_time_only(item.get('timeat') or item.get('arrival')),
        'platform': platform,
        'duration': str(item.get('halt') or item.get('Halt') or '—'),
        'status': status,
    }


def _platform_sort_key(value):
    text = str(value).strip().upper()
    if text.isdigit():
        return (0, int(text))
    return (1, text)


def _live_platforms_from_trains(trains):
    platforms = []
    seen = set()
    for train in trains or []:
        platform = str(train.get('platform') or '').strip()
        if not platform or platform in ('—', '-', 'NA', 'N/A'):
            continue
        key = platform.upper()
        if key in seen:
            continue
        seen.add(key)
        platforms.append(platform)
    return sorted(platforms, key=_platform_sort_key)


def _fetch_indian_rail_station(code, hours):
    key = Config.INDIAN_RAIL_API_KEY
    if not key:
        return None, None

    url = (
        f'http://indianrailapi.com/api/v2/LiveStation/apikey/{key}'
        f'/StationCode/{code}/hours/{hours}/'
    )
    try:
        response = requests.get(url, timeout=15)
        data = response.json()
        if not response.ok:
            return None, data.get('Message') or f'HTTP {response.status_code}'
        if str(data.get('ResponseCode')) != '200' or str(data.get('Status', '')).upper() != 'SUCCESS':
            return None, data.get('Message') or 'Indian Rail API returned an error'

        trains = [_parse_indian_rail_train(item) for item in (data.get('Trains') or [])]
        return {
            'trains': trains,
            'live': True,
            'source': 'indianrailapi',
            'stationCode': code,
            'hours': int(hours),
            'livePlatforms': _live_platforms_from_trains(trains),
        }, None
    except requests.Timeout:
        return None, 'Indian Rail API timed out'
    except requests.RequestException as exc:
        return None, str(exc)


def _fetch_irctc_connect_station(code):
    key = Config.IRCTC_CONNECT_API_KEY
    if not key:
        return None, None

    path = f'/api/liveAtStation/{code}'
    headers = _irctc_connect_headers('GET', path, key)
    try:
        response = requests.get(f'{IRCTC_CONNECT_BASE}{path}', headers=headers, timeout=15)
        data = response.json()
        if not response.ok:
            return None, data.get('error') or data.get('message') or f'HTTP {response.status_code}'
        if not data.get('success'):
            return None, data.get('error') or 'IRCTC Connect returned an error'

        trains = [_parse_irctc_connect_train(item) for item in (data.get('data') or [])]
        return {
            'trains': trains,
            'live': True,
            'source': 'irctc-connect',
            'stationCode': code,
            'hours': 2,
            'livePlatforms': _live_platforms_from_trains(trains),
        }, None
    except requests.Timeout:
        return None, 'IRCTC Connect timed out'
    except requests.RequestException as exc:
        return None, str(exc)


def _fetch_ntes_station(code, hours):
    try:
        from ntes import NTESClient
    except ImportError:
        return None, None

    try:
        client = NTESClient()
        data = client.station_live(code, hours=int(hours))
        items = data.get('TrainsAtStation') or data.get('trains') or []
        trains = [_parse_ntes_train(item) for item in items]
        return {
            'trains': trains,
            'live': True,
            'source': 'ntes',
            'stationCode': code,
            'hours': int(hours),
            'livePlatforms': _live_platforms_from_trains(trains),
        }, None
    except Exception as exc:
        return None, str(exc)


def _fetch_railway_station_trains(code, hours):
    """Try Indian Rail API, then IRCTC Connect, then free NTES fallback."""
    providers = [
        lambda: _fetch_indian_rail_station(code, hours),
        lambda: _fetch_irctc_connect_station(code),
        lambda: _fetch_ntes_station(code, hours),
    ]
    errors = []
    for provider in providers:
        payload, error = provider()
        if payload is not None:
            return payload, None
        if error:
            errors.append(error)

    if not Config.INDIAN_RAIL_API_KEY and not Config.IRCTC_CONNECT_API_KEY:
        hint = (
            'No railway API key set. Get a free key at https://irctc.rajivdubey.tech '
            '→ IRCTC_CONNECT_API_KEY in backend/.env, or install ntes-client.'
        )
        return None, hint
    return None, errors[0] if errors else 'Railway data unavailable'


WIKIMEDIA_COMMONS_API = 'https://commons.wikimedia.org/w/api.php'
WIKIMEDIA_USER_AGENT = 'NaviPulse/1.0 (smart-route-finder; airport-photos)'


def _wikimedia_image_entries(pages):
    """Extract image URLs from Wikimedia API page results."""
    entries = []
    seen = set()
    for page in (pages or {}).values():
        title = page.get('title') or ''
        if not title.startswith('File:'):
            continue
        info = (page.get('imageinfo') or [{}])[0]
        mime = (info.get('mime') or '').lower()
        if mime and not mime.startswith('image/'):
            continue
        url = info.get('thumburl') or info.get('url')
        if not url or url in seen:
            continue
        seen.add(url)
        entries.append({
            'url': url,
            'title': title.replace('File:', ''),
            'source': 'wikimedia',
        })
    return entries


def _fetch_wikimedia_photos(queries, limit=12):
    """Search Wikimedia Commons for image files (free, no API key)."""
    photos = []
    seen = set()
    headers = {'User-Agent': WIKIMEDIA_USER_AGENT}

    for query in queries:
        if len(photos) >= limit:
            break
        if not query:
            continue
        try:
            response = requests.get(
                WIKIMEDIA_COMMONS_API,
                params={
                    'action': 'query',
                    'generator': 'search',
                    'gsrsearch': query,
                    'gsrnamespace': 6,
                    'gsrlimit': min(limit, 10),
                    'prop': 'imageinfo',
                    'iiprop': 'url|thumburl|mime',
                    'iiurlwidth': 1200,
                    'format': 'json',
                },
                headers=headers,
                timeout=15,
            )
            data = response.json()
            if not response.ok:
                continue
            pages = (data.get('query') or {}).get('pages') or {}
            for entry in _wikimedia_image_entries(pages):
                if entry['url'] in seen:
                    continue
                seen.add(entry['url'])
                photos.append(entry)
                if len(photos) >= limit:
                    break
        except requests.RequestException:
            continue

    return photos


def _fetch_wikimedia_airport_photos(name, city, iata, limit=12):
    """Search Wikimedia Commons for airport photos (free, no API key)."""
    queries = []
    if name:
        queries.append(f'{name} India airport')
    if city:
        queries.append(f'{city} airport India')
    if iata:
        queries.append(f'{iata} airport India')
    return _fetch_wikimedia_photos(queries, limit)


def _fetch_wikimedia_railway_photos(name, city, code, limit=12):
    """Search Wikimedia Commons for railway station photos."""
    queries = []
    if name:
        queries.append(f'{name} railway station India')
    if city:
        queries.append(f'{city} railway station India')
    if code:
        queries.append(f'{code} railway station India')
    queries.append('Indian Railways station India')
    return _fetch_wikimedia_photos(queries, limit)


@route_bp.route('/airport/photos', methods=['GET'])
def get_airport_photos():
    """Airport photo gallery via Wikimedia Commons (free API for all India airports)."""
    iata = request.args.get('iata', '').strip().upper()
    name = request.args.get('name', '').strip()
    city = request.args.get('city', '').strip()
    if not iata or len(iata) != 3:
        return jsonify({'error': 'iata query required (3-letter code, e.g. BLR)'}), 400

    cache_key = f'airport-photos:{iata}:{name}:{city}'
    cached = _cache_get(cache_key)
    if cached is not None:
        return jsonify(cached), 200

    photos = _fetch_wikimedia_airport_photos(name, city, iata)
    payload = {
        'iata': iata,
        'name': name,
        'city': city,
        'photos': photos,
        'count': len(photos),
        'live': bool(photos),
        'source': 'wikimedia-commons',
        'apiUrl': WIKIMEDIA_COMMONS_API,
        'categoryUrl': 'https://commons.wikimedia.org/wiki/Category:Airports_in_India',
        'docsUrl': 'https://commons.wikimedia.org/wiki/Commons:API/MediaWiki',
    }
    _cache_set(cache_key, payload)
    return jsonify(payload), 200


@route_bp.route('/airport/flights', methods=['GET'])
def get_airport_flights():
    """Proxy Aviationstack live departures/arrivals for an airport IATA code."""
    iata = request.args.get('iata', '').strip().upper()
    flight_type = request.args.get('type', 'both').lower()
    if not iata or len(iata) != 3:
        return jsonify({'error': 'iata query required (3-letter code, e.g. BLR)'}), 400
    if flight_type not in ('departure', 'arrival', 'both'):
        return jsonify({'error': 'type must be departure, arrival, or both'}), 400

    cache_key = f'airport:{iata}:{flight_type}'
    cached = _cache_get(cache_key)
    if cached is not None:
        return jsonify(cached), 200

    payload, error = _fetch_aviationstack_flights(iata, flight_type)
    if error:
        return jsonify({'error': error}), 502 if 'timed out' in error.lower() else 503

    _cache_set(cache_key, payload)
    return jsonify(payload), 200


@route_bp.route('/railway/photos', methods=['GET'])
def get_railway_photos():
    """Railway station photo gallery via Wikimedia Commons."""
    code = request.args.get('code', '').strip().upper()
    name = request.args.get('name', '').strip()
    city = request.args.get('city', '').strip()
    if not code:
        return jsonify({'error': 'code query required (station code, e.g. SBC)'}), 400

    cache_key = f'railway-photos:{code}:{name}:{city}'
    cached = _cache_get(cache_key)
    if cached is not None:
        return jsonify(cached), 200

    photos = _fetch_wikimedia_railway_photos(name, city, code)
    payload = {
        'code': code,
        'name': name,
        'city': city,
        'photos': photos,
        'count': len(photos),
        'live': bool(photos),
        'source': 'wikimedia-commons',
        'apiUrl': WIKIMEDIA_COMMONS_API,
        'categoryUrl': 'https://commons.wikimedia.org/wiki/Category:Railway_stations_in_India',
        'docsUrl': 'https://commons.wikimedia.org/wiki/Commons:API/MediaWiki',
    }
    _cache_set(cache_key, payload)
    return jsonify(payload), 200


@route_bp.route('/railway/stations/states', methods=['GET'])
def get_railway_states():
    """All Indian states/UTs with railway station counts (~8,990 stations)."""
    cache_key = 'railway:states'
    cached = _cache_get(cache_key)
    if cached is not None:
        return jsonify(cached), 200

    payload = {
        'states': get_state_summary(),
        'totalStations': total_station_count(),
        'source': 'datameet-railways',
        'datasetUrl': 'https://github.com/datameet/railways',
    }
    _cache_set(cache_key, payload)
    return jsonify(payload), 200


@route_bp.route('/railway/stations', methods=['GET'])
def list_railway_stations():
    """Search/list railway stations by state, name, or code."""
    state = request.args.get('state', '').strip()
    query = request.args.get('q', '').strip()
    limit = request.args.get('limit', '80')
    offset = request.args.get('offset', '0')

    stations, total = search_stations(state=state or None, query=query or None, limit=limit, offset=offset)
    return jsonify({
        'stations': stations,
        'total': total,
        'limit': int(limit or 80),
        'offset': int(offset or 0),
        'state': state or None,
        'query': query or None,
    }), 200


@route_bp.route('/railway/stations/<code>', methods=['GET'])
def get_railway_station_detail(code):
    """Single station metadata by code (e.g. SBC, NDLS)."""
    station = get_station_by_code(code)
    if not station:
        return jsonify({'error': f'Station not found: {code}'}), 404
    return jsonify({'station': station}), 200


@route_bp.route('/railway/station', methods=['GET'])
def get_railway_station_trains():
    """Live station board — Indian Rail API, IRCTC Connect, or NTES fallback."""
    code = request.args.get('code', '').strip().upper()
    hours = request.args.get('hours', '2').strip()
    if not code:
        return jsonify({'error': 'code query required (station code, e.g. SBC)'}), 400
    if hours not in ('2', '4'):
        hours = '2'

    cache_key = f'rail:{code}:{hours}'
    cached = _cache_get(cache_key)
    if cached is not None:
        return jsonify(cached), 200

    payload, error = _fetch_railway_station_trains(code, hours)
    if error:
        status = 504 if 'timed out' in error.lower() else 503
        return jsonify({'error': error}), status

    _cache_set(cache_key, payload)
    return jsonify(payload), 200
