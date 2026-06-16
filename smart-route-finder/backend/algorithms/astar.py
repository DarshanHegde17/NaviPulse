import heapq
import math
from typing import Dict, List, Tuple, Optional

class AStarAlgorithm:
    """
    A* Algorithm implementation for finding fastest path
    Uses heuristic function for time-based optimization
    Considers traffic and duration
    """
    
    def __init__(self):
        self.graph = {}
        self.g_score = {}  # Actual cost from start
        self.f_score = {}  # Estimated total cost (g + h)
        self.previous = {}
        self.coordinates = {}
    
    def build_graph(self, routes_data: List[Dict]) -> None:
        """
        Build graph with time-based weights
        Includes traffic delays
        """
        self.graph = {}
        self.coordinates = {}
        
        for route in routes_data:
            if 'legs' in route:
                for leg in route['legs']:
                    start = leg.get('start_address', '')
                    end = leg.get('end_address', '')
                    duration = leg.get('duration', {}).get('value', 0)  # in seconds
                    duration_in_traffic = leg.get('duration_in_traffic', {}).get('value', duration)
                    
                    # Store coordinates for heuristic
                    if 'start_location' in leg:
                        self.coordinates[start] = (
                            leg['start_location']['lat'],
                            leg['start_location']['lng']
                        )
                    
                    if 'end_location' in leg:
                        self.coordinates[end] = (
                            leg['end_location']['lat'],
                            leg['end_location']['lng']
                        )
                    
                    if start not in self.graph:
                        self.graph[start] = []
                    
                    self.graph[start].append({
                        'node': end,
                        'weight': duration_in_traffic,  # Use traffic-aware duration
                        'base_duration': duration
                    })
    
    def heuristic(self, node1: str, node2: str) -> float:
        """
        Heuristic function: Haversine distance converted to estimated time
        Assumes average speed of 60 km/h
        """
        if node1 not in self.coordinates or node2 not in self.coordinates:
            return 0
        
        lat1, lon1 = self.coordinates[node1]
        lat2, lon2 = self.coordinates[node2]
        
        # Haversine formula
        R = 6371  # Earth's radius in kilometers
        
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        
        a = (math.sin(dlat / 2) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlon / 2) ** 2)
        
        c = 2 * math.asin(math.sqrt(a))
        distance = R * c  # Distance in km
        
        # Convert to estimated time (seconds) assuming 60 km/h average speed
        estimated_time = (distance / 60) * 3600
        
        return estimated_time
    
    def find_fastest_path(self, start: str, end: str) -> Tuple[Optional[List[str]], Optional[float]]:
        """
        Find fastest path using A* algorithm
        Returns: (path, total_duration)
        """
        if start not in self.graph:
            return None, None
        
        # Initialize scores
        self.g_score = {node: float('infinity') for node in self.graph}
        self.g_score[start] = 0
        
        self.f_score = {node: float('infinity') for node in self.graph}
        self.f_score[start] = self.heuristic(start, end)
        
        self.previous = {node: None for node in self.graph}
        
        # Priority queue: (f_score, node)
        open_set = [(self.f_score[start], start)]
        closed_set = set()
        
        while open_set:
            current_f, current_node = heapq.heappop(open_set)
            
            if current_node in closed_set:
                continue
            
            closed_set.add(current_node)
            
            # Found destination
            if current_node == end:
                break
            
            # Check neighbors
            if current_node in self.graph:
                for neighbor in self.graph[current_node]:
                    neighbor_node = neighbor['node']
                    
                    if neighbor_node in closed_set:
                        continue
                    
                    tentative_g_score = self.g_score[current_node] + neighbor['weight']
                    
                    if tentative_g_score < self.g_score.get(neighbor_node, float('infinity')):
                        self.previous[neighbor_node] = current_node
                        self.g_score[neighbor_node] = tentative_g_score
                        self.f_score[neighbor_node] = tentative_g_score + self.heuristic(neighbor_node, end)
                        
                        heapq.heappush(open_set, (self.f_score[neighbor_node], neighbor_node))
        
        # Reconstruct path
        path = self._reconstruct_path(start, end)
        total_duration = self.g_score.get(end, None)
        
        return path, total_duration
    
    def _reconstruct_path(self, start: str, end: str) -> Optional[List[str]]:
        """Reconstruct path from start to end"""
        if end not in self.previous:
            return None
        
        path = []
        current = end
        
        while current is not None:
            path.append(current)
            current = self.previous.get(current)
        
        path.reverse()
        
        if path[0] != start:
            return None
        
        return path
    
    def optimize_route(self, routes: List[Dict]) -> Dict:
        """
        Analyze multiple routes and find the fastest one
        Considers traffic delays
        """
        if not routes:
            return None
        
        fastest_route = None
        min_duration = float('infinity')
        
        for route in routes:
            total_duration = 0
            
            if 'legs' in route:
                for leg in route['legs']:
                    # Prefer duration_in_traffic if available
                    duration = leg.get('duration_in_traffic', leg.get('duration', {})).get('value', 0)
                    total_duration += duration
            
            if total_duration < min_duration:
                min_duration = total_duration
                fastest_route = route
        
        if fastest_route:
            return {
                'route': fastest_route,
                'total_duration': min_duration,
                'algorithm': 'A*',
                'optimization_type': 'fastest_time'
            }
        
        return None
