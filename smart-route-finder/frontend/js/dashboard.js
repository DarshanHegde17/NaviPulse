// Dashboard JavaScript

let map;
let routeLayer;
let markerLayer;
let cityMarkerLayer;
let currentRoutes = [];
let currentSearchData = null;
let routePolylines = {};
let viaMarkerLayer;
let selectedRouteId = null;
let savedRouteKeys = new Set();
let basemapCtrl = null;
let placesCtrl = null;
let dashboardShowPlaces = true;

const ROUTE_COLORS = ['#ff6a00', '#4a9eff', '#36d636', '#e040fb', '#ffd600'];

const INDIA_BOUNDS = [[6.5, 68.1], [35.7, 97.5]];
const INDIA_CENTER = [20.5937, 78.9629];

const INDIA_CITIES = [
    { name: 'New Delhi', coords: [28.6139, 77.2090] },
    { name: 'Mumbai', coords: [19.0760, 72.8777] },
    { name: 'Bengaluru', coords: [12.9716, 77.5946] },
    { name: 'Chennai', coords: [13.0827, 80.2707] },
    { name: 'Kolkata', coords: [22.5726, 88.3639] },
    { name: 'Hyderabad', coords: [17.3850, 78.4867] },
    { name: 'Jaipur', coords: [26.9124, 75.7873] },
    { name: 'Ahmedabad', coords: [23.0225, 72.5714] }
];

function createOrangeIcon() {
    return L.divIcon({
        className: 'india-city-marker',
        html: '<div style="width:10px;height:10px;background:#ff6a00;border:2px solid #fff;border-radius:50%;box-shadow:0 0 8px rgba(255,106,0,0.8);"></div>',
        iconSize: [10, 10],
        iconAnchor: [5, 5]
    });
}

function updateDashboardMapLabel(poiCount) {
    const el = document.getElementById('mapAreaLabel');
    if (!el || !map) return;
    const zoom = map.getZoom();
    if (!dashboardShowPlaces) {
        el.innerHTML = '<i class="fa-solid fa-location-dot"></i> Places hidden';
        return;
    }
    if (zoom < MapPlaces.POI_MIN_ZOOM) {
        el.innerHTML = '<i class="fa-solid fa-location-dot"></i> Zoom in for roads, shops & hospitals';
        return;
    }
    if (poiCount > 0) {
        el.innerHTML = `<i class="fa-solid fa-map-pin"></i> ${poiCount} nearby places`;
    } else {
        el.innerHTML = '<i class="fa-solid fa-map-pin"></i> Loading nearby places…';
    }
}

function updateCityMarkersVisibility() {
    if (!map || !cityMarkerLayer) return;
    const showCities = map.getZoom() <= 8;
    if (showCities) {
        if (!map.hasLayer(cityMarkerLayer)) cityMarkerLayer.addTo(map);
    } else if (map.hasLayer(cityMarkerLayer)) {
        map.removeLayer(cityMarkerLayer);
    }
}

function setDashboardBasemap(style) {
    basemapCtrl?.setBasemapStyle(style);
    document.querySelectorAll('[data-basemap]').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.basemap === style);
    });
}

function toggleDashboardPlaces() {
    dashboardShowPlaces = !dashboardShowPlaces;
    const btn = document.getElementById('dashboardPlacesToggle');
    if (btn) {
        btn.classList.toggle('active', dashboardShowPlaces);
        btn.textContent = dashboardShowPlaces ? 'Places on' : 'Places off';
    }
    placesCtrl?.setShowPlaces(dashboardShowPlaces);
    updateDashboardMapLabel(placesCtrl?.getCount() || 0);
}

function initIndiaMap() {
    const mapEl = document.getElementById('indiaMap');
    if (!mapEl || map) return;

    map = L.map('indiaMap', {
        center: INDIA_CENTER,
        zoom: 5,
        minZoom: 4,
        maxZoom: 19,
        zoomControl: true,
        attributionControl: true,
    });

    basemapCtrl = MapPlaces.attachDetailedBasemap(map);
    placesCtrl = MapPlaces.createController(map, {
        raiseLabels: () => basemapCtrl.raiseLabels(),
        onCountChange: (n) => updateDashboardMapLabel(n),
        onStatusChange: (status, msg) => {
            if (status === 'error') {
                const el = document.getElementById('mapAreaLabel');
                if (el) el.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Places unavailable';
                console.warn('Dashboard places:', msg);
            }
        },
    });

    map.fitBounds(INDIA_BOUNDS, { padding: [20, 20] });

    cityMarkerLayer = L.layerGroup().addTo(map);
    markerLayer = L.layerGroup().addTo(map);
    routeLayer = L.layerGroup().addTo(map);
    viaMarkerLayer = L.layerGroup().addTo(map);

    INDIA_CITIES.forEach((city) => {
        L.marker(city.coords, { icon: createOrangeIcon() })
            .bindPopup(`<b style="color:#ff6a00;">${city.name}</b>`)
            .addTo(cityMarkerLayer);
    });

    map.on('moveend', () => placesCtrl?.scheduleRefresh());
    map.on('zoomend', () => {
        placesCtrl?.onZoomEnd();
        updateCityMarkersVisibility();
        updateDashboardMapLabel(placesCtrl?.getCount() || 0);
    });

    updateCityMarkersVisibility();
    updateDashboardMapLabel(0);
    placesCtrl.scheduleRefresh();

    setTimeout(() => map.invalidateSize(), 100);
    window.addEventListener('resize', () => map && map.invalidateSize());
}

async function geocodeLocation(query) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', India')}&limit=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();
    if (!data.length) throw new Error(`Could not find: ${query}`);
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), name: data[0].display_name };
}

/** Decode Google/OSRM encoded polyline to [lat, lng] pairs */
function decodePolyline(encoded) {
    if (!encoded) return [];
    const points = [];
    let index = 0, lat = 0, lng = 0;
    while (index < encoded.length) {
        let shift = 0, result = 0, byte;
        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);
        lat += (result & 1) ? ~(result >> 1) : (result >> 1);
        shift = 0;
        result = 0;
        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);
        lng += (result & 1) ? ~(result >> 1) : (result >> 1);
        points.push([lat / 1e5, lng / 1e5]);
    }
    return points;
}

function clearMapRoutes() {
    routePolylines = {};
    if (routeLayer) routeLayer.clearLayers();
}

function drawAllRoutesOnMap(data) {
    if (!map) initIndiaMap();
    clearMapRoutes();
    markerLayer.clearLayers();

    const routes = data.routes || [];
    const origin = data.origin?.coordinates;
    const dest = data.destination?.coordinates;
    const allBounds = [];

    routes.forEach((route, index) => {
        const coords = decodePolyline(route.polyline);
        if (!coords.length) return;

        const color = route.color || ROUTE_COLORS[index % ROUTE_COLORS.length];
        const isRecommended = route.is_recommended || data.recommendations?.best?.route_index === index;
        const weight = isRecommended ? 6 : 4;
        const opacity = isRecommended ? 1 : 0.55;

        const polyline = L.polyline(coords, {
            color,
            weight,
            opacity,
            dashArray: isRecommended ? null : '8 6',
            pane: 'routesPane',
        }).addTo(routeLayer);

        polyline.bindPopup(`
            <b style="color:${color}">${route.route_name}</b><br>
            ${route.distance.text} · ${route.duration.text}<br>
            Traffic: ${route.traffic.status}<br>
            Roads: ${route.road_quality?.rating || '—'}
        `);

        routePolylines[route.route_id] = { polyline, color, coords };
        allBounds.push(...coords);

        L.marker(coords[Math.floor(coords.length / 4)], {
            icon: L.divIcon({
                className: 'route-number-marker',
                html: `<div style="background:${color};color:#fff;font-size:11px;font-weight:bold;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);">${index + 1}</div>`,
                iconSize: [22, 22],
                iconAnchor: [11, 11],
            }),
        }).addTo(routeLayer);
    });

    const startLat = origin?.lat;
    const startLng = origin?.lng;
    const endLat = dest?.lat;
    const endLng = dest?.lng;

    if (startLat != null && startLng != null) {
        L.marker([startLat, startLng], {
            icon: L.divIcon({
                className: '',
                html: '<div style="background:#36d636;color:#000;font-size:11px;font-weight:bold;padding:4px 8px;border-radius:6px;">Start</div>',
                iconAnchor: [20, 20],
            }),
        }).bindPopup(`<b>From:</b> ${data.origin.address}`).addTo(markerLayer);
        allBounds.push([startLat, startLng]);
    }

    if (endLat != null && endLng != null) {
        L.marker([endLat, endLng], {
            icon: L.divIcon({
                className: '',
                html: '<div style="background:#ff2b1f;color:#fff;font-size:11px;font-weight:bold;padding:4px 8px;border-radius:6px;">End</div>',
                iconAnchor: [20, 20],
            }),
        }).bindPopup(`<b>To:</b> ${data.destination.address}`).addTo(markerLayer);
        allBounds.push([endLat, endLng]);
    }

    if (allBounds.length) {
        map.fitBounds(L.latLngBounds(allBounds), { padding: [50, 50] });
    }

    basemapCtrl?.raiseLabels();
    updateCityMarkersVisibility();
    placesCtrl?.scheduleRefresh();

    const bestId = data.recommendations?.best?.route_index ?? 0;
    highlightRouteOnMap(bestId, false);
}

function escapeHtml(text) {
    const el = document.createElement('span');
    el.textContent = text || '';
    return el.innerHTML;
}

function renderViaPoints(viaPoints) {
    if (!viaPoints || !viaPoints.length) return '';
    const chips = viaPoints.map((v, i) => `
        <span class="via-chip via-type-${v.type || 'road'}" title="${v.km != null ? v.km + ' km from start' : ''}">
            <span class="via-num">${i + 1}</span>${escapeHtml(v.name)}
        </span>
    `).join('');
    return `
        <div class="via-points">
            <div class="via-label"><i class="fas fa-map-pin"></i> Possible via (${viaPoints.length})</div>
            <div class="via-chips">${chips}</div>
        </div>
    `;
}

function showViaMarkersOnMap(routeId) {
    if (!viaMarkerLayer) return;
    viaMarkerLayer.clearLayers();
    const route = currentRoutes[routeId];
    if (!route?.via_points?.length) return;

    route.via_points.forEach((v, i) => {
        if (v.lat == null || v.lng == null) return;
        const typeIcon = v.type === 'highway' ? '🛣' : v.type === 'city' ? '🏙' : v.type === 'toll' ? '⛽' : '📍';
        L.marker([v.lat, v.lng], {
            icon: L.divIcon({
                className: 'via-map-marker',
                html: `<div style="background:#1a1a1a;border:2px solid #ff6a00;color:#fff;font-size:10px;font-weight:bold;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;">${i + 1}</div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10],
            }),
        })
            .bindPopup(`<b>${typeIcon} ${escapeHtml(v.name)}</b><br>${v.km != null ? v.km + ' km from start' : ''}`)
            .addTo(viaMarkerLayer);
    });
}

function highlightRouteOnMap(routeId, scrollToMap = true) {
    selectedRouteId = routeId;
    showViaMarkersOnMap(routeId);

    Object.entries(routePolylines).forEach(([id, { polyline, color }]) => {
        const isSelected = parseInt(id, 10) === routeId;
        polyline.setStyle({
            weight: isSelected ? 7 : 4,
            opacity: isSelected ? 1 : 0.35,
            color,
            dashArray: isSelected ? null : '8 6',
        });
        if (isSelected) polyline.bringToFront();
    });

    document.querySelectorAll('.route-card').forEach(card => {
        card.classList.toggle('selected', parseInt(card.dataset.routeId, 10) === routeId);
    });

    if (scrollToMap) {
        document.getElementById('mapContainer')?.scrollIntoView({ behavior: 'smooth' });
    }
}

// Search Routes
async function searchRoutes() {
    const source = document.getElementById('source').value.trim();
    const destination = document.getElementById('destination').value.trim();
    const travelMode = document.getElementById('travelMode').value;
    
    if (!source || !destination) {
        alert('Please enter both source and destination');
        return;
    }
    
    // Show loading
    document.getElementById('loadingIndicator').style.display = 'block';
    document.getElementById('resultsPanel').classList.remove('visible');
    
    try {
        const user = getCurrentUser();
        const userId = user ? user.id : null;
        
        const response = await API.searchRoutes(source, destination, travelMode, userId);
        
        currentRoutes = response.routes;
        currentSearchData = response;

        document.getElementById('loadingIndicator').style.display = 'none';

        displayRoutes(response);
        displayMap(response);
        updateStats(response);
        loadRecentSearches();

        if (response.auto_saved) {
            showToast('Best route saved to Saved Routes');
        }
        await refreshSavedRouteKeys();
        updateSaveButtons();

    } catch (error) {
        document.getElementById('loadingIndicator').style.display = 'none';
        alert('Error searching routes: ' + error.message);
    }
}

// Display Routes
function displayRoutes(data) {
    const resultsPanel = document.getElementById('resultsPanel');
    const routesGrid = document.getElementById('routesGrid');
    const routeCount = document.getElementById('routeCount');
    const recommendations = document.getElementById('recommendations');
    
    resultsPanel.classList.add('visible');
    const resolvedFrom = data.origin?.resolved;
    const resolvedTo = data.destination?.resolved;
    let countText = `${data.total_routes} routes found · click a route to highlight on map`;
    if (resolvedFrom && resolvedTo) {
        countText += `<br><span class="resolved-locations"><i class="fas fa-location-crosshairs"></i> ${escapeHtml(resolvedFrom.split(',')[0])} → ${escapeHtml(resolvedTo.split(',')[0])}</span>`;
    }
    routeCount.innerHTML = countText;

    if (data.recommendations) {
        const best = data.recommendations.best;
        const fastest = data.recommendations.fastest;
        const shortest = data.recommendations.shortest;
        const balanced = data.recommendations.balanced;

        recommendations.innerHTML = `
            <div class="recommendations-strip">
                <h3><i class="fas fa-star"></i> Route Recommendations</h3>
                <div class="rec-row">
                    ${best ? `
                        <div class="rec-best" onclick="highlightRouteOnMap(${best.route_index}, false)" title="Click to highlight on map">
                            <strong>★ Best — Route ${best.route_index + 1}</strong>
                            ${best.explanation || best.reason}
                        </div>
                    ` : ''}
                    <div class="rec-chips">
                        ${fastest ? `
                            <span class="rec-chip" onclick="highlightRouteOnMap(${fastest.route_index}, false)">
                                ⚡ Fastest · R${fastest.route_index + 1} · ${formatDuration(fastest.duration)}
                            </span>
                        ` : ''}
                        ${shortest ? `
                            <span class="rec-chip" onclick="highlightRouteOnMap(${shortest.route_index}, false)">
                                📏 Shortest · R${shortest.route_index + 1} · ${formatDistance(shortest.distance)}
                            </span>
                        ` : ''}
                        ${balanced ? `
                            <span class="rec-chip" onclick="highlightRouteOnMap(${balanced.route_index}, false)">
                                ⚖ Balanced · R${balanced.route_index + 1}
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    // Display route cards
    routesGrid.innerHTML = '';
    
    data.routes.forEach((route) => {
        const card = createRouteCard(route, data.recommendations);
        routesGrid.appendChild(card);
    });
}

function updateStats(data) {
    const bestIdx = data.recommendations?.best?.route_index ?? 0;
    const best = data.routes[bestIdx];
    if (!best) return;

    const distEl = document.getElementById('totalDistance');
    const timeEl = document.getElementById('totalTime');
    const trafficEl = document.getElementById('trafficStatus');
    const delayEl = document.getElementById('delayTime');

    if (distEl) distEl.textContent = best.distance.text;
    if (timeEl) timeEl.textContent = best.duration.text;
    if (trafficEl) {
        trafficEl.textContent = best.traffic.status;
        trafficEl.className = best.traffic.status.toLowerCase();
    }
    if (delayEl) delayEl.textContent = `${Math.round((best.traffic.delay || 0) / 60)} min`;
}

function createRouteCard(route, recommendations) {
    const card = document.createElement('div');
    card.className = 'route-card';
    card.dataset.routeId = route.route_id;

    const idx = route.route_id;
    const isFastest = recommendations?.fastest?.route_index === idx;
    const isShortest = recommendations?.shortest?.route_index === idx;
    const isBest = recommendations?.best?.route_index === idx;
    const isBalanced = recommendations?.balanced?.route_index === idx;

    if (isBest) card.classList.add('recommended');
    if (isFastest) card.classList.add('fastest');
    if (isShortest) card.classList.add('shortest');

    const trafficClass = `traffic-${route.traffic.status.toLowerCase()}`;
    const road = route.road_quality || {};
    const routeColor = route.color || ROUTE_COLORS[idx % ROUTE_COLORS.length];

    card.innerHTML = `
        <div class="route-color-bar" style="background:${routeColor}"></div>
        <div class="route-header">
            <h3>${route.route_name}</h3>
            <div class="route-badges">
                ${isBest ? '<span class="route-badge badge-best">★ Best</span>' : ''}
                ${isFastest ? '<span class="route-badge badge-fastest">⚡ Fastest</span>' : ''}
                ${isShortest ? '<span class="route-badge badge-shortest">📏 Shortest</span>' : ''}
                ${isBalanced ? '<span class="route-badge badge-balanced">⚖ Balanced</span>' : ''}
            </div>
        </div>

        <div class="route-explanation">
            <i class="fas fa-info-circle"></i>
            <p>${route.explanation || ''}</p>
        </div>

        <div class="route-details">
            <div class="detail-item">
                <i class="fas fa-road"></i>
                <span><strong>Distance:</strong> ${route.distance.text}</span>
            </div>
            <div class="detail-item">
                <i class="fas fa-clock"></i>
                <span><strong>Duration:</strong> ${route.duration.text}</span>
            </div>
            <div class="traffic-indicator ${trafficClass}">
                <i class="fas fa-traffic-light"></i>
                <span><strong>Traffic:</strong> ${route.traffic.status}</span>
            </div>
            <div class="detail-item road-quality">
                <i class="fas fa-road-circle-check"></i>
                <span><strong>Roads:</strong> ${road.rating || '—'} — ${road.label || 'Standard conditions'}</span>
            </div>
            ${route.traffic.delay > 0 ? `
                <div class="detail-item">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span><strong>Delay:</strong> ${Math.round(route.traffic.delay / 60)} min</span>
                </div>
            ` : ''}
        </div>

        ${renderViaPoints(route.via_points)}
        <div class="route-summary">
            <p><i class="fas fa-route"></i> ${route.via_summary || route.summary || 'Direct route'}</p>
        </div>

        <div class="route-actions">
            <button class="btn-view" onclick="viewRouteOnMap(${route.route_id})">
                <i class="fas fa-map"></i> View on Map
            </button>
            <button class="btn-save" data-route-id="${route.route_id}" onclick="saveRoute(${route.route_id}, event)">
                <i class="fas fa-star"></i> Save
            </button>
        </div>
    `;

    card.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        highlightRouteOnMap(route.route_id);
    });

    return card;
}

function displayMap(data) {
    try {
        drawAllRoutesOnMap(data);
        setTimeout(() => map && map.invalidateSize(), 250);
    } catch (err) {
        console.warn('Map route display:', err.message);
        if (map) map.fitBounds(INDIA_BOUNDS, { padding: [20, 20] });
    }
}

function viewRouteOnMap(routeId) {
    if (!currentRoutes[routeId]) return;
    highlightRouteOnMap(routeId, true);
}

function getSaveKey(source, destination, routeIndex) {
    return `${(source || '').trim().toLowerCase()}|${(destination || '').trim().toLowerCase()}|${routeIndex}`;
}

function buildSavePayload(route, routeId) {
    const user = getCurrentUser();
    const data = currentSearchData || {};
    return {
        user_id: user.id,
        route_name: route.route_name,
        route_index: routeId,
        source: document.getElementById('source').value.trim(),
        destination: document.getElementById('destination').value.trim(),
        source_coords: data.origin?.coordinates || null,
        destination_coords: data.destination?.coordinates || null,
        distance: route.distance.value,
        duration: route.duration.value,
        travel_mode: document.getElementById('travelMode').value,
        traffic_status: route.traffic?.status || '',
        delay_time: route.traffic?.delay || 0,
        via_summary: route.via_summary || route.summary || '',
        auto_saved: false,
    };
}

async function refreshSavedRouteKeys() {
    savedRouteKeys.clear();
    const user = getCurrentUser();
    if (!user) return;

    try {
        const res = await API.getSavedRoutes(user.id);
        (res.routes || []).forEach((r) => {
            savedRouteKeys.add(getSaveKey(r.source, r.destination, r.route_index ?? 0));
        });
    } catch (err) {
        console.warn('Saved routes sync:', err.message);
    }
}

function updateSaveButtons() {
    const source = document.getElementById('source')?.value.trim() || '';
    const dest = document.getElementById('destination')?.value.trim() || '';

    document.querySelectorAll('.btn-save').forEach((btn) => {
        const routeId = parseInt(btn.dataset.routeId, 10);
        const key = getSaveKey(source, dest, routeId);
        if (savedRouteKeys.has(key)) {
            btn.classList.add('saved');
            btn.innerHTML = '<i class="fas fa-check"></i> Saved';
            btn.disabled = true;
        } else {
            btn.classList.remove('saved');
            btn.innerHTML = '<i class="fas fa-star"></i> Save';
            btn.disabled = false;
        }
    });
}

function showToast(message) {
    let toast = document.getElementById('navToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'navToast';
        toast.style.cssText = `
            position:fixed;bottom:24px;right:24px;z-index:10000;
            background:#ff6a00;color:#000;padding:12px 20px;border-radius:10px;
            font-size:14px;font-weight:600;box-shadow:0 4px 20px rgba(255,106,0,0.4);
            transition:opacity 0.3s;
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 3500);
}

async function saveRoute(routeId, event) {
    if (event) event.stopPropagation();

    const user = getCurrentUser();
    if (!user) {
        alert('Please login to save routes');
        window.location.href = 'login.html';
        return;
    }

    const route = currentRoutes[routeId];
    if (!route) return;

    const btn = event?.target?.closest('.btn-save');
    if (btn?.classList.contains('saved')) return;

    try {
        const routeData = buildSavePayload(route, routeId);
        await API.saveRoute(routeData);
        savedRouteKeys.add(getSaveKey(routeData.source, routeData.destination, routeId));
        updateSaveButtons();
        showToast(`${route.route_name} saved to Saved Routes`);
    } catch (error) {
        alert('Error saving route: ' + error.message);
    }
}

function formatTravelModeLabel(mode) {
    const labels = { driving: 'Car', walking: 'Walking', bicycling: 'Bike', transit: 'Transit' };
    return labels[mode] || mode || 'Car';
}

function truncateText(text, max = 28) {
    const s = String(text || '');
    return s.length > max ? `${s.slice(0, max)}…` : s;
}

async function loadRecentSearches() {
    const tbody = document.getElementById('recentSearches');
    if (!tbody) return;

    const user = getCurrentUser();
    if (!user) {
        tbody.innerHTML = '<tr><td colspan="6" class="history-empty">Login to see your last 5 route searches</td></tr>';
        return;
    }

    try {
        const response = await API.getHistory(user.id, 5);
        const items = (response.history || []).slice(0, 5);

        if (!items.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="history-empty">No searches yet — find a route above</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        items.forEach((item) => {
            const tr = document.createElement('tr');
            tr.className = 'recent-row';
            const traffic = item.traffic_status || '—';
            tr.innerHTML = `
                <td title="${escapeHtml(item.source)}">${escapeHtml(truncateText(item.source))}</td>
                <td title="${escapeHtml(item.destination)}">${escapeHtml(truncateText(item.destination))}</td>
                <td>${formatTravelModeLabel(item.travel_mode)}</td>
                <td>${formatDistance(item.distance)}</td>
                <td>${formatDuration(item.duration)}</td>
                <td class="traffic-${traffic.toLowerCase()}">${escapeHtml(traffic)}</td>
            `;
            tr.addEventListener('click', () => {
                document.getElementById('source').value = item.source;
                document.getElementById('destination').value = item.destination;
                document.getElementById('travelMode').value = item.travel_mode || 'driving';
                const mode = item.travel_mode || 'driving';
                document.querySelectorAll('#travelButtons button').forEach((btn) => {
                    btn.classList.toggle('active', btn.getAttribute('data-mode') === mode);
                });
                searchRoutes();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.warn('Recent searches:', err.message);
        tbody.innerHTML = '<tr><td colspan="6" class="history-empty">Could not load history</td></tr>';
    }
}

const SERVICE_DESTINATIONS = {
    airport: 'Kempegowda International Airport, Bengaluru',
    railway: 'KSR Bengaluru City Railway Station',
};

document.addEventListener('DOMContentLoaded', () => {
    initIndiaMap();
    loadRecentSearches();
    refreshSavedRouteKeys();

    const serviceType = new URLSearchParams(window.location.search).get('service')
        || sessionStorage.getItem('navipulse_service_type');
    const serviceDest = sessionStorage.getItem('navipulse_service_dest')
        || SERVICE_DESTINATIONS[serviceType];
    if (serviceDest) {
        const destInput = document.getElementById('destination');
        if (destInput && !destInput.value) destInput.value = serviceDest;
        sessionStorage.removeItem('navipulse_service_dest');
        sessionStorage.removeItem('navipulse_service_type');
    }

    const searchParams = sessionStorage.getItem('searchParams');
    if (searchParams) {
        const params = JSON.parse(searchParams);
        document.getElementById('source').value = params.source;
        document.getElementById('destination').value = params.destination;
        document.getElementById('travelMode').value = params.travelMode;
        
        sessionStorage.removeItem('searchParams');
        
        // Auto-search
        setTimeout(searchRoutes, 500);
    }
});

const style = document.createElement('style');
style.textContent = `
    .rec-best { cursor: pointer; }

    .route-card.recommended {
        border-color: #ff6a00;
        box-shadow: 0 0 20px rgba(255, 106, 0, 0.2);
    }

    .route-card.selected {
        outline: 2px solid #ff6a00;
        outline-offset: 2px;
    }

    .route-color-bar {
        height: 4px;
        border-radius: 4px 4px 0 0;
        margin: -1.5rem -1.5rem 1rem -1.5rem;
    }

    .route-explanation {
        display: flex;
        gap: 0.5rem;
        padding: 0.6rem 0.75rem;
        background: rgba(255, 106, 0, 0.08);
        border-radius: 8px;
        margin-bottom: 0.75rem;
        font-size: 0.8rem;
        color: #aaa;
        line-height: 1.35;
    }

    .route-explanation i {
        color: #ff6a00;
        font-size: 0.75rem;
        margin-top: 2px;
    }

    .route-card {
        padding: 1rem !important;
    }

    .route-card .route-header h3 {
        font-size: 1rem;
    }

    .road-quality {
        color: #36d636 !important;
    }
    
    .route-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 1rem;
    }
    
    .btn-view, .btn-save {
        flex: 1;
        padding: 0.8rem;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s;
    }
    
    .btn-view {
        background: var(--primary-color);
        color: white;
    }
    
    .btn-save {
        background: var(--dark-bg);
        color: var(--text-primary);
        border: 1px solid var(--border-color);
    }

    .btn-save.saved {
        background: rgba(54, 214, 54, 0.15);
        border-color: #36d636;
        color: #36d636;
        cursor: default;
    }
    
    .btn-view:hover, .btn-save:hover:not(.saved):not(:disabled) {
        transform: translateY(-2px);
    }
    
    .detail-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0.5rem 0;
        color: var(--text-secondary);
    }
    
    .route-summary {
        margin: 0.5rem 0 1rem;
        padding: 0.75rem 1rem;
        background: var(--dark-bg);
        border-radius: 8px;
        color: var(--text-secondary);
        font-size: 0.85rem;
    }

    .resolved-locations {
        font-size: 12px;
        color: #888;
        display: block;
        margin-top: 4px;
    }

    .via-points { margin: 0.75rem 0; }
    .via-label { font-size: 12px; color: #ff6a00; margin-bottom: 6px; font-weight: 600; }
    .via-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .via-chip {
        display: inline-flex; align-items: center; gap: 4px;
        padding: 4px 10px; background: #171717; border: 1px solid #333;
        border-radius: 16px; font-size: 11px; color: #ccc;
    }
    .via-chip .via-num {
        background: #ff6a00; color: #000; width: 16px; height: 16px;
        border-radius: 50%; display: inline-flex; align-items: center;
        justify-content: center; font-size: 10px; font-weight: 700;
    }
    .via-type-highway { border-color: #4a9eff; }
    .via-type-city { border-color: #36d636; }
    .via-type-toll { border-color: #ff9900; }
`;
document.head.appendChild(style);
