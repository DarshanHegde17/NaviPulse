import re
from html import unescape
from typing import Dict, List, Optional, Tuple

GENERIC_ROAD_NAMES = frozenset({
    '', 'road', 'unnamed road', 'unnamed', 'local road', 'residential',
    'service road', 'footway', 'path', 'track', 'link', 'ramp',
})

HIGHWAY_PATTERN = re.compile(
    r'\b(NH\s*\d+|SH\s*\d+|NE\s*\d+|NH-\d+|SH-\d+|'
    r'expressway|highway|motorway|freeway|e-way|bypass|ring road|'
    r'outer ring|inner ring|national highway|state highway)\b',
    re.I,
)
HTML_TAG_RE = re.compile(r'<[^>]+>')


def _strip_html(text: str) -> str:
    if not text:
        return ''
    return unescape(HTML_TAG_RE.sub('', text)).strip()


def _get_step_location(step: Dict) -> Optional[Tuple[float, float]]:
    maneuver = step.get('maneuver') or {}
    loc = maneuver.get('location')
    if loc and len(loc) >= 2:
        return float(loc[1]), float(loc[0])  # OSRM: [lng, lat] -> lat, lng
    start = step.get('start_location') or step.get('end_location')
    if start:
        return float(start.get('lat', 0)), float(start.get('lng', 0))
    return None


def _get_step_road_name(step: Dict) -> str:
    name = (step.get('name') or '').strip()
    ref = (step.get('ref') or '').strip()
    if ref and name and ref.lower() not in name.lower():
        return f'{ref} — {name}'
    if ref:
        return ref
    if name and name.lower() not in GENERIC_ROAD_NAMES:
        return name

    html = step.get('html_instructions', '')
    plain = _strip_html(html)
    # Google: "Turn left onto <b>NH 48</b>"
    bold = re.findall(r'<b>([^<]+)</b>', html, re.I)
    for part in bold:
        part = part.strip()
        if part and part.lower() not in GENERIC_ROAD_NAMES and len(part) > 2:
            return part
    if plain:
        onto = re.search(r'(?:onto|on|toward|via)\s+(.+?)(?:\s+for|\s+toward|$)', plain, re.I)
        if onto:
            candidate = onto.group(1).strip().rstrip('.')
            if candidate and candidate.lower() not in GENERIC_ROAD_NAMES:
                return candidate[:80]
    return ''


def _classify_via(name: str) -> str:
    lower = name.lower()
    if HIGHWAY_PATTERN.search(name):
        return 'highway'
    if any(x in lower for x in ('toll', 'plaza', 'flyover', 'bridge', 'tunnel')):
        return 'toll'
    if any(x in lower for x in ('city', 'district', 'taluk', 'nagar', 'puram', 'abad', 'uru')):
        return 'city'
    return 'road'


def _normalize_name(name: str) -> str:
    return re.sub(r'\s+', ' ', name.strip())


def _select_key_vias(candidates: List[Dict], max_points: int = 10) -> List[Dict]:
    if len(candidates) <= max_points:
        return candidates

    # Always keep highways and tolls first
    priority = [c for c in candidates if c['type'] in ('highway', 'toll')]
    others = [c for c in candidates if c['type'] not in ('highway', 'toll')]

    selected = []
    seen_names = set()

    for c in priority + others:
        key = c['name'].lower()[:40]
        if key in seen_names:
            continue
        seen_names.add(key)
        selected.append(c)
        if len(selected) >= max_points:
            break

    # Ensure even spacing if still too few unique highways
    if len(selected) < max_points and len(candidates) > len(selected):
        step = max(1, len(candidates) // (max_points - len(selected) + 1))
        for c in candidates[::step]:
            key = c['name'].lower()[:40]
            if key not in seen_names:
                seen_names.add(key)
                selected.append(c)
            if len(selected) >= max_points:
                break

    selected.sort(key=lambda x: x.get('km', 0))
    return selected[:max_points]


def extract_via_points(route: Dict, max_points: int = 10) -> List[Dict]:
    """Extract major roads, highways, and waypoints along a route."""
    candidates = []
    cumulative_m = 0

    for leg in route.get('legs', []):
        for step in leg.get('steps', []):
            dist_raw = step.get('distance', 0)
            if isinstance(dist_raw, dict):
                dist = int(dist_raw.get('value', 0) or 0)
            else:
                dist = int(dist_raw or 0)
            cumulative_m += dist

            name = _normalize_name(_get_step_road_name(step))
            if not name or name.lower() in GENERIC_ROAD_NAMES:
                continue
            if len(name) < 3:
                continue

            loc = _get_step_location(step)
            via = {
                'name': name,
                'type': _classify_via(name),
                'km': round(cumulative_m / 1000, 1),
            }
            if loc:
                via['lat'] = loc[0]
                via['lng'] = loc[1]

            if candidates and candidates[-1]['name'].lower() == name.lower():
                continue
            candidates.append(via)

    return _select_key_vias(candidates, max_points)


def build_via_summary(via_points: List[Dict], fallback: str = '') -> str:
    if not via_points:
        return fallback
    names = [v['name'] for v in via_points[:4]]
    summary = ' → '.join(names)
    if len(via_points) > 4:
        summary += f' (+{len(via_points) - 4} more)'
    return summary
