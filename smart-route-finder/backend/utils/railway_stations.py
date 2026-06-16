import json
import os
import re
from collections import defaultdict

_stations = None
_by_state = None
_by_code = None

DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'railway_stations.json')


def _infer_type(name):
    upper = (name or '').upper()
    if re.search(r'\bJN\b|\bJNC\b|\bJUNCTION\b', upper):
        return 'Junction'
    if re.search(r'\bHALT\b|\bHT\b', upper):
        return 'Halt'
    if re.search(r'\bTERM\b|\bTERMINAL\b|\bCANTT\b', upper):
        return 'Terminal'
    return 'Station'


def _estimate_stats(code, name):
    seed = sum(ord(c) for c in (code or ''))
    return {
        'type': _infer_type(name),
        'platforms': 2 + (seed % 6),
        'dailyTrains': 8 + (seed % 45),
        'crew': 120 + (seed % 800),
        'areaSqKm': round(0.08 + (seed % 30) / 100, 2),
        'yearOpened': 1880 + (seed % 120),
    }


def _normalize_station(raw):
    code = (raw.get('code') or '').upper()
    name = raw.get('name') or code
    stats = _estimate_stats(code, name)
    return {
        'id': code.lower(),
        'code': code,
        'name': name,
        'city': raw.get('city') or name,
        'state': raw.get('state') or 'Unknown',
        'zone': raw.get('zone') or '',
        'lat': raw.get('lat'),
        'lng': raw.get('lng'),
        **stats,
    }


def load_railway_stations():
    global _stations, _by_state, _by_code
    if _stations is not None:
        return

    if not os.path.isfile(DATA_PATH):
        _stations = []
        _by_state = defaultdict(list)
        _by_code = {}
        return

    with open(DATA_PATH, encoding='utf-8') as fh:
        raw_list = json.load(fh)

    _stations = []
    _by_state = defaultdict(list)
    _by_code = {}

    for raw in raw_list:
        station = _normalize_station(raw)
        _stations.append(station)
        _by_state[station['state']].append(station)
        _by_code[station['code']] = station

    for state_name in _by_state:
        _by_state[state_name].sort(key=lambda s: s['name'])


def get_all_states():
    load_railway_stations()
    return sorted(_by_state.keys())


def get_state_summary():
    load_railway_stations()
    return [
        {'state': name, 'count': len(stations)}
        for name, stations in sorted(_by_state.items(), key=lambda x: x[0])
    ]


def get_station_by_code(code):
    load_railway_stations()
    return _by_code.get((code or '').upper())


def search_stations(state=None, query=None, limit=80, offset=0):
    load_railway_stations()
    limit = max(1, min(int(limit or 80), 200))
    offset = max(0, int(offset or 0))
    q = (query or '').strip().lower()

    if state:
        pool = list(_by_state.get(state, []))
    else:
        pool = _stations

    if q:
        pool = [
            s for s in pool
            if q in s['code'].lower()
            or q in s['name'].lower()
            or q in s['city'].lower()
        ]

    total = len(pool)
    page = pool[offset:offset + limit]
    return page, total


def total_station_count():
    load_railway_stations()
    return len(_stations)
