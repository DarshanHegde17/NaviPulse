/**
 * My Railway explorer — all India stations via backend API (~8,990 stations)
 */
const RailwayExplorer = (() => {
    let root = null;
    let body = null;
    let state = { view: 'states', stateName: null, stationCode: null, stationQuery: '', stationOffset: 0 };
    let statesData = [];
    let totalStations = 0;
    const PAGE_SIZE = 80;

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function stationLabel(code) {
        return STATION_NAMES[code] || code;
    }

    function formatNumber(n) {
        return Number(n).toLocaleString('en-IN');
    }

    function getFallbackStates() {
        return Object.keys(INDIAN_RAILWAY_BY_STATE).sort((a, b) => a.localeCompare(b)).map((name) => ({
            state: name,
            count: INDIAN_RAILWAY_BY_STATE[name].length,
        }));
    }

    function getFallbackStations(stateName) {
        return (INDIAN_RAILWAY_BY_STATE[stateName] || []).map((st) => enrichStation({
            id: st.id,
            code: st.code,
            name: st.name,
            city: st.city,
            state: stateName,
            zone: st.zone,
            type: st.type,
            platforms: st.platforms,
            dailyTrains: st.dailyTrains,
            crew: st.crew,
            areaSqKm: st.areaSqKm,
            yearOpened: st.yearOpened,
        }));
    }

    function getStationFromFallback(code) {
        const upper = (code || '').toUpperCase();
        for (const [stateName, stations] of Object.entries(INDIAN_RAILWAY_BY_STATE)) {
            const found = stations.find((s) => s.code === upper);
            if (found) {
                return enrichStation({
                    ...found,
                    state: stateName,
                });
            }
        }
        return null;
    }

    async function loadStatesData() {
        try {
            const data = await API.getRailwayStates();
            statesData = data.states || [];
            totalStations = data.totalStations || statesData.reduce((sum, s) => sum + s.count, 0);
        } catch {
            statesData = getFallbackStates();
            totalStations = statesData.reduce((sum, s) => sum + s.count, 0);
        }
    }

    async function fetchStations({ stateName = '', query = '', offset = 0 } = {}) {
        try {
            const data = await API.getRailwayStations({
                state: stateName || '',
                q: query || '',
                limit: PAGE_SIZE,
                offset,
            });
            return {
                stations: (data.stations || []).map(enrichStation),
                total: data.total || 0,
                live: true,
            };
        } catch {
            let pool = stateName ? getFallbackStations(stateName) : [];
            if (!stateName && query) {
                pool = Object.entries(INDIAN_RAILWAY_BY_STATE).flatMap(([name, list]) =>
                    list.map((st) => enrichStation({ ...st, state: name }))
                );
            }
            const q = (query || '').trim().toLowerCase();
            if (q) {
                pool = pool.filter((s) =>
                    s.code.toLowerCase().includes(q)
                    || s.name.toLowerCase().includes(q)
                    || (s.city || '').toLowerCase().includes(q)
                );
            }
            return {
                stations: pool.slice(offset, offset + PAGE_SIZE),
                total: pool.length,
                live: false,
            };
        }
    }

    async function resolveStation(code) {
        try {
            const data = await API.getRailwayStationDetail(code);
            return enrichStation(data.station);
        } catch {
            return getStationFromFallback(code);
        }
    }

    function generateTrains(station) {
        const code = station.code;
        const hubs = RAILWAY_HUBS.filter((h) => h !== code);
        const trains = [];
        const statuses = ['On Time', 'On Time', 'Running', 'Platform assigned', 'Delayed 18m', 'Arrived'];
        const baseHour = 4 + (code.charCodeAt(0) % 3);

        hubs.slice(0, 5).forEach((hub, idx) => {
            const depH = baseHour + idx * 2;
            const arrH = depH + 2 + (idx % 3);
            const depM = (idx * 13) % 60;
            const arrM = (depM + 35) % 60;
            const type = TRAIN_TYPES[idx % TRAIN_TYPES.length];
            const trainNo = `${12000 + idx * 111 + code.charCodeAt(0) % 50}`;
            trains.push({
                trainNo,
                name: `${hub} ${type}`,
                type,
                source: hub,
                destination: code,
                dep: `${String(depH).padStart(2, '0')}:${String(depM).padStart(2, '0')}`,
                arr: `${String(arrH).padStart(2, '0')}:${String(arrM).padStart(2, '0')}`,
                platform: String(1 + (idx % 8)),
                duration: `${15 + idx * 5}m`,
                status: statuses[idx % statuses.length],
            });
        });

        hubs.slice(0, 5).forEach((hub, idx) => {
            const depH = baseHour + 1 + idx * 2;
            const arrH = depH + 2 + (idx % 2);
            const depM = (idx * 19 + 8) % 60;
            const arrM = (depM + 40) % 60;
            const type = TRAIN_TYPES[(idx + 1) % TRAIN_TYPES.length];
            const trainNo = `${18000 + idx * 97 + code.charCodeAt(1) % 40}`;
            trains.push({
                trainNo,
                name: `${code} ${type}`,
                type,
                source: code,
                destination: hub,
                dep: `${String(depH).padStart(2, '0')}:${String(depM).padStart(2, '0')}`,
                arr: `${String(arrH).padStart(2, '0')}:${String(arrM).padStart(2, '0')}`,
                platform: String(2 + (idx % 7)),
                duration: `${12 + idx * 6}m`,
                status: statuses[(idx + 2) % statuses.length],
            });
        });

        return trains.sort((a, b) => a.dep.localeCompare(b.dep));
    }

    function breadcrumb() {
        const parts = [
            `<button type="button" class="crumb ${state.view === 'states' ? 'active' : ''}" data-go="states">All States</button>`,
        ];
        if (state.stateName) {
            parts.push(`<span class="crumb-sep"><i class="fa-solid fa-chevron-right"></i></span>`);
            parts.push(`<button type="button" class="crumb ${state.view === 'stations' ? 'active' : ''}" data-go="stations" data-state="${escapeHtml(state.stateName)}">${escapeHtml(state.stateName)}</button>`);
        }
        if (state.stationCode && state.view === 'detail') {
            parts.push(`<span class="crumb-sep"><i class="fa-solid fa-chevron-right"></i></span>`);
            parts.push(`<span class="crumb active">${escapeHtml(state.stationCode)}</span>`);
        }
        return `<nav class="explorer-breadcrumb">${parts.join('')}</nav>`;
    }

    function renderStationRows(stations) {
        return stations.map((st) => `
            <button type="button" class="station-row" data-station-code="${escapeHtml(st.code)}">
                <div class="station-row-main">
                    <span class="station-code">${escapeHtml(st.code)}</span>
                    <div>
                        <strong>${escapeHtml(st.name)}</strong>
                        <span>${escapeHtml(st.city || st.state)} · ${escapeHtml(st.zone || '—')} · ${escapeHtml(st.type || 'Station')}</span>
                    </div>
                </div>
                <div class="station-row-meta">
                    <span><i class="fa-solid fa-train"></i> ${formatNumber(st.dailyTrains || 0)}/day</span>
                    <i class="fa-solid fa-chevron-right"></i>
                </div>
            </button>
        `).join('');
    }

    async function renderStates(filter = '') {
        if (!statesData.length) await loadStatesData();

        const q = filter.trim().toLowerCase();
        const states = statesData.filter((s) => !q || s.state.toLowerCase().includes(q));
        const showGlobal = q.length >= 2;

        body.innerHTML = `
            ${breadcrumb()}
            <div class="explorer-toolbar">
                <input type="search" class="explorer-search" placeholder="Search state or station code/name…" value="${escapeHtml(filter)}" id="railStateSearch">
                <span class="explorer-count">${formatNumber(totalStations)} stations · ${statesData.length} states</span>
            </div>
            <div id="globalStationResults">${showGlobal ? '<p class="trains-note" style="padding:8px 0"><i class="fa-solid fa-spinner fa-spin"></i> Searching all India stations…</p>' : ''}</div>
            <div class="state-grid">
                ${states.map((item) => `
                    <button type="button" class="state-chip" data-state="${escapeHtml(item.state)}">
                        <span class="state-name">${escapeHtml(item.state)}</span>
                        <span class="state-count">${formatNumber(item.count)} station${item.count > 1 ? 's' : ''}</span>
                    </button>
                `).join('')}
            </div>
        `;

        const searchInput = body.querySelector('#railStateSearch');
        let searchTimer = null;
        searchInput?.addEventListener('input', (e) => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => renderStates(e.target.value), 250);
        });

        body.querySelectorAll('.state-chip').forEach((btn) => {
            btn.addEventListener('click', () => showStations(btn.dataset.state));
        });
        bindBreadcrumb();

        if (showGlobal) await renderGlobalSearch(filter);
    }

    async function renderGlobalSearch(query) {
        const host = body.querySelector('#globalStationResults');
        if (!host) return;

        host.innerHTML = `<p class="trains-note" style="padding:8px 0"><i class="fa-solid fa-spinner fa-spin"></i> Searching all India stations…</p>`;
        const { stations, total } = await fetchStations({ query, offset: 0 });

        host.innerHTML = `
            <div class="explorer-toolbar" style="margin-top:4px">
                <span class="explorer-count">${formatNumber(total)} match${total === 1 ? '' : 'es'} for “${escapeHtml(query.trim())}”</span>
            </div>
            <div class="station-list">${renderStationRows(stations)}</div>
            ${total > PAGE_SIZE ? `<p class="trains-note" style="padding:8px 0">Showing first ${PAGE_SIZE} — refine search for more</p>` : ''}
        `;

        host.querySelectorAll('.station-row').forEach((row) => {
            row.addEventListener('click', () => showStationDetail(row.dataset.stationCode));
        });
    }

    async function showStations(stateName, query = '', offset = 0) {
        state = { view: 'stations', stateName, stationCode: null, stationQuery: query, stationOffset: offset };

        body.innerHTML = `
            ${breadcrumb()}
            <div class="explorer-toolbar">
                <input type="search" class="explorer-search" placeholder="Search station in ${escapeHtml(stateName)}…" value="${escapeHtml(query)}" id="stationSearchInput">
                <span class="explorer-count" id="stationListCount">Loading…</span>
            </div>
            <div class="station-list" id="stationListHost"><p class="trains-note" style="padding:12px"><i class="fa-solid fa-spinner fa-spin"></i> Loading stations…</p></div>
            <div class="explorer-toolbar" id="stationPager" hidden></div>
        `;

        body.querySelector('#stationSearchInput')?.addEventListener('input', (e) => {
            showStations(stateName, e.target.value, 0);
        });

        bindBreadcrumb();

        const { stations, total } = await fetchStations({ stateName, query, offset });
        const countEl = body.querySelector('#stationListCount');
        const listHost = body.querySelector('#stationListHost');
        const pager = body.querySelector('#stationPager');

        if (countEl) {
            countEl.textContent = `${formatNumber(total)} station${total === 1 ? '' : 's'} in ${stateName}`;
        }
        if (listHost) {
            listHost.innerHTML = stations.length
                ? renderStationRows(stations)
                : `<p class="trains-note" style="padding:12px">No stations found.</p>`;
            listHost.querySelectorAll('.station-row').forEach((row) => {
                row.addEventListener('click', () => showStationDetail(row.dataset.stationCode));
            });
        }

        if (pager && total > PAGE_SIZE) {
            const page = Math.floor(offset / PAGE_SIZE) + 1;
            const pages = Math.ceil(total / PAGE_SIZE);
            pager.hidden = false;
            pager.innerHTML = `
                <button type="button" class="service-btn secondary" id="stationPrev" ${offset <= 0 ? 'disabled' : ''}>Previous</button>
                <span class="explorer-count">Page ${page} of ${pages}</span>
                <button type="button" class="service-btn secondary" id="stationNext" ${offset + PAGE_SIZE >= total ? 'disabled' : ''}>Next</button>
            `;
            pager.querySelector('#stationPrev')?.addEventListener('click', () => showStations(stateName, query, Math.max(0, offset - PAGE_SIZE)));
            pager.querySelector('#stationNext')?.addEventListener('click', () => showStations(stateName, query, offset + PAGE_SIZE));
        }
    }

    function statCard(icon, label, value, sub) {
        return `<div class="station-stat">
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
        if (/platform|arriv|run/i.test(status)) return 'boarding';
        return 'ontime';
    }

    function livePlatformsFromTrains(trains, apiPlatforms = []) {
        const fromApi = Array.isArray(apiPlatforms) ? apiPlatforms : [];
        if (fromApi.length) return fromApi;
        const seen = new Set();
        const platforms = [];
        (trains || []).forEach((t) => {
            const p = String(t.platform || '').trim();
            if (!p || p === '—' || seen.has(p)) return;
            seen.add(p);
            platforms.push(p);
        });
        return platforms.sort((a, b) => {
            const na = Number(a);
            const nb = Number(b);
            if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
            return a.localeCompare(b);
        });
    }

    function renderPlatformBoard(platforms, live) {
        if (!platforms.length) {
            return `<p class="trains-note platform-board-empty">No live platform assignments right now.</p>`;
        }
        return `
            <div class="platform-board">
                <div class="platform-board-head">
                    <h4><i class="fa-solid fa-layer-group"></i> Live platforms</h4>
                    <span class="trains-note">${live ? 'From IRCTC / Indian Railways API' : 'Sample data'}</span>
                </div>
                <div class="platform-chips">
                    ${platforms.map((p) => `<span class="platform-chip"><i class="fa-solid fa-signs-post"></i> Platform ${escapeHtml(p)}</span>`).join('')}
                </div>
            </div>
        `;
    }

    function renderTrainsTable(trains) {
        if (!trains.length) {
            return `<p class="trains-note" style="padding:12px">No live trains returned for this station right now.</p>`;
        }
        return `
            <div class="trains-table-wrap">
                <table class="trains-table">
                    <thead>
                        <tr>
                            <th>Train</th>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Source</th>
                            <th>Destination</th>
                            <th>Dep</th>
                            <th>Arr</th>
                            <th>Platform</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${trains.map((t) => `
                            <tr>
                                <td><strong>${escapeHtml(t.trainNo)}</strong></td>
                                <td>${escapeHtml(t.name)}</td>
                                <td>${escapeHtml(t.type)}</td>
                                <td title="${escapeHtml(stationLabel(t.source))}">${escapeHtml(t.source)}</td>
                                <td title="${escapeHtml(stationLabel(t.destination))}">${escapeHtml(t.destination)}</td>
                                <td>${escapeHtml(t.dep)}</td>
                                <td>${escapeHtml(t.arr)}</td>
                                <td><span class="platform-cell">${escapeHtml(t.platform || '—')}</span></td>
                                <td><span class="train-status ${statusClass(t.status)}">${escapeHtml(t.status)}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    async function showStationDetail(stationCode) {
        const station = await resolveStation(stationCode);
        if (!station) return;

        state = {
            view: 'detail',
            stateName: station.state || state.stateName,
            stationCode: station.code,
            stationQuery: state.stationQuery,
            stationOffset: state.stationOffset,
        };
        const annualTrains = Math.round((station.dailyTrains || 0) * 365 * 0.95);

        body.innerHTML = `
            ${breadcrumb()}
            ${railwayHeroGalleryHtml(station.code, station.name)}
            <div class="station-detail-header has-photo">
                <div>
                    <span class="detail-station-code">${escapeHtml(station.code)}</span>
                    <h3>${escapeHtml(station.name)}</h3>
                    <p>${escapeHtml(station.city || '')}${station.city ? ', ' : ''}${escapeHtml(station.state || state.stateName || '')} · ${escapeHtml(station.zone || '—')} zone${station.yearOpened ? ` · Est. ${station.yearOpened}` : ''}</p>
                </div>
                <button type="button" class="service-btn plan-route-btn" data-route="${escapeHtml(station.name + ', ' + (station.city || station.state || ''))}">
                    <i class="fa-solid fa-route"></i> Plan route
                </button>
            </div>

            <div class="station-stats-grid">
                ${statCard('fa-vector-square', 'Station area', `${station.areaSqKm || '—'} km²`, 'Platform & yard footprint')}
                ${statCard('fa-users', 'Railway crew & staff', formatNumber(station.crew || 0), 'Operations & maintenance')}
                ${statCard('fa-train', 'Daily trains', formatNumber(station.dailyTrains || 0), station.dailyTrains ? `~${formatNumber(annualTrains)} / year` : 'Estimated')}
                ${statCard('fa-layer-group', 'Platforms', station.platforms || '—', station.type || 'Station')}
                ${statCard('fa-building', 'Zone', station.zone || '—', 'Indian Railways')}
                ${statCard('fa-clock', 'Category', station.type || 'Station', station.yearOpened ? `Since ${station.yearOpened}` : 'Operational station')}
            </div>

            <div id="platformBoardHost"><p class="trains-note" style="padding:8px 0"><i class="fa-solid fa-spinner fa-spin"></i> Loading live platforms…</p></div>

            <div class="trains-section">
                <div class="trains-section-head">
                    <h4><i class="fa-solid fa-clock"></i> Live station board</h4>
                    <span class="trains-note" id="trainScheduleNote">Loading live data…</span>
                </div>
                <div id="trainsTableHost"><p class="trains-note" style="padding:12px"><i class="fa-solid fa-spinner fa-spin"></i> Fetching trains…</p></div>
            </div>
        `;

        body.querySelector('.plan-route-btn')?.addEventListener('click', (e) => {
            const dest = e.currentTarget.dataset.route;
            sessionStorage.setItem('navipulse_service_dest', dest);
            sessionStorage.setItem('navipulse_service_type', 'railway');
            window.location.href = 'dashboard.html?service=railway';
        });
        bindBreadcrumb();
        bindRailwayGalleryTriggers(body, station.name);

        loadRailwayPhotos(station.code, station.name, station.city).then(({ urls, meta }) => {
            const photoBlock = body.querySelector('.railway-photo-block');
            refreshRailwayPhotoBlock(photoBlock, station.code, station.name, urls, meta);
            bindRailwayGalleryTriggers(body, station.name);
        });

        let trains = [];
        let livePlatforms = [];
        let isLive = false;
        let note = 'Sample schedules (API unavailable)';
        try {
            const data = await API.getRailwayStationTrains(station.code, 2);
            trains = data.trains || [];
            livePlatforms = data.livePlatforms || [];
            isLive = Boolean(data.live);
            note = data.live
                ? (data.source === 'irctc-connect'
                    ? 'Live · IRCTC Connect API'
                    : data.source === 'ntes'
                        ? 'Live · Indian Railways NTES'
                        : 'Live · Indian Rail API')
                : 'Train schedule';
        } catch (err) {
            trains = generateTrains(station);
            note = `Sample data — ${err.message || 'live API unavailable'}`;
        }

        const platforms = livePlatformsFromTrains(trains, livePlatforms);
        const platformHost = body.querySelector('#platformBoardHost');
        if (platformHost) platformHost.innerHTML = renderPlatformBoard(platforms, isLive);

        if (platforms.length) {
            const platformStat = body.querySelector('.station-stats-grid .station-stat:nth-child(4) strong');
            const platformSub = body.querySelector('.station-stats-grid .station-stat:nth-child(4) small');
            if (platformStat) {
                platformStat.textContent = isLive
                    ? `${platforms.length} active now`
                    : (station.platforms || platforms.length);
            }
            if (platformSub && isLive) platformSub.textContent = `Platforms ${platforms.join(', ')}`;
        }

        const noteEl = body.querySelector('#trainScheduleNote');
        const host = body.querySelector('#trainsTableHost');
        if (noteEl) noteEl.textContent = note;
        if (host) host.innerHTML = renderTrainsTable(trains);
    }

    function bindBreadcrumb() {
        body.querySelectorAll('.crumb[data-go]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const go = btn.dataset.go;
                if (go === 'states') {
                    state = { view: 'states', stateName: null, stationCode: null, stationQuery: '', stationOffset: 0 };
                    renderStates();
                } else if (go === 'stations' && state.stateName) {
                    showStations(state.stateName, state.stationQuery, state.stationOffset);
                }
            });
        });
    }

    async function init(containerId, options = {}) {
        const { pageMode = false } = options;
        root = document.getElementById(containerId);
        if (!root) return;

        body = root.querySelector('.explorer-body');
        const toggle = root.querySelector('.explorer-toggle');

        if (pageMode) {
            root.classList.add('page-mode', 'open');
            if (body) body.hidden = false;
            if (toggle) toggle.style.display = 'none';
            await loadStatesData();
            await renderStates();
            return;
        }

        toggle?.addEventListener('click', async () => {
            const isOpen = root.classList.contains('open');
            root.classList.toggle('open', !isOpen);
            if (body) body.hidden = isOpen;
            if (!isOpen) {
                await loadStatesData();
                await renderStates();
            }
        });
    }

    return { init, renderStates };
})();
