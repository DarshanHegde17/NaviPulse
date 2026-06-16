/**
 * My Airport explorer — states → airports → details & schedules
 */
const AirportExplorer = (() => {
    let root = null;
    let body = null;
    let state = { view: 'states', stateName: null, airportId: null };

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function iataLabel(code) {
        return IATA_NAMES[code] || code;
    }

    function formatNumber(n) {
        return Number(n).toLocaleString('en-IN');
    }

    function getAllStates() {
        return Object.keys(INDIAN_AIRPORTS_BY_STATE).sort((a, b) => a.localeCompare(b));
    }

    function getAirportById(id) {
        for (const airports of Object.values(INDIAN_AIRPORTS_BY_STATE)) {
            const found = airports.find((a) => a.id === id);
            if (found) return found;
        }
        return null;
    }

    function generateFlights(airport) {
        const iata = airport.iata;
        const hubs = AIRPORT_ROUTE_HUBS.filter((h) => h !== iata);
        const flights = [];
        const statuses = ['On Time', 'On Time', 'On Time', 'Boarding', 'Delayed 12m', 'Departed'];
        const baseHour = 5 + (iata.charCodeAt(0) % 4);

        hubs.slice(0, 5).forEach((hub, idx) => {
            const depH = baseHour + idx * 2;
            const arrH = depH + 1 + (idx % 2);
            const depM = (idx * 17) % 60;
            const arrM = (depM + 25) % 60;
            const airline = AIRLINE_NAMES[idx % AIRLINE_NAMES.length];
            const flightNo = `${airline.slice(0, 2).toUpperCase()}${480 + idx * 7 + iata.charCodeAt(0) % 20}`;
            flights.push({
                flightNo,
                airline,
                type: 'Arrival',
                source: hub,
                destination: iata,
                dep: `${String(depH).padStart(2, '0')}:${String(depM).padStart(2, '0')}`,
                arr: `${String(arrH).padStart(2, '0')}:${String(arrM).padStart(2, '0')}`,
                duration: `${55 + idx * 8}m`,
                status: statuses[idx % statuses.length],
            });
        });

        hubs.slice(0, 5).forEach((hub, idx) => {
            const depH = baseHour + 1 + idx * 2;
            const arrH = depH + 1 + (idx % 2);
            const depM = (idx * 23 + 10) % 60;
            const arrM = (depM + 30) % 60;
            const airline = AIRLINE_NAMES[(idx + 2) % AIRLINE_NAMES.length];
            const flightNo = `${airline.slice(0, 2).toUpperCase()}${510 + idx * 9 + iata.charCodeAt(1) % 15}`;
            flights.push({
                flightNo,
                airline,
                type: 'Departure',
                source: iata,
                destination: hub,
                dep: `${String(depH).padStart(2, '0')}:${String(depM).padStart(2, '0')}`,
                arr: `${String(arrH).padStart(2, '0')}:${String(arrM).padStart(2, '0')}`,
                duration: `${50 + idx * 10}m`,
                status: statuses[(idx + 1) % statuses.length],
            });
        });

        return flights.sort((a, b) => a.dep.localeCompare(b.dep));
    }

    function breadcrumb() {
        const parts = [
            `<button type="button" class="crumb ${state.view === 'states' ? 'active' : ''}" data-go="states">All States</button>`,
        ];
        if (state.stateName) {
            parts.push(`<span class="crumb-sep"><i class="fa-solid fa-chevron-right"></i></span>`);
            parts.push(`<button type="button" class="crumb ${state.view === 'airports' ? 'active' : ''}" data-go="airports" data-state="${escapeHtml(state.stateName)}">${escapeHtml(state.stateName)}</button>`);
        }
        if (state.airportId && state.view === 'detail') {
            const ap = getAirportById(state.airportId);
            parts.push(`<span class="crumb-sep"><i class="fa-solid fa-chevron-right"></i></span>`);
            parts.push(`<span class="crumb active">${escapeHtml(ap?.iata || '')}</span>`);
        }
        return `<nav class="explorer-breadcrumb">${parts.join('')}</nav>`;
    }

    function renderStates(filter = '') {
        const q = filter.trim().toLowerCase();
        const states = getAllStates().filter((name) => !q || name.toLowerCase().includes(q));
        const totalAirports = states.reduce((sum, s) => sum + INDIAN_AIRPORTS_BY_STATE[s].length, 0);

        body.innerHTML = `
            ${breadcrumb()}
            <div class="explorer-toolbar">
                <input type="search" class="explorer-search" placeholder="Search state…" value="${escapeHtml(filter)}" id="stateSearchInput">
                <span class="explorer-count">${states.length} states · ${totalAirports} airports</span>
            </div>
            <div class="state-grid">
                ${states.map((name) => {
                    const count = INDIAN_AIRPORTS_BY_STATE[name].length;
                    return `<button type="button" class="state-chip" data-state="${escapeHtml(name)}">
                        <span class="state-name">${escapeHtml(name)}</span>
                        <span class="state-count">${count} airport${count > 1 ? 's' : ''}</span>
                    </button>`;
                }).join('')}
            </div>
        `;

        body.querySelector('#stateSearchInput')?.addEventListener('input', (e) => renderStates(e.target.value));
        body.querySelectorAll('.state-chip').forEach((btn) => {
            btn.addEventListener('click', () => showAirports(btn.dataset.state));
        });
        bindBreadcrumb();
    }

    function showAirports(stateName) {
        state = { view: 'airports', stateName, airportId: null };
        const airports = INDIAN_AIRPORTS_BY_STATE[stateName] || [];

        body.innerHTML = `
            ${breadcrumb()}
            <div class="explorer-toolbar">
                <span class="explorer-count">${airports.length} airport${airports.length > 1 ? 's' : ''} in ${escapeHtml(stateName)}</span>
            </div>
            <div class="airport-list">
                ${airports.map((ap) => `
                    <button type="button" class="airport-row" data-airport="${ap.id}">
                        <div class="airport-row-main">
                            ${airportImageHtml(ap.iata, ap.name, 'airport-row-thumb')}
                            <div>
                                <strong>${escapeHtml(ap.name)}</strong>
                                <span>${escapeHtml(ap.iata)} · ${escapeHtml(ap.city)} · ${escapeHtml(ap.type)}</span>
                            </div>
                        </div>
                        <div class="airport-row-meta">
                            <span><i class="fa-solid fa-plane"></i> ${formatNumber(ap.dailyFlights)}/day</span>
                            <i class="fa-solid fa-chevron-right"></i>
                        </div>
                    </button>
                `).join('')}
            </div>
        `;

        body.querySelectorAll('.airport-row').forEach((row) => {
            row.addEventListener('click', () => showAirportDetail(row.dataset.airport));
        });
        bindBreadcrumb();
    }

    function statCard(icon, label, value, sub) {
        return `<div class="airport-stat">
            <i class="fa-solid ${icon}"></i>
            <div>
                <span class="stat-label">${label}</span>
                <strong>${value}</strong>
                ${sub ? `<small>${sub}</small>` : ''}
            </div>
        </div>`;
    }

    function statusClass(status) {
        if (/delay/i.test(status)) return 'delayed';
        if (/board|depart/i.test(status)) return 'boarding';
        return 'ontime';
    }

    function renderFlightsTable(flights, scheduleNote) {
        if (!flights.length) {
            return `<p class="flights-note" style="padding:12px">No live flights returned for this airport right now.</p>`;
        }
        return `
            <div class="flights-table-wrap">
                <table class="flights-table">
                    <thead>
                        <tr>
                            <th>Flight</th>
                            <th>Airline</th>
                            <th>Type</th>
                            <th>Source</th>
                            <th>Destination</th>
                            <th>Dep</th>
                            <th>Arr</th>
                            <th>Duration</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${flights.map((f) => `
                            <tr>
                                <td><strong>${escapeHtml(f.flightNo)}</strong></td>
                                <td>${escapeHtml(f.airline)}</td>
                                <td>${escapeHtml(f.type)}</td>
                                <td title="${escapeHtml(iataLabel(f.source))}">${escapeHtml(f.source)}</td>
                                <td title="${escapeHtml(iataLabel(f.destination))}">${escapeHtml(f.destination)}</td>
                                <td>${escapeHtml(f.dep)}</td>
                                <td>${escapeHtml(f.arr)}</td>
                                <td>${escapeHtml(f.duration)}</td>
                                <td><span class="flight-status ${statusClass(f.status)}">${escapeHtml(f.status)}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    async function showAirportDetail(airportId) {
        const airport = getAirportById(airportId);
        if (!airport) return;

        state = { view: 'detail', stateName: state.stateName, airportId };
        const annualFlights = Math.round(airport.dailyFlights * 365 * 0.92);

        body.innerHTML = `
            ${breadcrumb()}
            ${airportHeroGalleryHtml(airport.iata, airport.name)}
            <div class="airport-detail-header has-photo">
                <div class="airport-detail-top">
                    <span class="detail-iata">${escapeHtml(airport.iata)}</span>
                    <h3>${escapeHtml(airport.name)}</h3>
                    <p>${escapeHtml(airport.city)}, ${escapeHtml(state.stateName)} · ${escapeHtml(airport.icao)} · Est. ${airport.yearOpened}</p>
                </div>
                <button type="button" class="service-btn plan-route-btn" data-route="${escapeHtml(airport.name + ', ' + airport.city)}">
                    <i class="fa-solid fa-route"></i> Plan route
                </button>
            </div>

            <div class="airport-stats-grid">
                ${statCard('fa-vector-square', 'Total area', `${formatNumber(airport.areaSqKm)} km²`, `${formatNumber(airport.areaAcres)} acres`)}
                ${statCard('fa-users', 'Ground crew & staff', formatNumber(airport.crew), 'Airport operations workforce')}
                ${statCard('fa-plane-departure', 'Daily flights', formatNumber(airport.dailyFlights), `~${formatNumber(annualFlights)} / year`)}
                ${statCard('fa-road', 'Runways', airport.runways, `${airport.terminals} terminal${airport.terminals > 1 ? 's' : ''}`)}
                ${statCard('fa-mountain', 'Elevation', airport.elevation, airport.operator)}
                ${statCard('fa-tag', 'Category', airport.type, 'AAI / operator managed')}
            </div>

            <div class="flights-section">
                <div class="flights-section-head">
                    <h4><i class="fa-solid fa-clock"></i> Live flight schedule</h4>
                    <span class="flights-note" id="flightScheduleNote">Loading live data…</span>
                </div>
                <div id="flightsTableHost"><p class="flights-note" style="padding:12px"><i class="fa-solid fa-spinner fa-spin"></i> Fetching flights…</p></div>
            </div>
        `;

        body.querySelector('.plan-route-btn')?.addEventListener('click', (e) => {
            const dest = e.currentTarget.dataset.route;
            sessionStorage.setItem('navipulse_service_dest', dest);
            sessionStorage.setItem('navipulse_service_type', 'airport');
            window.location.href = 'dashboard.html?service=airport';
        });
        bindAirportGalleryTriggers(body, airport.name);
        bindBreadcrumb();

        loadAirportPhotos(airport.iata, airport.name, airport.city).then(({ urls, meta }) => {
            const photoBlock = body.querySelector('.airport-photo-block');
            refreshAirportPhotoBlock(photoBlock, airport.iata, airport.name, urls, meta);
            bindAirportGalleryTriggers(body, airport.name);
        });

        let flights = [];
        let note = 'Sample schedules (API unavailable)';
        try {
            const data = await API.getAirportFlights(airport.iata, 'both');
            flights = data.flights || [];
            note = data.live ? 'Live · Aviationstack API' : 'Flight schedule';
        } catch (err) {
            flights = generateFlights(airport);
            note = `Sample data — ${err.message || 'live API unavailable'}`;
        }

        const noteEl = body.querySelector('#flightScheduleNote');
        const host = body.querySelector('#flightsTableHost');
        if (noteEl) noteEl.textContent = note;
        if (host) host.innerHTML = renderFlightsTable(flights, note);
    }

    function bindBreadcrumb() {
        body.querySelectorAll('.crumb[data-go]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const go = btn.dataset.go;
                if (go === 'states') {
                    state = { view: 'states', stateName: null, airportId: null };
                    renderStates();
                } else if (go === 'airports' && state.stateName) {
                    showAirports(state.stateName);
                }
            });
        });
    }

    function open() {
        root.classList.add('open');
        body.hidden = false;
        renderStates();
    }

    function close() {
        root.classList.remove('open');
        body.hidden = true;
        state = { view: 'states', stateName: null, airportId: null };
    }

    function init(containerId, options = {}) {
        const { pageMode = false } = options;
        root = document.getElementById(containerId);
        if (!root) return;

        body = root.querySelector('.explorer-body');
        const toggle = root.querySelector('.explorer-toggle');

        if (pageMode) {
            root.classList.add('page-mode', 'open');
            if (body) body.hidden = false;
            if (toggle) toggle.style.display = 'none';
            renderStates();
            return;
        }

        toggle?.addEventListener('click', () => {
            if (root.classList.contains('open')) close();
            else open();
        });
    }

    return { init, open, close, renderStates };
})();
