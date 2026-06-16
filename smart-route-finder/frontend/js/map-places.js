/**
 * Shared detailed basemap (road names) + nearby OSM places for Dashboard & Traffic maps.
 */
const MapPlaces = (function () {
    const POI_MIN_ZOOM = 13;
    const FETCH_TIMEOUT_MS = 15000;
    const NOMINATIM_HEADERS = { 'Accept-Language': 'en', 'User-Agent': 'NaviPulse/1.0' };

    const POI_STYLES = {
        hotel: { icon: 'fa-hotel', color: '#ec4899', label: 'Hotel' },
        school: { icon: 'fa-school', color: '#3b82f6', label: 'School' },
        shop: { icon: 'fa-store', color: '#a855f7', label: 'Shop' },
        hospital: { icon: 'fa-hospital', color: '#ef4444', label: 'Hospital' },
    };

    async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            return await fetch(url, { ...options, signal: controller.signal });
        } finally {
            clearTimeout(timer);
        }
    }

    function classifyOsmPoi(tags) {
        if (!tags) return null;
        const tourism = tags.tourism || '';
        const amenity = tags.amenity || '';
        const shop = tags.shop || '';

        if (['hotel', 'motel', 'guest_house'].includes(tourism)) {
            return { type: 'hotel', detail: tourism };
        }
        if (['hospital', 'clinic'].includes(amenity)) {
            return { type: 'hospital', detail: amenity };
        }
        if (['school', 'college', 'university', 'kindergarten'].includes(amenity)) {
            return { type: 'school', detail: amenity };
        }
        if (
            shop ||
            ['marketplace', 'mall', 'supermarket', 'convenience', 'restaurant', 'cafe', 'fast_food', 'pharmacy'].includes(
                amenity
            )
        ) {
            return { type: 'shop', detail: shop || amenity };
        }
        return null;
    }

    function parseOverpassPlaces(elements) {
        const places = [];
        const seen = new Set();
        (elements || []).forEach((el) => {
            const tags = el.tags || {};
            const classified = classifyOsmPoi(tags);
            if (!classified) return;

            let lat = el.lat;
            let lon = el.lon;
            if ((lat == null || lon == null) && el.center) {
                lat = el.center.lat;
                lon = el.center.lon;
            }
            if (lat == null || lon == null) return;

            const key = `${el.id}-${lat.toFixed(5)}-${lon.toFixed(5)}`;
            if (seen.has(key)) return;
            seen.add(key);

            places.push({
                id: el.id,
                lat,
                lon,
                name: tags.name || tags.brand || tags.operator || 'Unnamed place',
                type: classified.type,
                detail: classified.detail,
            });
        });
        return places;
    }

    function buildOverpassQuery(south, west, north, east) {
        return `[out:json][timeout:28];
(
  node["tourism"~"hotel|motel|guest_house"](${south},${west},${north},${east});
  way["tourism"~"hotel|motel|guest_house"](${south},${west},${north},${east});
  node["amenity"~"school|college|university|kindergarten"](${south},${west},${north},${east});
  way["amenity"~"school|college|university|kindergarten"](${south},${west},${north},${east});
  node["amenity"~"hospital|clinic|pharmacy"](${south},${west},${north},${east});
  way["amenity"~"hospital|clinic"](${south},${west},${north},${east});
  node["shop"](${south},${west},${north},${east});
  way["shop"](${south},${west},${north},${east});
  node["amenity"~"restaurant|cafe|fast_food|marketplace|mall|supermarket|convenience"](${south},${west},${north},${east});
);
out center 200;`;
    }

    async function fetchPoisFromOverpassDirect(south, west, north, east) {
        const query = buildOverpassQuery(south, west, north, east);
        const res = await fetchWithTimeout(
            'https://overpass-api.de/api/interpreter',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `data=${encodeURIComponent(query)}`,
            },
            30000
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data?.remark || 'Overpass request failed');
        return parseOverpassPlaces(data.elements);
    }

    function ensurePanes(map, extraPanes = []) {
        const defaults = [
            ['labelsPane', 480],
            ['poiPane', 500],
            ['routesPane', 550],
        ];
        [...defaults, ...extraPanes].forEach(([name, z]) => {
            if (!map.getPane(name)) {
                map.createPane(name);
                map.getPane(name).style.zIndex = String(z);
            }
        });
    }

    const ESRI_ATTRIBUTION =
        'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, USDA, USGS, AeroGRID, IGN, GIS User Community';

    const BASEMAP_STYLES = {
        streets: {
            label: 'Map',
            icon: 'fa-map',
        },
        satellite: {
            label: 'Satellite',
            icon: 'fa-satellite',
        },
    };

    function attachDetailedBasemap(map, extraPanes = [], options = {}) {
        ensurePanes(map, extraPanes);

        let currentStyle = options.initialStyle || 'satellite';
        let baseLayer = null;
        let roadOverlayLayer = null;
        let labelsLayer = null;

        function clearBasemapLayers() {
            [baseLayer, roadOverlayLayer, labelsLayer].forEach((layer) => {
                if (layer && map.hasLayer(layer)) map.removeLayer(layer);
            });
            baseLayer = null;
            roadOverlayLayer = null;
            labelsLayer = null;
        }

        function applyBasemapStyle(styleName) {
            clearBasemapLayers();
            currentStyle = styleName;

            if (styleName === 'satellite') {
                baseLayer = L.tileLayer(
                    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                    {
                        attribution: ESRI_ATTRIBUTION,
                        maxZoom: 19,
                    }
                ).addTo(map);

                roadOverlayLayer = L.tileLayer(
                    'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
                    {
                        pane: 'labelsPane',
                        maxZoom: 19,
                        opacity: 0.72,
                    }
                ).addTo(map);

                labelsLayer = L.tileLayer(
                    'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
                    {
                        pane: 'labelsPane',
                        maxZoom: 19,
                        opacity: 0.88,
                    }
                ).addTo(map);
            } else {
                baseLayer = L.tileLayer(
                    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
                    {
                        attribution: '&copy; OpenStreetMap &copy; CARTO',
                        subdomains: 'abcd',
                        maxZoom: 20,
                    }
                ).addTo(map);

                labelsLayer = L.tileLayer(
                    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png',
                    {
                        pane: 'labelsPane',
                        subdomains: 'abcd',
                        maxZoom: 20,
                        opacity: 1,
                    }
                ).addTo(map);
            }

            raiseLabels();
        }

        function raiseLabels() {
            if (roadOverlayLayer && typeof roadOverlayLayer.bringToFront === 'function') {
                roadOverlayLayer.bringToFront();
            }
            if (labelsLayer && typeof labelsLayer.bringToFront === 'function') {
                labelsLayer.bringToFront();
            }
        }

        function setBasemapStyle(styleName) {
            if (!BASEMAP_STYLES[styleName] || styleName === currentStyle) return currentStyle;
            applyBasemapStyle(styleName);
            return currentStyle;
        }

        function getBasemapStyle() {
            return currentStyle;
        }

        function isSatellite() {
            return currentStyle === 'satellite';
        }

        applyBasemapStyle(currentStyle);

        return {
            get baseLayer() {
                return baseLayer;
            },
            get labelsLayer() {
                return labelsLayer;
            },
            raiseLabels,
            setBasemapStyle,
            getBasemapStyle,
            isSatellite,
            BASEMAP_STYLES,
        };
    }

    function createPoiIcon(type) {
        const style = POI_STYLES[type] || POI_STYLES.shop;
        return L.divIcon({
            className: 'poi-marker-wrap',
            html: `<span class="poi-marker" style="background:${style.color}"><i class="fa-solid ${style.icon}"></i></span>`,
            iconSize: [26, 26],
            iconAnchor: [13, 13],
            popupAnchor: [0, -12],
        });
    }

    function createController(map, options = {}) {
        const { raiseLabels = () => {}, onCountChange = null, onStatusChange = null } = options;

        let showPlaces = options.showPlaces !== false;
        let poiLayer = L.layerGroup([], { pane: 'poiPane' }).addTo(map);
        let poiDebounceTimer = null;
        let poiFetchInFlight = false;
        let lastPlacesData = [];
        let lastPoiCount = 0;

        function renderMarkers(places) {
            poiLayer.clearLayers();
            const showNames = map.getZoom() >= 16;

            places.forEach((place) => {
                const style = POI_STYLES[place.type] || POI_STYLES.shop;
                const marker = L.marker([place.lat, place.lon], {
                    icon: createPoiIcon(place.type),
                    pane: 'poiPane',
                });
                marker.bindPopup(
                    `<b>${place.name}</b><br><span style="color:${style.color}">${style.label}</span>` +
                        (place.detail ? `<br><small>${place.detail}</small>` : '')
                );
                if (showNames) {
                    marker.bindTooltip(place.name, {
                        permanent: false,
                        direction: 'top',
                        className: 'poi-name-tooltip',
                        offset: [0, -10],
                    });
                }
                marker.addTo(poiLayer);
            });

            lastPlacesData = places;
            lastPoiCount = places.length;
            raiseLabels();
            if (onCountChange) onCountChange(lastPoiCount);
        }

        async function refresh() {
            if (!showPlaces) {
                poiLayer.clearLayers();
                lastPlacesData = [];
                lastPoiCount = 0;
                if (onCountChange) onCountChange(0);
                return;
            }

            if (map.getZoom() < POI_MIN_ZOOM) {
                poiLayer.clearLayers();
                lastPlacesData = [];
                lastPoiCount = 0;
                if (onCountChange) onCountChange(0);
                if (onStatusChange) onStatusChange('zoom');
                return;
            }

            if (poiFetchInFlight) return;

            const bounds = map.getBounds();
            let south = bounds.getSouth();
            let west = bounds.getWest();
            let north = bounds.getNorth();
            let east = bounds.getEast();
            const maxSpan = 0.1;
            if (north - south > maxSpan || east - west > maxSpan) {
                const center = bounds.getCenter();
                south = center.lat - maxSpan / 2;
                north = center.lat + maxSpan / 2;
                west = center.lng - maxSpan / 2;
                east = center.lng + maxSpan / 2;
            }

            const bboxStr = `${south},${west},${north},${east}`;
            const path = API_CONFIG.ENDPOINTS.ROUTES.PLACES_NEARBY;
            const url = `${API_CONFIG.BASE_URL}${path}?bbox=${encodeURIComponent(bboxStr)}`;

            poiFetchInFlight = true;
            if (onStatusChange) onStatusChange('loading');

            try {
                let places = [];
                try {
                    const res = await fetchWithTimeout(url);
                    const data = await res.json();
                    if (res.ok) {
                        places = data.places || [];
                    } else if (res.status !== 400) {
                        throw new Error(data?.error || `HTTP ${res.status}`);
                    }
                } catch (backendErr) {
                    places = await fetchPoisFromOverpassDirect(south, west, north, east);
                }

                renderMarkers(places);
                if (onStatusChange) onStatusChange('ok');
            } catch (err) {
                lastPlacesData = [];
                lastPoiCount = 0;
                if (onCountChange) onCountChange(0);
                if (onStatusChange) onStatusChange('error', err.message);
            } finally {
                poiFetchInFlight = false;
            }
        }

        function scheduleRefresh() {
            clearTimeout(poiDebounceTimer);
            poiDebounceTimer = setTimeout(refresh, 550);
        }

        function onZoomEnd() {
            if (lastPlacesData.length && showPlaces && map.getZoom() >= POI_MIN_ZOOM) {
                renderMarkers(lastPlacesData);
            } else {
                scheduleRefresh();
            }
        }

        function setShowPlaces(enabled) {
            showPlaces = enabled;
            if (!enabled) {
                poiLayer.clearLayers();
                lastPlacesData = [];
                lastPoiCount = 0;
                if (onCountChange) onCountChange(0);
            } else {
                scheduleRefresh();
            }
        }

        return {
            scheduleRefresh,
            onZoomEnd,
            setShowPlaces,
            refresh,
            getCount: () => lastPoiCount,
            raiseLabels,
        };
    }

    return {
        POI_MIN_ZOOM,
        POI_STYLES,
        BASEMAP_STYLES,
        attachDetailedBasemap,
        createController,
        fetchWithTimeout,
        NOMINATIM_HEADERS,
    };
})();
