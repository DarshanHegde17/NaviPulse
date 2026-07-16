/**
 * Live Train Tracking — India map via NTES station boards + train number track
 */
(function () {
    const REFRESH_MS = 60000;
    const REGIONS = {
        india: {
            center: [22.5, 79],
            zoom: 5,
            hubs: 'NDLS,CSTM,HWH,MAS,SBC,SC,ADI,PUNE',
        },
        north: {
            center: [28.6, 77.2],
            zoom: 6,
            hubs: 'NDLS,NZM,LKO,JP,ASR,JAT,CNB',
        },
        west: {
            center: [20.5, 74],
            zoom: 6,
            hubs: 'CSTM,BCT,PUNE,ADI,NGP,ST',
        },
        south: {
            center: [13.0, 77.5],
            zoom: 6,
            hubs: 'SBC,MAS,SC,ERS,CBE,MYS',
        },
        east: {
            center: [22.6, 88.4],
            zoom: 6,
            hubs: 'HWH,SDAH,PNBE,BBS,GHY,RNC',
        },
    };

    const TRAIN_SVG = '<i class="fa-solid fa-train"></i>';

    let map;
    let markersLayer;
    let trainsByNo = new Map();
    let selectedNo = null;
    let refreshTimer = null;
    let currentRegion = 'india';
    let loading = false;

    function $(id) {
        return document.getElementById(id);
    }

    function showToast(msg, ms = 4500) {
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

    function trainIcon(selected) {
        const cls = selected ? 'train-icon selected' : 'train-icon';
        return L.divIcon({
            className: '',
            html: `<div class="${cls}">${TRAIN_SVG}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
        });
    }

    function initMap() {
        const r = REGIONS.india;
        map = L.map('trainMap', {
            zoomControl: true,
            worldCopyJump: false,
            minZoom: 4,
            maxZoom: 12,
        }).setView(r.center, r.zoom);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap &copy; CARTO · Live status: NTES / Indian Railways',
            subdomains: 'abcd',
            maxZoom: 19,
        }).addTo(map);

        markersLayer = L.layerGroup().addTo(map);
    }

    function renderMarkers(trains) {
        markersLayer.clearLayers();
        trains.forEach((t) => {
            if (t.lat == null || t.lng == null) return;
            const selected = t.trainNo === selectedNo;
            const marker = L.marker([t.lat, t.lng], {
                icon: trainIcon(selected),
                title: `${t.trainNo} ${t.name || ''}`.trim(),
            });
            marker.bindTooltip(`${t.trainNo}`, {
                permanent: false,
                direction: 'top',
                offset: [0, -12],
                className: 'train-tip',
            });
            marker.on('click', () => selectTrain(t.trainNo));
            marker.addTo(markersLayer);
        });
    }

    function selectTrain(trainNo, enrich = true) {
        selectedNo = trainNo;
        const t = trainsByNo.get(trainNo);
        if (!t) return;

        $('detailTrainNo').textContent = t.trainNo;
        $('detailTrainName').textContent = t.name || '—';

        const delayed = (t.status || '').toLowerCase().includes('delay') || (t.delayMin || 0) > 0;
        const status = delayed
            ? `<span class="status-pill gnd">${t.status || 'Delayed'}</span>`
            : `<span class="status-pill air">${t.status || 'On Time'}</span>`;

        $('detailBody').innerHTML = `
            <div class="detail-row"><span class="label">Status</span><span class="value">${status}</span></div>
            <div class="detail-row"><span class="label">Note</span><span class="value">${t.statusNote || '—'}</span></div>
            <div class="detail-row"><span class="label">Last station</span><span class="value">${t.lastStationName || t.lastStation || '—'}</span></div>
            <div class="detail-row"><span class="label">Next</span><span class="value">${t.nextStationName || t.nextStation || '—'}</span></div>
            <div class="detail-row"><span class="label">From</span><span class="value">${t.sourceName || t.source || '—'}</span></div>
            <div class="detail-row"><span class="label">To</span><span class="value">${t.destinationName || t.destination || '—'}</span></div>
            <div class="detail-row"><span class="label">Platform</span><span class="value">${t.platform || '—'}</span></div>
            <div class="detail-row"><span class="label">Updated</span><span class="value">${t.updated || '—'}</span></div>
            <div class="detail-row"><span class="label">Position</span><span class="value">${Number(t.lat).toFixed(3)}, ${Number(t.lng).toFixed(3)}</span></div>
        `;

        $('detailPanel').classList.add('open');
        renderMarkers([...trainsByNo.values()]);
        map.panTo([t.lat, t.lng], { animate: true });

        if (enrich && /^\d{4,5}$/.test(String(trainNo))) {
            API.trackTrain(trainNo)
                .then((live) => {
                    if (!live || live.trainNo !== selectedNo) return;
                    trainsByNo.set(live.trainNo, { ...t, ...live });
                    selectTrain(live.trainNo, false);
                })
                .catch(() => {});
        }
    }

    function closeDetail() {
        selectedNo = null;
        $('detailPanel').classList.remove('open');
        renderMarkers([...trainsByNo.values()]);
    }

    function updateStats(trains, hubs, timeUnix) {
        $('statCount').textContent = String(trains.length);
        $('statHubs').textContent = String((hubs || []).length);
        const d = timeUnix ? new Date(timeUnix * 1000) : new Date();
        $('statUpdated').textContent = d.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    }

    async function loadTrains() {
        if (loading) return;
        loading = true;
        setLiveStatus('warn', 'Updating…');

        const hubs = REGIONS[currentRegion]?.hubs || REGIONS.india.hubs;
        try {
            const data = await API.getLiveTrains(hubs);
            const trains = data.trains || [];
            trainsByNo = new Map(trains.map((t) => [String(t.trainNo), t]));
            renderMarkers(trains);
            updateStats(trains, data.hubs, data.time);
            setLiveStatus('ok', `Live · ${trains.length} trains`);

            if (selectedNo && trainsByNo.has(selectedNo)) {
                selectTrain(selectedNo, false);
            } else if (selectedNo) {
                closeDetail();
            }
        } catch (err) {
            console.error(err);
            setLiveStatus('err', 'Offline');
            showToast(err.message || 'Could not load live trains. Is the backend running?');
        } finally {
            loading = false;
        }
    }

    function goRegion(key) {
        currentRegion = key;
        document.querySelectorAll('.region-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.region === key);
        });
        const r = REGIONS[key] || REGIONS.india;
        map.setView(r.center, r.zoom);
        loadTrains();
    }

    async function trackByNumber(q) {
        const number = String(q || '').trim();
        if (!/^\d{4,5}$/.test(number)) {
            showToast('Enter a 4–5 digit train number (e.g. 12301)');
            return;
        }
        setLiveStatus('warn', `Tracking ${number}…`);
        try {
            const live = await API.trackTrain(number);
            trainsByNo.set(String(live.trainNo), live);
            renderMarkers([...trainsByNo.values()]);
            selectTrain(String(live.trainNo), false);
            map.setView([live.lat, live.lng], Math.max(map.getZoom(), 7));
            setLiveStatus('ok', `Tracked · ${live.trainNo}`);
            updateStats([...trainsByNo.values()], REGIONS[currentRegion]?.hubs?.split(',') || [], Date.now() / 1000);
        } catch (err) {
            setLiveStatus('err', 'Not found');
            showToast(err.message || `Could not track train ${number}`);
        }
    }

    function bindUI() {
        $('detailClose').addEventListener('click', closeDetail);
        $('regionBar').addEventListener('click', (e) => {
            const btn = e.target.closest('.region-btn');
            if (btn) goRegion(btn.dataset.region);
        });
        const search = $('trainSearch');
        const btn = $('trainSearchBtn');
        search.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') trackByNumber(search.value);
        });
        btn.addEventListener('click', () => trackByNumber(search.value));
    }

    document.addEventListener('DOMContentLoaded', () => {
        initMap();
        bindUI();
        loadTrains();
        refreshTimer = setInterval(loadTrains, REFRESH_MS);
    });

    window.addEventListener('beforeunload', () => {
        if (refreshTimer) clearInterval(refreshTimer);
    });
})();
