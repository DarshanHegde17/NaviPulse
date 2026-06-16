from typing import Dict, List, Optional

HIGHWAY_KEYWORDS = (
    'nh', 'sh', 'express', 'highway', 'motorway', 'freeway',
    'bypass', 'ring road', 'outer ring', 'e-way', 'national highway',
)
GOOD_ROAD_KEYWORDS = ('main road', 'avenue', 'boulevard', 'flyover', 'bridge')
POOR_ROAD_KEYWORDS = ('lane', 'alley', 'narrow', 'unpaved', 'local')


def analyze_road_quality(route: Dict, formatted: Optional[Dict] = None) -> Dict:
    """Infer road quality from route summary and step instructions."""
    text_parts = [route.get('summary', '').lower()]
    if formatted:
        text_parts.append(formatted.get('summary', '').lower())
    for leg in route.get('legs', []):
        for step in leg.get('steps', []):
            instr = step.get('html_instructions', step.get('instruction', ''))
            text_parts.append(str(instr).lower())

    combined = ' '.join(text_parts)
    highway_hits = sum(1 for kw in HIGHWAY_KEYWORDS if kw in combined)
    good_hits = sum(1 for kw in GOOD_ROAD_KEYWORDS if kw in combined)
    poor_hits = sum(1 for kw in POOR_ROAD_KEYWORDS if kw in combined)

    score = 50 + highway_hits * 15 + good_hits * 8 - poor_hits * 12
    score = max(0, min(100, score))

    if score >= 75:
        rating, label = 'Excellent', 'Major highways — smooth, wide roads'
    elif score >= 55:
        rating, label = 'Good', 'Well-maintained main roads'
    elif score >= 35:
        rating, label = 'Fair', 'Mix of main and local roads'
    else:
        rating, label = 'Moderate', 'More local streets — drive carefully'

    return {
        'rating': rating,
        'score': score,
        'label': label,
        'uses_highway': highway_hits > 0,
    }


def build_traffic_explanation(traffic: Dict) -> str:
    status = traffic.get('status', 'unknown')
    delay_pct = traffic.get('delay_percentage', 0)
    delay_min = round(traffic.get('delay', 0) / 60)

    if status == 'Low':
        return 'Traffic is light — minimal delays expected'
    if status == 'Medium':
        return f'Moderate traffic — about {delay_min} min extra delay ({delay_pct:.0f}% slower)'
    if status == 'Heavy':
        return f'Heavy congestion — expect ~{delay_min} min delay ({delay_pct:.0f}% slower than usual)'
    return 'Traffic conditions unknown'


def build_route_explanation(
    formatted: Dict,
    road_quality: Dict,
    tags: List[str],
) -> str:
    parts = []
    traffic = formatted.get('traffic', {})
    parts.append(build_traffic_explanation(traffic))
    parts.append(road_quality.get('label', 'Standard road conditions'))

    if 'fastest' in tags:
        parts.append('Fastest option with current traffic')
    if 'shortest' in tags:
        parts.append('Shortest distance')
    if 'balanced' in tags:
        parts.append('Best balance of time and distance')
    if 'best' in tags:
        parts.append('Recommended overall choice')

    return ' · '.join(parts)


def pick_best_route(analysis: Dict, formatted_routes: List[Dict]) -> int:
    """Score routes: lower traffic delay + shorter time + better roads wins."""
    if not formatted_routes:
        return 0

    best_idx = 0
    best_score = float('inf')

    for idx, route in enumerate(formatted_routes):
        traffic = route.get('traffic', {})
        delay_pct = traffic.get('delay_percentage', 0)
        duration = route.get('duration', {}).get('value', 1)
        distance = route.get('distance', {}).get('value', 1)
        road_score = route.get('road_quality', {}).get('score', 50)

        # Normalize: prefer low delay, short time, good roads
        norm_delay = delay_pct / 100
        norm_time = duration / max(r['duration']['value'] for r in formatted_routes)
        norm_dist = distance / max(r['distance']['value'] for r in formatted_routes)
        norm_road = 1 - (road_score / 100)

        total = norm_delay * 0.4 + norm_time * 0.35 + norm_dist * 0.15 + norm_road * 0.1

        if total < best_score:
            best_score = total
            best_idx = idx

    return best_idx
