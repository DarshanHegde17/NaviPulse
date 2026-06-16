import heapq
from typing import Dict, List, Tuple, Optional

class DijkstraAlgorithm:
    """
    Dijkstra's Algorithm implementation for finding shortest path
    Used for route optimization based on distance
    """
    
    def __init__(self):
        self.graph = {}
        self.distances = {}
        self.previous = {}
    
    def build_graph(self, routes_data: List[Dict]) -> None:
        """
        Build graph from Google Maps route data
        Each node represents a waypoint, edges represent segments
        """
        self.graph = {}
        
        for route in routes_data:
            if 'legs' in route:
                for leg in route['legs']:
                    start = leg.get('start_address', '')
                    end = leg.get('end_address', '')
                    distance = leg.get('distance', {}).get('value', 0)  # in meters
                    
                    if start not in self.graph:
                        self.graph[start] = []
                    
                    self.graph[start].append({
                        'node': end,
                        'weight': distance
                    })
    
    def find_shortest_path(self, start: str, end: str) -> Tuple[Optional[List[str]], Optional[float]]:
        """
        Find shortest path using Dijkstra's algorithm
        Returns: (path, total_distance)
        """
        if start not in self.graph:
            return None, None
        
        # Initialize distances
        self.distances = {node: float('infinity') for node in self.graph}
        self.distances[start] = 0
        self.previous = {node: None for node in self.graph}
        
        # Priority queue: (distance, node)
        pq = [(0, start)]
        visited = set()
        
        while pq:
            current_distance, current_node = heapq.heappop(pq)
            
            if current_node in visited:
                continue
            
            visited.add(current_node)
            
            # Found destination
            if current_node == end:
                break
            
            # Check neighbors
            if current_node in self.graph:
                for neighbor in self.graph[current_node]:
                    neighbor_node = neighbor['node']
                    weight = neighbor['weight']
                    distance = current_distance + weight
                    
                    if distance < self.distances.get(neighbor_node, float('infinity')):
                        self.distances[neighbor_node] = distance
                        self.previous[neighbor_node] = current_node
                        heapq.heappush(pq, (distance, neighbor_node))
        
        # Reconstruct path
        path = self._reconstruct_path(start, end)
        total_distance = self.distances.get(end, None)
        
        return path, total_distance
    
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
        Analyze multiple routes and find the shortest one
        Returns the optimized route with metrics
        """
        if not routes:
            return None
        
        shortest_route = None
        min_distance = float('infinity')
        
        for route in routes:
            total_distance = 0
            
            if 'legs' in route:
                for leg in route['legs']:
                    distance = leg.get('distance', {}).get('value', 0)
                    total_distance += distance
            
            if total_distance < min_distance:
                min_distance = total_distance
                shortest_route = route
        
        if shortest_route:
            return {
                'route': shortest_route,
                'total_distance': min_distance,
                'algorithm': 'Dijkstra',
                'optimization_type': 'shortest_distance'
            }
        
        return None
