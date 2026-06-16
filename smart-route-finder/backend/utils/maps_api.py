import requests
from config.config import Config
from typing import Dict, List, Optional
from utils.route_explanations import analyze_road_quality, build_route_explanation
from utils.via_extractor import extract_via_points, build_via_summary

class GoogleMapsAPI:
    """Google Maps API Integration"""
    
    def __init__(self):
        self.api_key = Config.GOOGLE_MAPS_API_KEY
        self.directions_url = Config.GOOGLE_DIRECTIONS_API
        self.geocoding_url = Config.GOOGLE_GEOCODING_API
    
    def geocode_address(self, address: str) -> Optional[Dict]:
        """Convert address to coordinates (biased to India for accuracy)"""
        try:
            params = {
                'address': address if 'india' in address.lower() else f'{address}, India',
                'key': self.api_key,
                'region': 'in',
                'components': 'country:IN',
            }
            
            response = requests.get(self.geocoding_url, params=params)
            data = response.json()
            
            if data['status'] == 'OK' and data['results']:
                location = data['results'][0]['geometry']['location']
                return {
                    'lat': location['lat'],
                    'lng': location['lng'],
                    'formatted_address': data['results'][0]['formatted_address']
                }
            
            return None
        except Exception as e:
            print(f"Geocoding error: {str(e)}")
            return None
    
    def get_routes(self, origin: str, destination: str, travel_mode: str = 'driving', 
                   alternatives: bool = True) -> Optional[List[Dict]]:
        """
        Fetch multiple route alternatives from Google Maps
        
        Args:
            origin: Starting location
            destination: Ending location
            travel_mode: driving, walking, bicycling, transit
            alternatives: Whether to return alternative routes
        
        Returns:
            List of route objects with details
        """
        try:
            params = {
                'origin': origin,
                'destination': destination,
                'mode': travel_mode,
                'alternatives': alternatives,
                'departure_time': 'now',
                'traffic_model': 'best_guess',
                'key': self.api_key
            }
            
            response = requests.get(self.directions_url, params=params)
            data = response.json()
            
            if data['status'] == 'OK':
                return data['routes']
            else:
                print(f"API Error: {data.get('status')} - {data.get('error_message', '')}")
                return None
                
        except Exception as e:
            print(f"Route fetch error: {str(e)}")
            return None
    
    def analyze_traffic(self, route: Dict) -> Dict:
        """
        Analyze traffic conditions for a route
        
        Returns:
            Traffic analysis with status and delay
        """
        try:
            if 'legs' not in route:
                return {'status': 'unknown', 'delay': 0}
            
            total_duration = 0
            total_duration_in_traffic = 0
            
            for leg in route['legs']:
                duration = leg.get('duration', {}).get('value', 0)
                duration_in_traffic = leg.get('duration_in_traffic', {}).get('value', duration)
                
                total_duration += duration
                total_duration_in_traffic += duration_in_traffic
            
            delay = total_duration_in_traffic - total_duration
            delay_percentage = (delay / total_duration * 100) if total_duration > 0 else 0
            
            # Classify traffic status
            if delay_percentage < 10:
                status = 'Low'
            elif delay_percentage < 30:
                status = 'Medium'
            else:
                status = 'Heavy'
            
            return {
                'status': status,
                'delay': delay,
                'delay_percentage': round(delay_percentage, 2),
                'base_duration': total_duration,
                'traffic_duration': total_duration_in_traffic
            }
            
        except Exception as e:
            print(f"Traffic analysis error: {str(e)}")
            return {'status': 'unknown', 'delay': 0}
    
    def format_route_response(self, route: Dict, route_index: int) -> Dict:
        """Format route data for frontend"""
        try:
            traffic_info = self.analyze_traffic(route)
            
            total_distance = 0
            total_duration = 0
            steps = []
            
            if 'legs' in route:
                for leg in route['legs']:
                    total_distance += leg.get('distance', {}).get('value', 0)
                    total_duration += leg.get('duration_in_traffic', leg.get('duration', {})).get('value', 0)
                    
                    for step in leg.get('steps', []):
                        steps.append({
                            'instruction': step.get('html_instructions', ''),
                            'distance': step.get('distance', {}).get('text', ''),
                            'duration': step.get('duration', {}).get('text', ''),
                        })

            via_points = extract_via_points(route)
            via_summary = build_via_summary(
                via_points, route.get('summary', f'Route {route_index + 1}')
            )
            road_quality = analyze_road_quality(route)

            formatted = {
                'route_id': route_index,
                'route_name': f"Route {route_index + 1}",
                'summary': via_summary,
                'via_points': via_points,
                'via_summary': via_summary,
                'distance': {
                    'value': total_distance,
                    'text': f"{total_distance / 1000:.2f} km"
                },
                'duration': {
                    'value': total_duration,
                    'text': self._format_duration(total_duration)
                },
                'traffic': traffic_info,
                'road_quality': road_quality,
                'polyline': route.get('overview_polyline', {}).get('points', ''),
                'bounds': route.get('bounds', {}),
                'steps': steps,
                'warnings': route.get('warnings', []),
                'waypoint_order': route.get('waypoint_order', []),
                'color': self._route_color(route_index),
            }
            formatted['explanation'] = build_route_explanation(formatted, road_quality, [])
            return formatted
            
        except Exception as e:
            print(f"Route formatting error: {str(e)}")
            return None
    
    @staticmethod
    def _route_color(index: int) -> str:
        colors = ['#ff6a00', '#4a9eff', '#36d636', '#e040fb', '#ffd600']
        return colors[index % len(colors)]

    def _format_duration(self, seconds: int) -> str:
        """Convert seconds to human-readable format"""
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        
        if hours > 0:
            return f"{hours} hr {minutes} min"
        else:
            return f"{minutes} min"
