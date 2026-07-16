/**
 * Live Flight Tracking — FlightRadar24-style world map via OpenSky Network
 */
(function () {
    const REFRESH_MS = 15000;
    const REGIONS = {
        india: { center: [22.5, 79], zoom: 5, lamin: 6, lomin: 68, lamax: 37, lomax: 98 },
        asia: { center: [25, 90], zoom: 3, lamin: -10, lomin: 60, lamax: 55, lomax: 150 },
        europe: { center: [50, 10], zoom: 4, lamin: 35, lomin: -15, lamax: 72, lomax: 40 },
        usa: { center: [39, -98], zoom: 4, lamin: 24, lomin: -126, lamax: 50, lomax: -66 },
        world: { center: [20, 20], zoom: 2, lamin: -55, lomin: -170, lamax: 72, lomax: 170 },
    };

    const PLANE_SVG =
        '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>' +
        '</svg>';

    let map;
    let markersLayer;
    let flightsByIcao = new Map();
    let selectedIcao = null;
    let refreshTimer = null;
    let currentRegion = 'india';
    let loading = false;

    function $(id) {
        return document.getElementById(id);
    }

    function showToast(msg, ms = 4000) {
        const el = $('mapToast');
        if (!el) return;
        el.textContent = msg;
        el.classList.add('show');
        clearTimeout(showToast._t);
        showToast._t = setTimeout(() => el.classList.remove('show'), ms);
    }

    function setLiveStatus(state, label) {
        const dot = $('liveDot');
        const text = $('liveLabel');
        if (text) text.textContent = label;
        if (!dot) return;
        dot.classList.remove('warn', 'err');
        if (state === 'warn') dot.classList.add('warn');
        if (state === 'err') dot.classList.add('err');
    }

    function formatAlt(meters) {
        if (meters == null) return '—';
        const ft = Math.round(meters * 3.28084);
        return `${ft.toLocaleString()} ft · ${Math.round(meters).toLocaleString()} m`;
    }

    function formatSpeed(ms) {
        if (ms == null) return '—';
        const knots = Math.round(ms * 1.94384);
        const kmh = Math.round(ms * 3.6);
        return `${knots} kt · ${kmh} km/h`;
    }

    function formatVRate(ms) {
        if (ms == null) return '—';
        const fpm = Math.round(ms * 196.85);
        if (fpm > 50) return `Climbing ${fpm} fpm`;
        if (fpm < -50) return `Descending ${Math.abs(fpm)} fpm`;
        return 'Level';
    }

    function planeIcon(heading, selected) {
        const rot = heading || 0;
        const cls = selected ? 'plane-icon selected' : 'plane-icon';
        return L.divIcon({
            className: '',
            html: `<div class="${cls}" style="transform:rotate(${rot}deg)">${PLANE_SVG}</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
        });
    }

    function initMap() {
        const r = REGIONS.india;
        map = L.map('liveMap', {
            zoomControl: true,
            worldCopyJump: true,
            minZoom: 2,
            maxZoom: 12,
        }).setView(r.center, r.zoom);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap &copy; CARTO · Aircraft: OpenSky Network',
            subdomains: 'abcd',
            maxZoom: 19,
        }).addTo(map);

        markersLayer = L.layerGroup().addTo(map);
        L.control.zoom({ position: 'topright' });
    }

    function bboxForRegion(key) {
        if (key === 'viewport' && map) {
            const b = map.getBounds();
            let lamin = b.getSouth();
            let lomin = b.getWest();
            let lamax = b.getNorth();
            let lomax = b.getEast();
            // Clamp / shrink oversized boxes for OpenSky
            if (lamax - lamin > 85) {
                const mid = (lamax + lamin) / 2;
                lamin = mid - 42;
                lamax = mid + 42;
            }
            if (lomax - lomin > 170) {
                const mid = (lomax + lomin) / 2;
                lomin = mid - 85;
                lomax = mid + 85;
            }
            return {
                lamin: Math.max(-90, lamin),
                lomin: Math.max(-180, lomin),
                lamax: Math.min(90, lamax),
                lomax: Math.min(180, lomax),
            };
        }
        const r = REGIONS[key] || REGIONS.india;
        return { lamin: r.lamin, lomin: r.lomin, lamax: r.lamax, lomax: r.lomax };
    }

    function renderMarkers(flights) {
        markersLayer.clearLayers();
        flights.forEach((f) => {
            const selected = f.icao24 === selectedIcao;
            const marker = L.marker([f.lat, f.lon], {
                icon: planeIcon(f.heading, selected),
                title: f.callsign || f.icao24,
            });
            if (f.callsign) {
                marker.bindTooltip(f.callsign, {
                    permanent: false,
                    direction: 'top',
                    offset: [0, -12],
                    className: 'flight-tip',
                });
            }
            marker.on('click', () => selectFlight(f.icao24));
            marker.addTo(markersLayer);
            f._marker = marker;
        });
    }

    function selectFlight(icao24) {
        selectedIcao = icao24;
        const f = flightsByIcao.get(icao24);
        if (!f) return;

        $('detailCallsign').textContent = f.callsign || f.icao24.toUpperCase();
        $('detailCountry').textContent = f.airline || f.originCountry || '—';

        const status = f.onGround
            ? '<span class="status-pill gnd">On ground</span>'
            : '<span class="status-pill air">In flight</span>';

        const extraRows = [];
        if (f.airline) {
            extraRows.push(`<div class="detail-row"><span class="label">Airline</span><span class="value">${f.airline}</span></div>`);
        }
        if (f.registration) {
            extraRows.push(`<div class="detail-row"><span class="label">Registration</span><span class="value">${f.registration}</span></div>`);
        }
        if (f.aircraftType) {
            extraRows.push(`<div class="detail-row"><span class="label">Aircraft</span><span class="value">${f.aircraftType}</span></div>`);
        }

        $('detailBody').innerHTML = `
            <div class="detail-row"><span class="label">Status</span><span class="value">${status}</span></div>
            <div class="detail-row"><span class="label">ICAO24</span><span class="value">${(f.icao24 || '').toUpperCase()}</span></div>
            ${extraRows.join('')}
            <div class="detail-row"><span class="label">Country</span><span class="value">${f.originCountry || '—'}</span></div>
            <div class="detail-row"><span class="label">Altitude</span><span class="value">${formatAlt(f.altitude)}</span></div>
            <div class="detail-row"><span class="label">Ground speed</span><span class="value">${formatSpeed(f.velocity)}</span></div>
            <div class="detail-row"><span class="label">Heading</span><span class="value">${f.heading != null ? `${f.heading}°` : '—'}</span></div>
            <div class="detail-row"><span class="label">Vertical rate</span><span class="value">${formatVRate(f.verticalRate)}</span></div>
            <div class="detail-row"><span class="label">Squawk</span><span class="value">${f.squawk || '—'}</span></div>
            <div class="detail-row"><span class="label">Position</span><span class="value">${f.lat.toFixed(4)}, ${f.lon.toFixed(4)}</span></div>
        `;

        $('detailPanel').classList.add('open');
        renderMarkers([...flightsByIcao.values()]);
        map.panTo([f.lat, f.lon], { animate: true });
    }

    function closeDetail() {
        selectedIcao = null;
        $('detailPanel').classList.remove('open');
        renderMarkers([...flightsByIcao.values()]);
    }

    function updateStats(flights, timeUnix) {
        const air = flights.filter((f) => !f.onGround).length;
        $('statCount').textContent = String(flights.length);
        $('statAir').textContent = String(air);
        if (timeUnix) {
            const d = new Date(timeUnix * 1000);
            $('statUpdated').textContent = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        } else {
            $('statUpdated').textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
    }

    async function loadFlights() {
        if (loading) return;
        loading = true;
        setLiveStatus('warn', 'Updating…');

        const bbox = bboxForRegion(currentRegion);
        try {
            const data = await API.getLiveFlights(bbox);
            const flights = data.flights || [];
            flightsByIcao = new Map(flights.map((f) => [f.icao24, f]));
            renderMarkers(flights);
            updateStats(flights, data.time);
            const src = data.source === 'skylink' ? 'SkyLink' : (data.authenticated ? 'OpenSky ✓' : 'OpenSky');
            setLiveStatus('ok', `Live · ${src} · ${flights.length}`);
            if (data.fallbackNote) {
                showToast(data.fallbackNote, 6000);
            }

            if (selectedIcao && flightsByIcao.has(selectedIcao)) {
                selectFlight(selectedIcao);
            } else if (selectedIcao) {
                closeDetail();
            }
        } catch (err) {
            console.error(err);
            setLiveStatus('err', 'Offline');
            showToast(err.message || 'Could not load live flights. Is the backend running?');
        } finally {
            loading = false;
        }
    }

    function goRegion(key) {
        currentRegion = key;
        document.querySelectorAll('.region-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.region === key);
        });
        if (key !== 'viewport' && REGIONS[key]) {
            map.setView(REGIONS[key].center, REGIONS[key].zoom);
        }
        loadFlights();
    }

    function searchFlights(q) {
        const query = (q || '').trim().toUpperCase();
        if (!query) return;
        const match = [...flightsByIcao.values()].find((f) => {
            const cs = (f.callsign || '').toUpperCase();
            const id = (f.icao24 || '').toUpperCase();
            return cs.includes(query) || id.includes(query);
        });
        if (match) {
            selectFlight(match.icao24);
            map.setView([match.lat, match.lon], Math.max(map.getZoom(), 7));
        } else {
            showToast(`No flight matching “${q}” in this region`);
        }
    }

    function bindUI() {
        $('detailClose').addEventListener('click', closeDetail);
        $('regionBar').addEventListener('click', (e) => {
            const btn = e.target.closest('.region-btn');
            if (btn) goRegion(btn.dataset.region);
        });
        const search = $('flightSearch');
        search.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') searchFlights(search.value);
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        initMap();
        bindUI();
        loadFlights();
        refreshTimer = setInterval(loadFlights, REFRESH_MS);
    });

    window.addEventListener('beforeunload', () => {
        if (refreshTimer) clearInterval(refreshTimer);
    });
})();
