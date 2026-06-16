let trafficMap;
let cityMarker;
let searchMarker;
let basemapCtrl;
let placesCtrl;
let trafficLayer;
let heatLayer;
let incidentLayer;
let layerMode = 'both';
let showPlaces = true;
let currentCityKey = 'bengaluru';
let incidentTimerId = null;
let currentSearch = null;

const SEARCH_ZOOM = 16;
const NOMINATIM_HEADERS = MapPlaces.NOMINATIM_HEADERS;

const CITIES = {
    bengaluru: { name: 'Bengaluru', coords: [12.9716, 77.5946], zoom: 11, bbox: [76.7, 12.6, 78.1, 13.2] },
    mysuru: { name: 'Mysuru', coords: [12.2958, 76.6394], zoom: 12, bbox: [76.4, 12.1, 76.9, 12.5] },
    hyderabad: { name: 'Hyderabad', coords: [17.385, 78.4867], zoom: 11, bbox: [78.1, 17.1, 78.8, 17.6] },
    delhi: { name: 'Delhi', coords: [28.6139, 77.209], zoom: 11, bbox: [76.8, 28.3, 77.6, 28.9] },
    mumbai: { name: 'Mumbai', coords: [19.076, 72.8777], zoom: 11, bbox: [72.6, 18.8, 73.2, 19.4] },
    chennai: { name: 'Chennai', coords: [13.0827, 80.2707], zoom: 11, bbox: [79.9, 12.9, 80.5, 13.3] },
    kolkata: { name: 'Kolkata', coords: [22.5726, 88.3639], zoom: 11, bbox: [88.1, 22.4, 88.6, 22.8] },
    ahmedabad: { name: 'Ahmedabad', coords: [23.0225, 72.5714], zoom: 11, bbox: [72.3, 22.8, 72.8, 23.2] },
    pune: { name: 'Pune', coords: [18.5204, 73.8567], zoom: 11, bbox: [73.6, 18.3, 74.1, 18.7] },
};

const FETCH_TIMEOUT_MS = 15000;

function setTrafficNote(message) {
    const noteEl = document.getElementById('trafficNote');
    if (noteEl) noteEl.textContent = message;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
    return MapPlaces.fetchWithTimeout(url, options, timeoutMs);
}

function initTrafficMap() {
    if (trafficMap) return;

    trafficMap = L.map('trafficCityMap', {
        center: CITIES.bengaluru.coords,
        zoom: CITIES.bengaluru.zoom,
        minZoom: 5,
        maxZoom: 19,
    });

    basemapCtrl = MapPlaces.attachDetailedBasemap(trafficMap, [
        ['trafficPane', 410],
        ['incidentPane', 620],
    ]);

    placesCtrl = MapPlaces.createController(trafficMap, {
        raiseLabels: () => basemapCtrl.raiseLabels(),
        onCountChange: () => updatePoiHint(),
        onStatusChange: (status, msg) => {
            if (status === 'error') {
                const hint = document.getElementById('poiZoomHint');
                if (hint) hint.textContent = `Could not load places (${msg}). Try zooming in again.`;
            }
        },
    });

    trafficMap.on('moveend', schedulePoiRefresh);
    trafficMap.on('zoomend', () => {
        placesCtrl.onZoomEnd();
        updatePoiHint();
    });

    cityMarker = L.marker(CITIES.bengaluru.coords).addTo(trafficMap);
    cityMarker.bindPopup(`<b>${CITIES.bengaluru.name}</b>`);
    setTimeout(() => trafficMap.invalidateSize(), 80);
}

function schedulePoiRefresh() {
    placesCtrl?.scheduleRefresh();
}

function updatePoiHint() {
    const hint = document.getElementById('poiZoomHint');
    if (!hint || !trafficMap) return;
    const zoom = trafficMap.getZoom();
    const count = placesCtrl?.getCount() || 0;
    if (!showPlaces) {
        hint.textContent = 'Places layer is off — turn on “Places” to see hotels, hospitals, schools, and shops.';
        return;
    }
    if (zoom < MapPlaces.POI_MIN_ZOOM) {
        hint.textContent = 'Zoom in closer to load hotels, hospitals, schools, shops, and clearer road names.';
    } else if (count > 0) {
        hint.textContent = `Showing ${count} nearby places. Click a pin for details.`;
    } else {
        hint.textContent = 'Loading nearby places… Pan or zoom slightly if none appear.';
    }
}

function setShowPlaces(enabled) {
    showPlaces = enabled;
    placesCtrl?.setShowPlaces(enabled);
    document.querySelectorAll('.places-toggle').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.places === (enabled ? 'on' : 'off'));
    });
    updatePoiHint();
}

function ensureIncidentLayer() {
    if (!incidentLayer) {
        incidentLayer = L.layerGroup();
        incidentLayer.addTo(trafficMap);
    }
    incidentLayer.clearLayers();
}

function bboxAround(lat, lon, delta = 0.08) {
    return [
        Math.max(-180, lon - delta),
        Math.max(-85, lat - delta),
        Math.min(180, lon + delta),
        Math.min(85, lat + delta),
    ];
}

/** TomTom GeoJSON: Point [lon,lat] or LineString [[lon,lat], ...] */
function getIncidentLatLngs(inc) {
    const geom = inc.geometry;
    if (!geom?.coordinates) return [];

    if (geom.type === 'Point' && Array.isArray(geom.coordinates) && geom.coordinates.length >= 2) {
        const [lon, lat] = geom.coordinates;
        return [[lat, lon]];
    }

    const ring =
        geom.type === 'LineString'
            ? geom.coordinates
            : geom.type === 'Polygon' && Array.isArray(geom.coordinates[0])
              ? geom.coordinates[0]
              : null;

    if (!ring) return [];
    return ring
        .filter((c) => Array.isArray(c) && c.length >= 2)
        .map(([lon, lat]) => [lat, lon]);
}

function drawIncidentMarker(inc) {
    const latLngs = getIncidentLatLngs(inc);
    if (!latLngs.length) return;

    const props = inc.properties || {};
    const delay = props.magnitudeOfDelay || 0;
    let color = '#ff9900';
    if (delay >= 4) color = '#ff2b1f';
    else if (delay <= 1) color = '#ffd54a';

    const road = (props.roadNumbers || []).join(', ') || 'Road';
    const desc = (props.events || [])[0]?.description || 'Traffic incident';
    const lengthKm = props.lengthInMeters ? (props.lengthInMeters / 1000).toFixed(1) : null;
    const popupHtml = `
        <b>${road}</b><br>
        ${desc}<br>
        ${lengthKm ? `Affected stretch: ${lengthKm} km<br>` : ''}
        Delay level: ${delay || 'n/a'}
    `;

    if (latLngs.length > 1) {
        L.polyline(latLngs, { color, weight: 4, opacity: 0.85, pane: 'incidentPane' })
            .bindPopup(popupHtml)
            .addTo(incidentLayer);
    }

    const [lat, lon] = latLngs[0];
    L.circleMarker([lat, lon], {
        radius: 6,
        color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.8,
        pane: 'incidentPane',
    })
        .bindPopup(popupHtml)
        .addTo(incidentLayer);
}

const DELAY_LABELS = ['—', 'Low', 'Moderate', 'Heavy', 'Severe'];

function buildHeatPoints(incidents) {
    const points = [];
    (incidents || []).forEach((inc) => {
        const latLngs = getIncidentLatLngs(inc);
        const delay = inc.properties?.magnitudeOfDelay || 1;
        const intensity = Math.min(1, 0.3 + delay * 0.18);
        latLngs.forEach(([lat, lon]) => points.push([lat, lon, intensity]));
    });
    return points;
}

function updateHeatStats(incidents) {
    const list = incidents || [];
    const hotspotsEl = document.getElementById('heatHotspots');
    const peakEl = document.getElementById('heatPeakDelay');
    const avgEl = document.getElementById('heatAvgDelay');
    if (!hotspotsEl) return;

    if (!list.length) {
        hotspotsEl.textContent = '0';
        peakEl.textContent = '—';
        avgEl.textContent = '—';
        return;
    }

    const delays = list.map((i) => i.properties?.magnitudeOfDelay || 0);
    const peak = Math.max(...delays);
    const avg = delays.reduce((a, b) => a + b, 0) / delays.length;

    hotspotsEl.textContent = String(list.length);
    peakEl.textContent = DELAY_LABELS[Math.min(peak, 4)] || '—';
    avgEl.textContent = avg < 1.5 ? 'Low' : avg < 3 ? 'Medium' : 'High';
}

function updateHeatLayer(incidents) {
    if (!trafficMap || typeof L.heatLayer !== 'function') return;

    if (heatLayer) {
        trafficMap.removeLayer(heatLayer);
        heatLayer = null;
    }

    const points = buildHeatPoints(incidents);
    if (!points.length || layerMode === 'flow') return;

    heatLayer = L.heatLayer(points, {
        radius: 32,
        blur: 24,
        maxZoom: 17,
        minOpacity: 0.4,
        gradient: {
            0.15: '#36d636',
            0.45: '#ffcc00',
            0.7: '#ff9900',
            1: '#ff2b1f',
        },
    });
    heatLayer.addTo(trafficMap);
}

function applyLayerMode() {
    if (!trafficMap) return;

    if (trafficLayer) {
        if (layerMode === 'heat') trafficMap.removeLayer(trafficLayer);
        else trafficMap.addLayer(trafficLayer);
    }

    if (heatLayer) {
        if (layerMode === 'flow') trafficMap.removeLayer(heatLayer);
        else trafficMap.addLayer(heatLayer);
    }

    if (incidentLayer) {
        if (layerMode === 'heat') trafficMap.removeLayer(incidentLayer);
        else trafficMap.addLayer(incidentLayer);
    }
    basemapCtrl?.raiseLabels();
}

function setLayerMode(mode) {
    layerMode = mode;
    document.querySelectorAll('.layer-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.layer === mode);
    });
    applyLayerMode();
}

function updateTrafficStatusFromIncidents(areaName, incidents) {
    const levelEl = document.getElementById('trafficLevel');
    const flowHint =
        ' Green/orange/red roads = live flow. Zoom in for road names, hotels, schools & shops.';
    if (!incidents || incidents.length === 0) {
        if (levelEl) {
            levelEl.textContent = 'Low';
            levelEl.className = 'traffic-level low';
        }
        setTrafficNote(`${areaName}: No major live incidents right now.${flowHint}`);
        return;
    }

    const avgDelay =
        incidents.reduce((sum, i) => sum + (i.properties?.magnitudeOfDelay || 0), 0) / incidents.length;
    let level = 'Low';
    if (avgDelay >= 3) level = 'Heavy';
    else if (avgDelay >= 1.5) level = 'Medium';
    if (levelEl) {
        levelEl.textContent = level;
        levelEl.className = `traffic-level ${level.toLowerCase()}`;
    }
    setTrafficNote(
        `${areaName}: ${incidents.length} live incident(s).${flowHint} Refreshes every 45s.`
    );
}

async function fetchIncidentsFromTomTomDirect(bboxStr, key) {
    const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?bbox=${bboxStr}&key=${encodeURIComponent(key)}`;
    const res = await fetchWithTimeout(url);
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data?.detailedError?.message || data?.error || `HTTP ${res.status}`);
    }
    return data?.incidents || [];
}

async function fetchIncidentsFromBackend(bboxStr) {
    const path = API_CONFIG.ENDPOINTS.ROUTES.TRAFFIC_INCIDENTS;
    const url = `${API_CONFIG.BASE_URL}${path}?bbox=${encodeURIComponent(bboxStr)}`;
    const res = await fetchWithTimeout(url);
    const data = await res.json();
    if (!res.ok) {
        const err = new Error(data?.error || `HTTP ${res.status}`);
        err.status = res.status;
        throw err;
    }
    return data?.incidents || [];
}

async function fetchIncidentsByBbox(bbox, areaLabel) {
    if (!bbox) return [];

    const [minLon, minLat, maxLon, maxLat] = bbox;
    const bboxStr = `${minLon},${minLat},${maxLon},${maxLat}`;
    const key = API_CONFIG.TOMTOM_TRAFFIC_API_KEY;

    setTrafficNote(`Fetching live traffic for ${areaLabel}…`);

    try {
        let incidents = [];
        try {
            incidents = await fetchIncidentsFromBackend(bboxStr);
        } catch (backendErr) {
            if (backendErr.status === 503 && key) {
                incidents = await fetchIncidentsFromTomTomDirect(bboxStr, key);
            } else if (key) {
                incidents = await fetchIncidentsFromTomTomDirect(bboxStr, key);
            } else {
                throw backendErr;
            }
        }

        ensureIncidentLayer();
        updateHeatLayer(incidents);
        incidents.forEach((inc) => {
            try {
                drawIncidentMarker(inc);
            } catch (drawErr) {
                console.warn('Skip incident marker:', drawErr);
            }
        });
        basemapCtrl?.raiseLabels();
        updateTrafficStatusFromIncidents(areaLabel, incidents);
        updateHeatStats(incidents);
        applyLayerMode();
        schedulePoiRefresh();
        return incidents;
    } catch (err) {
        const msg =
            err.name === 'AbortError'
                ? 'Request timed out — check backend is running (python app.py).'
                : err.message;
        console.warn('Traffic incidents error:', msg);
        const levelEl = document.getElementById('trafficLevel');
        if (levelEl) {
            levelEl.textContent = 'Medium';
            levelEl.className = 'traffic-level medium';
        }
        setTrafficNote(
            `${areaLabel}: Could not load incidents (${msg}). Map and flow colors may still work.`
        );
        updateHeatStats([]);
        updateHeatLayer([]);
        schedulePoiRefresh();
        return [];
    }
}

async function fetchIncidentsForCurrentView() {
    if (currentSearch) {
        await fetchIncidentsByBbox(currentSearch.bbox, currentSearch.label);
        return;
    }
    const city = CITIES[currentCityKey];
    if (city?.bbox) await fetchIncidentsByBbox(city.bbox, city.name);
}

function getTrafficOverlayOpacity() {
    return basemapCtrl?.isSatellite() ? 0.48 : 0.52;
}

function attachTrafficLayer() {
    const key = API_CONFIG.TOMTOM_TRAFFIC_API_KEY;
    const note = document.getElementById('trafficApiNote');
    if (!key) {
        note.textContent = 'Live traffic overlay requires a TomTom Traffic API key. Showing map only.';
        note.className = 'api-note warn';
        return;
    }

    trafficLayer = L.tileLayer(
        `https://api.tomtom.com/traffic/map/4/tile/flow/relative/{z}/{x}/{y}.png?key=${encodeURIComponent(key)}`,
        { pane: 'trafficPane', opacity: getTrafficOverlayOpacity() }
    ).addTo(trafficMap);
    basemapCtrl?.raiseLabels();
    note.textContent = 'Live traffic overlay + incidents enabled (TomTom).';
    note.className = 'api-note ok';
}

function setTrafficBasemap(style) {
    basemapCtrl?.setBasemapStyle(style);
    document.querySelectorAll('.basemap-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.basemap === style);
    });
    if (trafficLayer) {
        trafficLayer.setOpacity(getTrafficOverlayOpacity());
    }
    basemapCtrl?.raiseLabels();
}

async function setCity(cityKey) {
    const city = CITIES[cityKey];
    if (!city || !trafficMap) return;
    currentCityKey = cityKey;
    currentSearch = null;

    if (searchMarker) {
        trafficMap.removeLayer(searchMarker);
        searchMarker = null;
    }

    trafficMap.setView(city.coords, city.zoom);
    cityMarker.setLatLng(city.coords).bindPopup(`<b>${city.name}</b>`).openPopup();
    document.getElementById('selectedCityName').textContent = city.name;
    document.querySelectorAll('.city-chip').forEach((chip) => {
        chip.classList.toggle('active', chip.dataset.city === cityKey);
    });
    await fetchIncidentsForCurrentView();
    schedulePoiRefresh();
}

async function geocodeSearchQuery(query) {
    const normalized = query.toLowerCase().replace(/\s+/g, ' ').trim();
    const variants = [
        `${query}, Bengaluru, Karnataka, India`,
        `${query}, Bangalore, India`,
        normalized.includes('india') ? query : `${query}, India`,
    ];
    if (/nagara$/i.test(query)) {
        variants.unshift(`${query.replace(/nagara$/i, 'nagar')}, Bengaluru, India`);
    } else if (/nagar/i.test(query) && !/bengaluru|bangalore/i.test(query)) {
        variants.unshift(`${query}, Bengaluru, India`);
    }

    for (const q of variants) {
        const url =
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}` +
            '&limit=8&countrycodes=in&addressdetails=1';
        const res = await fetchWithTimeout(url, { headers: NOMINATIM_HEADERS });
        const data = await res.json();
        if (!data?.length) continue;

        const needle = normalized.replace(/[^a-z0-9]/g, '');
        const ranked = data
            .map((item) => {
                const name = (item.display_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                let score = 0;
                if (name.includes(needle) || needle.includes(name.slice(0, Math.min(needle.length, 12)))) {
                    score += 10;
                }
                if (/bengaluru|bangalore|karnataka/.test(item.display_name || '')) score += 5;
                if (['suburb', 'neighbourhood', 'quarter', 'residential'].includes(item.type)) score += 3;
                return { item, score };
            })
            .sort((a, b) => b.score - a.score);

        return ranked[0].item;
    }
    return null;
}

async function searchPlaceAndShow() {
    const input = document.getElementById('trafficSearch');
    const query = (input?.value || '').trim();
    if (!query || !trafficMap) return;

    setTrafficNote(`Searching for "${query}"…`);

    try {
        const item = await geocodeSearchQuery(query);
        if (!item) {
            setTrafficNote(`No result found for "${query}". Try "Hegde Nagar, Bengaluru".`);
            return;
        }
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);

        trafficMap.setView([lat, lon], SEARCH_ZOOM);
        if (searchMarker) trafficMap.removeLayer(searchMarker);
        searchMarker = L.marker([lat, lon]).addTo(trafficMap);
        const shortName = item.display_name?.split(',')[0] || query;
        searchMarker
            .bindPopup(`<b>${shortName}</b><br><small>${item.display_name || query}</small><br>Road names & places load at this zoom`)
            .openPopup();

        document.querySelectorAll('.city-chip').forEach((chip) => chip.classList.remove('active'));
        document.getElementById('selectedCityName').textContent = query;

        currentSearch = {
            label: query,
            bbox: bboxAround(lat, lon, 0.08),
        };
        await fetchIncidentsForCurrentView();
        schedulePoiRefresh();
    } catch (err) {
        const msg = err.name === 'AbortError' ? 'Search timed out. Try again.' : err.message;
        setTrafficNote(`Search failed: ${msg}`);
    }
}

function startIncidentAutoRefresh() {
    if (incidentTimerId) clearInterval(incidentTimerId);
    incidentTimerId = setInterval(() => {
        fetchIncidentsForCurrentView();
    }, 45000);
}

document.addEventListener('DOMContentLoaded', async () => {
    setTrafficNote('Starting live traffic…');
    initTrafficMap();
    attachTrafficLayer();
    applyLayerMode();
    startIncidentAutoRefresh();

    document.querySelectorAll('.city-chip').forEach((chip) => {
        chip.addEventListener('click', () => setCity(chip.dataset.city));
    });
    document.querySelectorAll('.layer-btn[data-layer]').forEach((btn) => {
        btn.addEventListener('click', () => setLayerMode(btn.dataset.layer));
    });
    document.querySelectorAll('.basemap-btn').forEach((btn) => {
        btn.addEventListener('click', () => setTrafficBasemap(btn.dataset.basemap));
    });
    document.querySelectorAll('.places-toggle').forEach((btn) => {
        btn.addEventListener('click', () => setShowPlaces(btn.dataset.places === 'on'));
    });
    document.getElementById('searchTrafficBtn')?.addEventListener('click', searchPlaceAndShow);
    document.getElementById('trafficSearch')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchPlaceAndShow();
        }
    });

    await setCity('bengaluru');
    updatePoiHint();
    const user = getCurrentUser();
    if (user?.username) {
        document.getElementById('welcomeUser').textContent = `Traffic Updates, ${user.username}`;
    }
});
