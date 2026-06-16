import requests
from typing import Dict, List, Optional

class RouteGenerator:
    """Generate multiple route alternatives via OSRM (no Google API required)."""

    NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
    OSRM_BASE = "https://router.project-osrm.org/route/v1"

    PROFILE_MAP = {
        'driving': 'driving',
        'walking': 'foot',
        'bicycling': 'bike',
        'transit': 'driving',
    }

    ROUTE_NAMES = [
        'Main Route',
        'Alternative Route',
        'Scenic Route',
        'Express Route',
        'Bypass Route',
    ]

    def geocode_address(self, address: str) -> Optional[Dict]:
        try:
            params = {
                'q': f'{address}, India',
                'format': 'json',
                'limit': 1,
                'countrycodes': 'in',
                'addressdetails': 1,
            }
            headers = {'User-Agent': 'NaviPulse/1.0 (smart-route-finder)'}
            response = requests.get(self.NOMINATIM_URL, params=params, headers=headers, timeout=10)
            data = response.json()
            if data:
                return {
                    'lat': float(data[0]['lat']),
                    'lng': float(data[0]['lon']),
                    'formatted_address': data[0]['display_name'],
                }
            return None
        except Exception as e:
            print(f"Nominatim geocoding error: {str(e)}")
            return None

    def get_routes(
        self,
        origin_coords: Dict,
        dest_coords: Dict,
        travel_mode: str = 'driving',
        max_alternatives: int = 3,
    ) -> Optional[List[Dict]]:
        profile = self.PROFILE_MAP.get(travel_mode, 'driving')
        all_routes = []

        # Direct route with alternatives
        direct = self._fetch_osrm(
            profile, origin_coords, dest_coords, alternatives=True
        )
        if direct:
            all_routes.extend(direct)

        # Via-point routes to discover more paths when few alternatives exist
        if len(all_routes) < max_alternatives:
            for via in self._via_points(origin_coords, dest_coords, max_alternatives - len(all_routes)):
                via_routes = self._fetch_osrm(
                    profile, origin_coords, dest_coords, via=via, alternatives=False
                )
                if via_routes:
                    all_routes.extend(via_routes)

        if not all_routes:
            return None

        return self._finalize_routes(all_routes, origin_coords, dest_coords, max_alternatives)

    def _fetch_osrm(
        self,
        profile: str,
        origin: Dict,
        dest: Dict,
        via: Optional[Dict] = None,
        alternatives: bool = False,
    ) -> Optional[List[Dict]]:
        parts = [f"{origin['lng']},{origin['lat']}"]
        if via:
            parts.append(f"{via['lng']},{via['lat']}")
        parts.append(f"{dest['lng']},{dest['lat']}")
        coords = ';'.join(parts)

        try:
            url = f"{self.OSRM_BASE}/{profile}/{coords}"
            params = {
                'overview': 'full',
                'geometries': 'polyline',
                'steps': 'true',
                'annotations': 'nodes',
                'continue_straight': 'default',
            }
            if alternatives and not via:
                params['alternatives'] = 'true'

            response = requests.get(url, params=params, timeout=15)
            data = response.json()
            if data.get('code') == 'Ok' and data.get('routes'):
                return data['routes']
        except Exception as e:
            print(f"OSRM fetch error: {str(e)}")
        return None

    def _via_points(self, origin: Dict, dest: Dict, count: int) -> List[Dict]:
        """Offset midpoints perpendicular to the direct line for alternate paths."""
        mid_lat = (origin['lat'] + dest['lat']) / 2
        mid_lng = (origin['lng'] + dest['lng']) / 2
        dlat = dest['lat'] - origin['lat']
        dlng = dest['lng'] - origin['lng']
        length = (dlat ** 2 + dlng ** 2) ** 0.5 or 1
        # Perpendicular unit vector
        perp_lat = -dlng / length
        perp_lng = dlat / length
        offset = 0.15 * length  # ~15% of trip length

        points = []
        for i in range(count):
            sign = 1 if i % 2 == 0 else -1
            factor = (i // 2 + 1) * sign
            points.append({
                'lat': mid_lat + perp_lat * offset * factor,
                'lng': mid_lng + perp_lng * offset * factor,
            })
        return points

    def _finalize_routes(
        self, osrm_routes: List[Dict], origin: Dict, dest: Dict, max_alternatives: int
    ) -> List[Dict]:
        seen = set()
        result = []
        for i, r in enumerate(osrm_routes):
            geom = r.get('geometry', '')
            key = f"{r.get('distance', 0)}:{r.get('duration', 0)}:{len(geom)}"
            if key in seen:
                continue
            seen.add(key)
            result.append(self._osrm_to_google_format(r, len(result), origin, dest))
            if len(result) >= max_alternatives:
                break
        return result if result else None

    def _osrm_to_google_format(
        self, osrm_route: Dict, index: int, origin: Dict, dest: Dict
    ) -> Dict:
        distance_m = int(osrm_route.get('distance', 0))
        duration_s = int(osrm_route.get('duration', 0))

        # Simulate realistic traffic variation per alternative
        traffic_factors = [1.05, 1.18, 1.32, 1.25, 1.15]
        factor = traffic_factors[index % len(traffic_factors)]
        duration_in_traffic = int(duration_s * factor)

        summary = self._build_summary(osrm_route, index)
        steps = self._extract_steps(osrm_route)

        return {
            'summary': summary,
            'overview_polyline': {'points': osrm_route.get('geometry', '')},
            'bounds': self._compute_bounds(osrm_route, origin, dest),
            'legs': [{
                'distance': {'value': distance_m, 'text': f'{distance_m / 1000:.1f} km'},
                'duration': {'value': duration_s, 'text': self._format_duration(duration_s)},
                'duration_in_traffic': {
                    'value': duration_in_traffic,
                    'text': self._format_duration(duration_in_traffic),
                },
                'steps': steps,
                'start_address': origin.get('formatted_address', 'Origin'),
                'end_address': dest.get('formatted_address', 'Destination'),
            }],
            'warnings': [],
            'copyrights': 'OSRM / OpenStreetMap',
        }

    def _build_summary(self, route: Dict, index: int) -> str:
        names = self.ROUTE_NAMES
        leg_names = []
        for leg in route.get('legs', []):
            for step in leg.get('steps', [])[:3]:
                name = step.get('name', '')
                if name and name not in leg_names:
                    leg_names.append(name)
        via = ', '.join(leg_names[:2]) if leg_names else names[index % len(names)]
        return via

    def _extract_steps(self, route: Dict) -> List[Dict]:
        steps = []
        for leg in route.get('legs', []):
            for step in leg.get('steps', []):
                maneuver = step.get('maneuver', {})
                road = (step.get('name') or '').strip()
                ref = (step.get('ref') or '').strip()
                steps.append({
                    'name': road,
                    'ref': ref,
                    'maneuver': maneuver,
                    'html_instructions': step.get('name', '') or ref,
                    'distance': {
                        'value': int(step.get('distance', 0)),
                        'text': f'{int(step.get("distance", 0))} m',
                    },
                    'duration': {
                        'value': int(step.get('duration', 0)),
                        'text': self._format_duration(int(step.get('duration', 0))),
                    },
                    'travel_mode': 'DRIVING',
                })
        return steps

    def _compute_bounds(self, route: Dict, origin: Dict, dest: Dict) -> Dict:
        lats = [origin['lat'], dest['lat']]
        lngs = [origin['lng'], dest['lng']]
        return {
            'northeast': {'lat': max(lats), 'lng': max(lngs)},
            'southwest': {'lat': min(lats), 'lng': min(lngs)},
        }

    @staticmethod
    def _format_duration(seconds: int) -> str:
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        if hours > 0:
            return f'{hours} hr {minutes} min'
        return f'{minutes} min'
