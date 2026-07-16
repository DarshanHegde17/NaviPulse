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


LIVE_FLIGHTS_CACHE_TTL = 12

OPENSKY_TOKEN_URL = (
    'https://auth.opensky-network.org/auth/realms/opensky-network'
    '/protocol/openid-connect/token'
)
_opensky_token_cache = {'access_token': None, 'expires_at': 0}


def _get_opensky_access_token():
    """OAuth2 client-credentials token for OpenSky REST API."""
    client_id = (Config.OPENSKY_CLIENT_ID or '').strip()
    client_secret = (Config.OPENSKY_CLIENT_SECRET or '').strip()
    if not client_id or not client_secret:
        return None, None

    now = time.time()
    if (
        _opensky_token_cache.get('access_token')
        and _opensky_token_cache.get('expires_at', 0) > now + 60
    ):
        return _opensky_token_cache['access_token'], None

    try:
        response = requests.post(
            OPENSKY_TOKEN_URL,
            data={
                'grant_type': 'client_credentials',
                'client_id': client_id,
                'client_secret': client_secret,
            },
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
            timeout=15,
        )
        if not response.ok:
            body = {}
            try:
                body = response.json()
            except Exception:
                pass
            msg = body.get('error_description') or body.get('error') or response.text[:200]
            return None, f'OpenSky auth failed: {msg}'

        data = response.json() or {}
        token = data.get('access_token')
        if not token:
            return None, 'OpenSky auth failed: no access_token'
        expires_in = int(data.get('expires_in') or 1800)
        _opensky_token_cache['access_token'] = token
        _opensky_token_cache['expires_at'] = now + expires_in
        return token, None
    except requests.Timeout:
        return None, 'OpenSky auth timed out'
    except requests.RequestException as exc:
        return None, f'OpenSky auth error: {exc}'


def _parse_opensky_state(row):
    """Map OpenSky state-vector array → flight object for the live map."""
    if not row or len(row) < 11:
        return None
    lon, lat = row[5], row[6]
    if lon is None or lat is None:
        return None
    callsign = (row[1] or '').strip() or None
    velocity = row[9]
    altitude = row[7] if row[7] is not None else row[13]
    return {
        'icao24': row[0],
        'callsign': callsign,
        'originCountry': row[2] or '—',
        'lon': float(lon),
        'lat': float(lat),
        'altitude': round(float(altitude), 1) if altitude is not None else None,
        'onGround': bool(row[8]),
        'velocity': round(float(velocity), 1) if velocity is not None else None,
        'heading': round(float(row[10]), 1) if row[10] is not None else 0,
        'verticalRate': round(float(row[11]), 1) if len(row) > 11 and row[11] is not None else None,
        'squawk': row[14] if len(row) > 14 else None,
        'airline': None,
        'registration': None,
        'aircraftType': None,
    }


def _first_num(item, *keys):
    for key in keys:
        val = item.get(key)
        if val is None or val == '':
            continue
        try:
            return float(val)
        except (TypeError, ValueError):
            continue
    return None


def _parse_skylink_aircraft(item):
    """Normalize SkyLink ADS-B aircraft → shared flight object (SI units)."""
    if not isinstance(item, dict):
        return None
    lat = _first_num(item, 'lat', 'latitude')
    lon = _first_num(item, 'lon', 'longitude', 'lng')
    if lat is None or lon is None:
        return None

    # SkyLink altitudes are typically feet; speeds knots; vertical rate fpm
    alt_ft = _first_num(item, 'altitude_baro', 'altitude', 'alt', 'baro_altitude')
    speed_kt = _first_num(item, 'ground_speed', 'velocity', 'gs', 'speed')
    heading = _first_num(item, 'heading', 'track', 'true_track') or 0
    vrate_fpm = _first_num(item, 'vertical_rate', 'baro_rate', 'vs')

    on_ground = item.get('is_on_ground')
    if on_ground is None:
        on_ground = item.get('on_ground')
    on_ground = bool(on_ground)

    callsign = (item.get('callsign') or item.get('flight') or '').strip() or None
    icao24 = (item.get('icao24') or item.get('hex') or item.get('icao') or '').strip().lower()
    if not icao24:
        icao24 = callsign or f'{lat:.3f},{lon:.3f}'

    return {
        'icao24': icao24,
        'callsign': callsign,
        'originCountry': item.get('origin_country') or item.get('country') or '—',
        'lon': float(lon),
        'lat': float(lat),
        'altitude': round(alt_ft / 3.28084, 1) if alt_ft is not None else None,
        'onGround': on_ground,
        'velocity': round(speed_kt / 1.94384, 1) if speed_kt is not None else None,
        'heading': round(float(heading), 1),
        'verticalRate': round(vrate_fpm / 196.85, 2) if vrate_fpm is not None else None,
        'squawk': item.get('squawk'),
        'airline': item.get('airline') or item.get('operator') or None,
        'registration': item.get('registration') or item.get('reg') or None,
        'aircraftType': item.get('aircraft_type') or item.get('type') or item.get('model') or None,
    }


def _skylink_headers():
    return {
        'x-rapidapi-key': Config.RAPIDAPI_KEY,
        'x-rapidapi-host': Config.RAPIDAPI_HOST or 'skylink-api.p.rapidapi.com',
        'Content-Type': 'application/json',
    }


def _fetch_skylink_states(bbox):
    """Fetch live aircraft from SkyLink ADS-B via RapidAPI."""
    if not Config.RAPIDAPI_KEY:
        return None, 'RAPIDAPI_KEY not set'

    # SkyLink bbox: lat1,lon1,lat2,lon2 (SW → NE)
    bbox_str = f"{bbox['lamin']},{bbox['lomin']},{bbox['lamax']},{bbox['lomax']}"
    base = f"https://{Config.RAPIDAPI_HOST or 'skylink-api.p.rapidapi.com'}"
    # v3.1 on RapidAPI has no /v3 prefix; also try /v3 for older docs
    paths = [
        f'/adsb/aircraft?bbox={bbox_str}',
        f'/v3/adsb/aircraft?bbox={bbox_str}',
    ]

    last_error = None
    for path in paths:
        try:
            response = requests.get(
                base + path,
                headers=_skylink_headers(),
                timeout=25,
            )
            if response.status_code == 403:
                body = {}
                try:
                    body = response.json()
                except Exception:
                    pass
                msg = body.get('message') or response.text or 'Forbidden'
                if 'not subscribed' in str(msg).lower():
                    return None, (
                        'SkyLink not subscribed on RapidAPI — open '
                        'https://rapidapi.com/skylink-api-skylink-api-default/api/skylink-api '
                        'and click Subscribe (FREE plan), then retry'
                    )
                return None, f'SkyLink forbidden: {msg}'
            if response.status_code == 429:
                return None, 'SkyLink rate limit reached — wait and retry'
            if response.status_code == 404:
                last_error = f'SkyLink path not found: {path}'
                continue
            if not response.ok:
                last_error = f'SkyLink HTTP {response.status_code}: {response.text[:200]}'
                continue

            data = response.json() or {}
            raw_list = (
                data.get('aircraft')
                or data.get('data')
                or data.get('flights')
                or data.get('states')
                or []
            )
            if isinstance(raw_list, dict):
                raw_list = raw_list.get('aircraft') or raw_list.get('data') or []

            flights = []
            for item in raw_list:
                parsed = _parse_skylink_aircraft(item)
                if parsed:
                    flights.append(parsed)

            return {
                'flights': flights,
                'count': len(flights),
                'time': int(time.time()),
                'source': 'skylink',
                'authenticated': True,
                'bbox': bbox,
            }, None
        except requests.Timeout:
            last_error = 'SkyLink timed out'
        except requests.RequestException as exc:
            last_error = str(exc)

    return None, last_error or 'SkyLink request failed'


def _fetch_opensky_states(bbox):
    """Fetch live aircraft from OpenSky Network (OAuth2 preferred, else anonymous)."""
    params = {
        'lamin': bbox['lamin'],
        'lomin': bbox['lomin'],
        'lamax': bbox['lamax'],
        'lomax': bbox['lomax'],
    }

    headers = {}
    auth = None
    authenticated = False

    token, token_error = _get_opensky_access_token()
    if token:
        headers['Authorization'] = f'Bearer {token}'
        authenticated = True
    elif Config.OPENSKY_USERNAME and Config.OPENSKY_PASSWORD:
        # Legacy basic auth (may be rejected by OpenSky)
        auth = (Config.OPENSKY_USERNAME, Config.OPENSKY_PASSWORD)
        authenticated = True
    elif token_error and (Config.OPENSKY_CLIENT_ID or Config.OPENSKY_CLIENT_SECRET):
        return None, token_error

    try:
        response = requests.get(
            'https://opensky-network.org/api/states/all',
            params=params,
            headers=headers or None,
            auth=auth,
            timeout=20,
        )
        if response.status_code == 401 and authenticated and Config.OPENSKY_CLIENT_ID:
            # Token expired mid-flight — force refresh once
            _opensky_token_cache['access_token'] = None
            _opensky_token_cache['expires_at'] = 0
            token, token_error = _get_opensky_access_token()
            if not token:
                return None, token_error or 'OpenSky token refresh failed'
            headers['Authorization'] = f'Bearer {token}'
            response = requests.get(
                'https://opensky-network.org/api/states/all',
                params=params,
                headers=headers,
                timeout=20,
            )
        if response.status_code == 429:
            return None, 'OpenSky rate limit reached — wait a few seconds and retry'
        if response.status_code == 401:
            return None, 'OpenSky credentials invalid — check OPENSKY_CLIENT_ID / OPENSKY_CLIENT_SECRET'
        if not response.ok:
            return None, f'OpenSky HTTP {response.status_code}'

        data = response.json() or {}
        flights = []
        for row in data.get('states') or []:
            parsed = _parse_opensky_state(row)
            if parsed:
                flights.append(parsed)

        return {
            'flights': flights,
            'count': len(flights),
            'time': data.get('time'),
            'source': 'opensky',
            'authenticated': authenticated,
            'bbox': bbox,
        }, None
    except requests.Timeout:
        return None, 'OpenSky timed out'
    except requests.RequestException as exc:
        return None, str(exc)


@route_bp.route('/flights/live', methods=['GET'])
def get_live_flights():
    """
    Live aircraft positions (FlightRadar24-style).
    Prefers OpenSky (free OAuth) when configured; optional SkyLink fallback.
    Query: lamin, lomin, lamax, lomax (optional; default = India-centered box)
    """
    try:
        lamin = float(request.args.get('lamin', 6.0))
        lomin = float(request.args.get('lomin', 68.0))
        lamax = float(request.args.get('lamax', 37.0))
        lomax = float(request.args.get('lomax', 98.0))
    except (TypeError, ValueError):
        return jsonify({'error': 'bbox params must be numbers'}), 400

    if not (-90 <= lamin < lamax <= 90 and -180 <= lomin < lomax <= 180):
        return jsonify({'error': 'invalid bounding box'}), 400

    if (lamax - lamin) > 90 or (lomax - lomin) > 180:
        return jsonify({'error': 'bounding box too large — zoom in or pick a region'}), 400

    bbox = {
        'lamin': round(lamin, 4),
        'lomin': round(lomin, 4),
        'lamax': round(lamax, 4),
        'lomax': round(lomax, 4),
    }
    cache_key = f"live:{bbox['lamin']}:{bbox['lomin']}:{bbox['lamax']}:{bbox['lomax']}"
    cached = _api_cache.get(cache_key)
    if cached and time.time() - cached['ts'] < LIVE_FLIGHTS_CACHE_TTL:
        return jsonify(cached['data']), 200

    payload = None
    errors = []

    # Primary: OpenSky (free)
    payload, error = _fetch_opensky_states(bbox)
    if error:
        errors.append(error)
        payload = None

    # Optional: SkyLink if OpenSky failed and RapidAPI key exists
    if payload is None and Config.RAPIDAPI_KEY:
        payload, error = _fetch_skylink_states(bbox)
        if error:
            errors.append(error)
            payload = None

    if payload is None:
        msg = errors[0] if errors else 'No live flight source available'
        status = 403 if 'not subscribed' in msg.lower() else (429 if 'rate limit' in msg.lower() else 502)
        return jsonify({'error': msg, 'tried': errors}), status

    if errors:
        payload['fallbackNote'] = errors[0]

    _api_cache[cache_key] = {'ts': time.time(), 'data': payload}
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
        return jsonify({'error': error}), 502 if 'timed out' in str(error).lower() else 503

    _cache_set(cache_key, payload)
    return jsonify(payload), 200


LIVE_TRAINS_CACHE_TTL = 45

# Major hubs used to seed the India live train map (station-board based)
DEFAULT_TRAIN_HUBS = [
    'NDLS', 'CSTM', 'HWH', 'MAS', 'SBC', 'SC', 'ADI', 'PUNE',
]


def _station_coords(code):
    station = get_station_by_code(code)
    if not station:
        return None, None, None
    lat, lng = station.get('lat'), station.get('lng')
    if lat is None or lng is None:
        return None, None, station.get('name')
    return float(lat), float(lng), station.get('name') or code


def _jitter_coords(lat, lng, seed_text):
    """Spread stacked trains slightly around a station pin."""
    seed = sum(ord(c) for c in (seed_text or 'x'))
    dlat = ((seed % 17) - 8) * 0.012
    dlng = ((seed % 13) - 6) * 0.012
    return round(lat + dlat, 5), round(lng + dlng, 5)


def _ntes_date_today():
    return time.strftime('%d-%b-%Y')


def _parse_ntes_live_track(data, train_no):
    """Map NTES live_status payload → train map object with coordinates."""
    if not isinstance(data, dict):
        return None

    last_code = (data.get('LSTN') or '').strip().upper()
    next_code = (data.get('NSTN') or data.get('NPSTN') or '').strip().upper()
    lat, lng, last_name = _station_coords(last_code)
    if lat is None:
        # Fall back to next stoppage if last station missing from dataset
        lat, lng, last_name = _station_coords(next_code)
        if last_code:
            last_name = data.get('LSTNN') or last_name
        last_code = next_code or last_code

    if lat is None:
        return None

    lat, lng = _jitter_coords(lat, lng, train_no)
    next_lat, next_lng, next_name = _station_coords(next_code)
    delay = data.get('LDEL')
    try:
        delay_min = int(delay) if delay is not None and str(delay).strip() != '' else 0
    except (TypeError, ValueError):
        delay_min = 0

    status = data.get('CPOS') or data.get('LASTUPD') or data.get('LUPDFULL') or '—'
    if delay_min > 0:
        status_label = f'Delayed {delay_min}m'
    else:
        status_label = 'On Time'

    return {
        'trainNo': str(data.get('TN') or train_no),
        'name': str(data.get('TNM') or data.get('TNH') or '—'),
        'status': status_label,
        'statusNote': status,
        'delayMin': delay_min,
        'lastStation': last_code or '—',
        'lastStationName': data.get('LSTNN') or last_name or '—',
        'nextStation': next_code or '—',
        'nextStationName': data.get('NSTNN') or data.get('NPSTNN') or next_name or '—',
        'source': str(data.get('SRC') or '—'),
        'destination': str(data.get('DSTN') or '—'),
        'sourceName': str(data.get('SRCN') or '—'),
        'destinationName': str(data.get('DSTNN') or '—'),
        'lat': lat,
        'lng': lng,
        'nextLat': next_lat,
        'nextLng': next_lng,
        'updated': data.get('LUPDT') or data.get('LTIME') or '—',
        'hub': last_code,
    }


def _fetch_ntes_track_train(train_no, date_str=None):
    try:
        from ntes import NTESClient
    except ImportError:
        return None, 'ntes-client not installed'

    date_str = date_str or _ntes_date_today()
    try:
        client = NTESClient()
        raw = client.live_status(str(train_no), date_str)
        parsed = _parse_ntes_live_track(raw, train_no)
        if not parsed:
            return None, 'Could not place train on map (station coordinates missing)'
        parsed['sourceApi'] = 'ntes'
        parsed['date'] = date_str
        return parsed, None
    except Exception as exc:
        return None, str(exc)


def _fetch_irctc_track_train(train_no, date_str=None):
    """Optional RailKit trackTrain REST (when SSL/API available)."""
    key = Config.IRCTC_CONNECT_API_KEY
    if not key:
        return None, None

    date_str = date_str or time.strftime('%d-%m-%Y')
    paths = [
        f'/api/trackTrain/{train_no}/{date_str}',
        f'/api/trackTrain/{train_no}',
    ]
    last_error = None
    for path in paths:
        headers = _irctc_connect_headers('GET', path, key)
        try:
            response = requests.get(f'{IRCTC_CONNECT_BASE}{path}', headers=headers, timeout=15)
            if response.status_code == 404:
                continue
            if not response.ok:
                last_error = f'IRCTC track HTTP {response.status_code}'
                continue
            body = response.json() or {}
            data = body.get('data') if isinstance(body, dict) else None
            if not data and isinstance(body, dict) and body.get('trainNo'):
                data = body
            if not data:
                last_error = 'IRCTC track returned empty data'
                continue
            code = (
                data.get('currentStationCode')
                or data.get('lastStationCode')
                or data.get('LSTN')
                or ''
            )
            code = str(code).strip().upper()
            lat, lng, name = _station_coords(code)
            if lat is None:
                return None, 'Could not place train on map (station coordinates missing)'
            lat, lng = _jitter_coords(lat, lng, train_no)
            return {
                'trainNo': str(data.get('trainNo') or train_no),
                'name': str(data.get('trainName') or '—'),
                'status': str(data.get('statusNote') or data.get('status') or '—'),
                'statusNote': str(data.get('statusNote') or '—'),
                'delayMin': int(data.get('delay') or data.get('delayMin') or 0) if str(data.get('delay') or '').isdigit() else 0,
                'lastStation': code or '—',
                'lastStationName': name or '—',
                'nextStation': str(data.get('nextStationCode') or '—'),
                'nextStationName': str(data.get('nextStationName') or '—'),
                'source': '—',
                'destination': '—',
                'sourceName': '—',
                'destinationName': '—',
                'lat': lat,
                'lng': lng,
                'nextLat': None,
                'nextLng': None,
                'updated': '—',
                'hub': code,
                'sourceApi': 'irctc-connect',
                'date': date_str,
            }, None
        except requests.RequestException as exc:
            last_error = str(exc)
    return None, last_error


def _track_train(train_no, date_str=None):
    payload, error = _fetch_ntes_track_train(train_no, date_str)
    if payload:
        return payload, None
    irctc_payload, irctc_error = _fetch_irctc_track_train(train_no, date_str)
    if irctc_payload:
        return irctc_payload, None
    return None, error or irctc_error or 'Train tracking unavailable'


def _live_trains_from_hubs(hub_codes):
    """Aggregate live station boards onto a map using station lat/lng."""
    trains_by_no = {}
    hubs_ok = []
    errors = []

    for code in hub_codes:
        code = (code or '').strip().upper()
        if not code:
            continue
        lat, lng, station_name = _station_coords(code)
        if lat is None:
            errors.append(f'{code}: no coordinates')
            continue

        # Prefer NTES first for the live map (faster / more reliable than IRCTC SSL)
        board, error = _fetch_ntes_station(code, 2)
        if board is None:
            board, error = _fetch_railway_station_trains(code, 2)
        if error or not board:
            errors.append(f'{code}: {error or "empty"}')
            continue

        hubs_ok.append(code)
        for item in board.get('trains') or []:
            train_no = str(item.get('trainNo') or '').strip()
            if not train_no or train_no == '—':
                continue
            # Prefer first sighting; later hubs skip duplicates
            if train_no in trains_by_no:
                continue
            tlat, tlng = _jitter_coords(lat, lng, train_no)
            trains_by_no[train_no] = {
                'trainNo': train_no,
                'name': item.get('name') or '—',
                'status': item.get('status') or '—',
                'statusNote': f"At / near {station_name or code}",
                'delayMin': 0,
                'lastStation': code,
                'lastStationName': station_name or code,
                'nextStation': item.get('destination') or '—',
                'nextStationName': item.get('destination') or '—',
                'source': item.get('source') or '—',
                'destination': item.get('destination') or '—',
                'sourceName': item.get('source') or '—',
                'destinationName': item.get('destination') or '—',
                'platform': item.get('platform') or '—',
                'dep': item.get('dep') or '—',
                'arr': item.get('arr') or '—',
                'lat': tlat,
                'lng': tlng,
                'hub': code,
                'sourceApi': board.get('source') or 'station-board',
            }

    return {
        'trains': list(trains_by_no.values()),
        'count': len(trains_by_no),
        'hubs': hubs_ok,
        'hubErrors': errors[:8],
        'note': 'Positions are station-based (last reported / board hub), not continuous GPS.',
        'source': 'ntes-station-boards',
        'time': int(time.time()),
    }


@route_bp.route('/trains/live', methods=['GET'])
def get_live_trains():
    """
    Live India train map (FR24-style).
    Aggregates live boards at major hubs and places trains at station coordinates.
    Query: hubs=NDLS,CSTM,HWH (optional)
    """
    raw_hubs = request.args.get('hubs', '').strip()
    if raw_hubs:
        hubs = [h.strip().upper() for h in raw_hubs.split(',') if h.strip()][:20]
    else:
        hubs = list(DEFAULT_TRAIN_HUBS)

    cache_key = f"trains-live:{','.join(hubs)}"
    cached = _api_cache.get(cache_key)
    if cached and time.time() - cached['ts'] < LIVE_TRAINS_CACHE_TTL:
        return jsonify(cached['data']), 200

    payload = _live_trains_from_hubs(hubs)
    if not payload['trains'] and payload.get('hubErrors'):
        return jsonify({
            'error': 'Could not load live trains from hubs',
            'hubErrors': payload['hubErrors'],
        }), 502

    _api_cache[cache_key] = {'ts': time.time(), 'data': payload}
    return jsonify(payload), 200


@route_bp.route('/trains/track', methods=['GET'])
def track_live_train():
    """Track one train by number and place it at last reported station."""
    train_no = request.args.get('number', '').strip()
    date_str = request.args.get('date', '').strip() or None
    if not train_no or not train_no.isdigit() or len(train_no) not in (4, 5):
        return jsonify({'error': 'number query required (4–5 digit train number)'}), 400

    cache_key = f'train-track:{train_no}:{date_str or "today"}'
    cached = _api_cache.get(cache_key)
    if cached and time.time() - cached['ts'] < 30:
        return jsonify(cached['data']), 200

    payload, error = _track_train(train_no, date_str)
    if error:
        return jsonify({'error': error}), 502

    _api_cache[cache_key] = {'ts': time.time(), 'data': payload}
    return jsonify(payload), 200
