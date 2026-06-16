from algorithms.dijkstra import DijkstraAlgorithm
from algorithms.astar import AStarAlgorithm
from typing import List, Dict, Optional

class RouteOptimizer:
    """
    Route optimization using Dijkstra and A* algorithms
    Analyzes multiple routes and identifies best options
    """
    
    def __init__(self):
        self.dijkstra = DijkstraAlgorithm()
        self.astar = AStarAlgorithm()
    
    def analyze_routes(self, routes: List[Dict]) -> Dict:
        """
        Analyze all routes and identify:
        - Shortest route (by distance)
        - Fastest route (by time with traffic)
        - Best balanced route
        """
        if not routes:
            return None
        
        analyzed_routes = []
        shortest_route = None
        fastest_route = None
        min_distance = float('infinity')
        min_duration = float('infinity')
        
        for idx, route in enumerate(routes):
            # Calculate metrics
            total_distance = 0
            total_duration = 0
            total_traffic_duration = 0
            
            if 'legs' in route:
                for leg in route['legs']:
                    total_distance += leg.get('distance', {}).get('value', 0)
                    total_duration += leg.get('duration', {}).get('value', 0)
                    total_traffic_duration += leg.get('duration_in_traffic', 
                                                      leg.get('duration', {})).get('value', 0)
            
            # Traffic delay
            delay = total_traffic_duration - total_duration
            
            route_analysis = {
                'route_index': idx,
                'distance': total_distance,
                'duration': total_duration,
                'traffic_duration': total_traffic_duration,
                'delay': delay,
                'is_shortest': False,
                'is_fastest': False
            }
            
            # Track shortest
            if total_distance < min_distance:
                min_distance = total_distance
                shortest_route = idx
            
            # Track fastest
            if total_traffic_duration < min_duration:
                min_duration = total_traffic_duration
                fastest_route = idx
            
            analyzed_routes.append(route_analysis)
        
        # Mark best routes
        if shortest_route is not None:
            analyzed_routes[shortest_route]['is_shortest'] = True
        
        if fastest_route is not None:
            analyzed_routes[fastest_route]['is_fastest'] = True
        
        return {
            'routes': analyzed_routes,
            'shortest_route_index': shortest_route,
            'fastest_route_index': fastest_route,
            'total_routes': len(routes)
        }
    
    def apply_dijkstra(self, routes: List[Dict]) -> Optional[Dict]:
        """Apply Dijkstra's algorithm for shortest path"""
        try:
            self.dijkstra.build_graph(routes)
            result = self.dijkstra.optimize_route(routes)
            return result
        except Exception as e:
            print(f"Dijkstra optimization error: {str(e)}")
            return None
    
    def apply_astar(self, routes: List[Dict]) -> Optional[Dict]:
        """Apply A* algorithm for fastest path"""
        try:
            self.astar.build_graph(routes)
            result = self.astar.optimize_route(routes)
            return result
        except Exception as e:
            print(f"A* optimization error: {str(e)}")
            return None
    
    def get_recommendations(self, routes: List[Dict], analysis: Dict) -> Dict:
        """
        Generate route recommendations based on analysis
        """
        recommendations = {
            'shortest': None,
            'fastest': None,
            'balanced': None,
            'best': None,
        }
        
        if not routes or not analysis:
            return recommendations
        
        shortest_idx = analysis.get('shortest_route_index')
        fastest_idx = analysis.get('fastest_route_index')
        
        if shortest_idx is not None:
            recommendations['shortest'] = {
                'route_index': shortest_idx,
                'reason': 'Minimum distance',
                'distance': analysis['routes'][shortest_idx]['distance'],
                'duration': analysis['routes'][shortest_idx]['traffic_duration']
            }
        
        if fastest_idx is not None:
            recommendations['fastest'] = {
                'route_index': fastest_idx,
                'reason': 'Minimum travel time with current traffic',
                'distance': analysis['routes'][fastest_idx]['distance'],
                'duration': analysis['routes'][fastest_idx]['traffic_duration']
            }
        
        # Find balanced route (best distance-time ratio)
        best_ratio = float('infinity')
        balanced_idx = None
        
        for idx, route_data in enumerate(analysis['routes']):
            distance_km = route_data['distance'] / 1000
            duration_min = route_data['traffic_duration'] / 60
            
            if duration_min > 0:
                ratio = distance_km / duration_min
                if ratio < best_ratio:
                    best_ratio = ratio
                    balanced_idx = idx
        
        if balanced_idx is not None:
            recommendations['balanced'] = {
                'route_index': balanced_idx,
                'reason': 'Best distance-time balance',
                'distance': analysis['routes'][balanced_idx]['distance'],
                'duration': analysis['routes'][balanced_idx]['traffic_duration']
            }

        return recommendations

    def enrich_recommendations(
        self, recommendations: Dict, formatted_routes: List[Dict]
    ) -> Dict:
        """Add best pick and human-readable explanations to recommendations."""
        from utils.route_explanations import pick_best_route, build_route_explanation

        if not formatted_routes:
            return recommendations

        best_idx = pick_best_route({}, formatted_routes)
        best_route = formatted_routes[best_idx]
        recommendations['best'] = {
            'route_index': best_idx,
            'reason': 'Best overall - low traffic, good roads, efficient time',
            'distance': best_route['distance']['value'],
            'duration': best_route['duration']['value'],
            'explanation': best_route.get('explanation', ''),
        }

        for key in ('fastest', 'shortest', 'balanced', 'best'):
            rec = recommendations.get(key)
            if not rec:
                continue
            idx = rec['route_index']
            if idx >= len(formatted_routes):
                continue
            route = formatted_routes[idx]
            tags = [key] if key != 'best' else ['best']
            if key == 'best':
                tags = ['best']
            elif recommendations.get('fastest', {}).get('route_index') == idx:
                tags.append('fastest')
            elif recommendations.get('shortest', {}).get('route_index') == idx:
                tags.append('shortest')

            rec['explanation'] = build_route_explanation(
                route, route.get('road_quality', {}), tags
            )
            route['explanation'] = rec['explanation']
            if key == 'best':
                route['is_recommended'] = True

        # Tag formatted routes with recommendation flags
        for idx, route in enumerate(formatted_routes):
            route['tags'] = []
            if recommendations.get('fastest', {}).get('route_index') == idx:
                route['tags'].append('fastest')
            if recommendations.get('shortest', {}).get('route_index') == idx:
                route['tags'].append('shortest')
            if recommendations.get('balanced', {}).get('route_index') == idx:
                route['tags'].append('balanced')
            if recommendations.get('best', {}).get('route_index') == idx:
                route['tags'].append('best')
                route['is_recommended'] = True
            route['explanation'] = build_route_explanation(
                route, route.get('road_quality', {}), route['tags']
            )

        return recommendations
