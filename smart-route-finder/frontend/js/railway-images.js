/** Railway station photo galleries — Wikimedia Commons API + curated fallbacks */
const WIKIMEDIA_COMMONS_API_URL = 'https://commons.wikimedia.org/w/api.php';
const WIKIMEDIA_RAILWAY_CATEGORY = 'https://commons.wikimedia.org/wiki/Category:Railway_stations_in_India';

const _railwayPhotosCache = {};
const _railwayPhotoMeta = {};

const RAILWAY_IMAGE_FALLBACK =
    'https://images.unsplash.com/photo-1474487541817-7cb4653789b1?auto=format&fit=crop&w=1200&q=80';

const RAILWAY_GALLERY_EXTRAS = [
    'https://images.unsplash.com/photo-1515169067865-5387bd3f413f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1500382017468-9049fed747be?auto=format&fit=crop&w=1200&q=80',
];

const RAILWAY_GALLERY = {
    SBC: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Bangalore_City_railway_station.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/KSR_Bengaluru_City_railway_station.jpg?width=1200',
    ],
    NDLS: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/New_Delhi_railway_station.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/New_Delhi_Railway_Station_at_night.jpg?width=1200',
    ],
    CSTM: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Chhatrapati_Shivaji_Terminus.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Mumbai_CST_Station.jpg?width=1200',
    ],
    HWH: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Howrah_Station.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Howrah_railway_station.jpg?width=1200',
    ],
    MAS: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Chennai_Central_railway_station.jpg?width=1200',
    ],
    SC: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Secunderabad_railway_station.jpg?width=1200',
    ],
    PNBE: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Patna_Junction_railway_station.jpg?width=1200',
    ],
    ADI: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Ahmedabad_railway_station.jpg?width=1200',
    ],
    JP: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Jaipur_railway_station.jpg?width=1200',
    ],
    BCT: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Mumbai_Central_railway_station.jpg?width=1200',
    ],
};

function getCuratedRailwayImageUrls(code) {
    const upper = (code || '').toUpperCase();
    const curated = RAILWAY_GALLERY[upper];
    if (curated && curated.length) {
        const unique = [...new Set(curated.filter(Boolean))];
        if (unique.length >= 3) return unique;
        const extras = RAILWAY_GALLERY_EXTRAS.filter((url) => !unique.includes(url));
        return unique.concat(extras.slice(0, 3 - unique.length));
    }
    return [RAILWAY_IMAGE_FALLBACK, ...RAILWAY_GALLERY_EXTRAS.slice(0, 2)];
}

function mergeRailwayPhotoUrls(primary, code) {
    const merged = [];
    const seen = new Set();
    [...primary, ...getCuratedRailwayImageUrls(code), RAILWAY_IMAGE_FALLBACK, ...RAILWAY_GALLERY_EXTRAS].forEach((url) => {
        if (url && !seen.has(url)) {
            seen.add(url);
            merged.push(url);
        }
    });
    return merged.slice(0, 12);
}

function getRailwayImageUrls(code) {
    const upper = (code || '').toUpperCase();
    if (_railwayPhotosCache[upper]?.length) return _railwayPhotosCache[upper];
    return getCuratedRailwayImageUrls(upper);
}

function getRailwayImageUrl(code) {
    return getRailwayImageUrls(code)[0] || RAILWAY_IMAGE_FALLBACK;
}

function railwayImageHtml(code, alt, className = 'railway-photo') {
    const src = getRailwayImageUrl(code);
    const safeAlt = String(alt || code || 'Railway station').replace(/"/g, '&quot;');
    return `<img class="${className}" src="${src}" alt="${safeAlt}" loading="lazy" onerror="this.onerror=null;this.src='${RAILWAY_IMAGE_FALLBACK}'">`;
}

async function loadRailwayPhotos(code, name, city) {
    const upper = (code || '').toUpperCase();
    if (_railwayPhotosCache[upper]) {
        return { urls: _railwayPhotosCache[upper], meta: _railwayPhotoMeta[upper] || {} };
    }

    try {
        const data = await API.getRailwayPhotos(upper, name || '', city || '');
        const apiUrls = (data.photos || []).map((p) => p.url).filter(Boolean);
        const urls = mergeRailwayPhotoUrls(apiUrls, upper);
        _railwayPhotosCache[upper] = urls;
        _railwayPhotoMeta[upper] = {
            source: data.source || 'wikimedia-commons',
            apiUrl: data.apiUrl || WIKIMEDIA_COMMONS_API_URL,
            categoryUrl: data.categoryUrl || WIKIMEDIA_RAILWAY_CATEGORY,
            live: Boolean(data.live),
        };
        return { urls, meta: _railwayPhotoMeta[upper] };
    } catch (err) {
        const urls = getCuratedRailwayImageUrls(upper);
        _railwayPhotosCache[upper] = urls;
        _railwayPhotoMeta[upper] = { source: 'curated-fallback', live: false, error: err.message };
        return { urls, meta: _railwayPhotoMeta[upper] };
    }
}

function railwayHeroGalleryHtml(code, alt, urls = null) {
    const resolved = urls || getRailwayImageUrls(code);
    const safeAlt = String(alt || code || 'Railway station').replace(/"/g, '&quot;');
    const heroSrc = resolved[0] || RAILWAY_IMAGE_FALLBACK;
    const thumbs = resolved.slice(0, 4).map((src, idx) =>
        `<img class="railway-hero-thumb${idx === 0 ? ' active' : ''}" src="${src}" alt="${safeAlt} photo ${idx + 1}" loading="lazy" onerror="this.onerror=null;this.src='${RAILWAY_IMAGE_FALLBACK}'">`
    ).join('');

    return `
        <div class="railway-photo-block" data-station-code="${(code || '').toUpperCase()}">
            <button type="button" class="railway-hero-wrap" data-gallery-code="${(code || '').toUpperCase()}" aria-label="View ${resolved.length} station photos">
                <img class="railway-detail-hero" src="${heroSrc}" alt="${safeAlt}" loading="lazy" onerror="this.onerror=null;this.src='${RAILWAY_IMAGE_FALLBACK}'">
                <span class="photo-count-badge railway-badge"><i class="fa-solid fa-images"></i> <span class="photo-count-text">${resolved.length} Photos</span></span>
            </button>
            <div class="railway-photo-toolbar">
                <button type="button" class="service-btn secondary view-railway-photos-btn" data-gallery-code="${(code || '').toUpperCase()}">
                    <i class="fa-solid fa-camera"></i> View all photos
                </button>
                <span class="railway-photo-source" id="railwayPhotoSource"></span>
            </div>
            <div class="railway-thumb-strip">${thumbs}</div>
        </div>
    `;
}

function refreshRailwayPhotoBlock(block, code, alt, urls, meta = {}) {
    if (!block || !urls?.length) return;

    const upper = (code || '').toUpperCase();
    _railwayPhotosCache[upper] = urls;

    const hero = block.querySelector('.railway-detail-hero');
    if (hero) hero.src = urls[0];

    const countText = block.querySelector('.photo-count-text');
    if (countText) countText.textContent = `${urls.length} Photos`;

    const strip = block.querySelector('.railway-thumb-strip');
    if (strip) {
        const safeAlt = String(alt || code || 'Railway station').replace(/"/g, '&quot;');
        strip.innerHTML = urls.slice(0, 4).map((src, idx) =>
            `<img class="railway-hero-thumb${idx === 0 ? ' active' : ''}" src="${src}" alt="${safeAlt} photo ${idx + 1}" loading="lazy" onerror="this.onerror=null;this.src='${RAILWAY_IMAGE_FALLBACK}'">`
        ).join('');
    }

    const sourceEl = block.querySelector('#railwayPhotoSource') || block.querySelector('.railway-photo-source');
    if (sourceEl && meta.live) {
        const link = meta.categoryUrl || WIKIMEDIA_RAILWAY_CATEGORY;
        sourceEl.innerHTML = `<a href="${link}" target="_blank" rel="noopener">Wikimedia Commons</a>`;
    } else if (sourceEl && meta.source === 'curated-fallback') {
        sourceEl.textContent = 'Curated photos';
    }
}

let railwayGalleryModalEl = null;
let railwayGalleryState = { urls: [], index: 0, title: '' };

function ensureRailwayGalleryModal() {
    if (railwayGalleryModalEl) return railwayGalleryModalEl;

    railwayGalleryModalEl = document.createElement('div');
    railwayGalleryModalEl.id = 'railwayPhotoGallery';
    railwayGalleryModalEl.className = 'railway-gallery-modal';
    railwayGalleryModalEl.hidden = true;
    railwayGalleryModalEl.innerHTML = `
        <div class="railway-gallery-backdrop" data-railway-gallery-close></div>
        <div class="railway-gallery-dialog" role="dialog" aria-modal="true" aria-label="Railway station photo gallery">
            <div class="railway-gallery-header">
                <div>
                    <h4 id="railwayGalleryTitle">Station photos</h4>
                    <span class="railway-gallery-counter" id="railwayGalleryCounter">1 / 1</span>
                </div>
                <button type="button" class="railway-gallery-close" data-railway-gallery-close aria-label="Close gallery">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="railway-gallery-main">
                <button type="button" class="railway-gallery-nav prev" data-railway-gallery-prev aria-label="Previous photo">
                    <i class="fa-solid fa-chevron-left"></i>
                </button>
                <img id="railwayGalleryMain" class="railway-gallery-image" src="" alt="">
                <button type="button" class="railway-gallery-nav next" data-railway-gallery-next aria-label="Next photo">
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
            </div>
            <div class="railway-gallery-thumbs" id="railwayGalleryThumbs"></div>
        </div>
    `;
    document.body.appendChild(railwayGalleryModalEl);

    railwayGalleryModalEl.querySelectorAll('[data-railway-gallery-close]').forEach((el) => {
        el.addEventListener('click', closeRailwayPhotoGallery);
    });
    railwayGalleryModalEl.querySelector('[data-railway-gallery-prev]')?.addEventListener('click', () => stepRailwayGallery(-1));
    railwayGalleryModalEl.querySelector('[data-railway-gallery-next]')?.addEventListener('click', () => stepRailwayGallery(1));

    document.addEventListener('keydown', (e) => {
        if (railwayGalleryModalEl.hidden) return;
        if (e.key === 'Escape') closeRailwayPhotoGallery();
        if (e.key === 'ArrowLeft') stepRailwayGallery(-1);
        if (e.key === 'ArrowRight') stepRailwayGallery(1);
    });

    return railwayGalleryModalEl;
}

function renderRailwayGallerySlide() {
    const modal = ensureRailwayGalleryModal();
    const { urls, index, title } = railwayGalleryState;
    const main = modal.querySelector('#railwayGalleryMain');
    const counter = modal.querySelector('#railwayGalleryCounter');
    const titleEl = modal.querySelector('#railwayGalleryTitle');
    const thumbsHost = modal.querySelector('#railwayGalleryThumbs');

    if (!main || !urls.length) return;

    main.src = urls[index];
    main.alt = `${title} — photo ${index + 1}`;
    main.onerror = () => { main.onerror = null; main.src = RAILWAY_IMAGE_FALLBACK; };
    counter.textContent = `${index + 1} / ${urls.length}`;
    titleEl.textContent = title;

    thumbsHost.innerHTML = urls.map((url, idx) =>
        `<button type="button" class="railway-gallery-thumb${idx === index ? ' active' : ''}" data-railway-gallery-index="${idx}" aria-label="Photo ${idx + 1}">
            <img src="${url}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${RAILWAY_IMAGE_FALLBACK}'">
        </button>`
    ).join('');

    thumbsHost.querySelectorAll('[data-railway-gallery-index]').forEach((btn) => {
        btn.addEventListener('click', () => {
            railwayGalleryState.index = Number(btn.dataset.railwayGalleryIndex);
            renderRailwayGallerySlide();
        });
    });
}

function stepRailwayGallery(delta) {
    const total = railwayGalleryState.urls.length;
    if (!total) return;
    railwayGalleryState.index = (railwayGalleryState.index + delta + total) % total;
    renderRailwayGallerySlide();
}

function openRailwayPhotoGallery(code, stationName, startIndex = 0) {
    const upper = (code || '').toUpperCase();
    const urls = _railwayPhotosCache[upper] || getRailwayImageUrls(upper);
    railwayGalleryState = {
        urls,
        index: Math.max(0, Math.min(startIndex, urls.length - 1)),
        title: stationName || upper || 'Railway station',
    };

    const modal = ensureRailwayGalleryModal();
    modal.hidden = false;
    document.body.classList.add('railway-gallery-open');
    renderRailwayGallerySlide();
}

function closeRailwayPhotoGallery() {
    if (!railwayGalleryModalEl) return;
    railwayGalleryModalEl.hidden = true;
    document.body.classList.remove('railway-gallery-open');
}

function bindRailwayGalleryTriggers(container, stationName) {
    if (!container) return;

    container.dataset.galleryName = stationName;
    if (container.dataset.galleryBound === '1') return;

    container.dataset.galleryBound = '1';
    container.addEventListener('click', (e) => {
        const name = container.dataset.galleryName || 'Railway station';
        const thumb = e.target.closest('.railway-hero-thumb');
        if (thumb) {
            e.stopPropagation();
            const idx = [...container.querySelectorAll('.railway-hero-thumb')].indexOf(thumb);
            const code = container.querySelector('[data-gallery-code]')?.dataset.galleryCode;
            if (code) openRailwayPhotoGallery(code, name, Math.max(0, idx));
            return;
        }
        const trigger = e.target.closest('[data-gallery-code]');
        if (trigger) openRailwayPhotoGallery(trigger.dataset.galleryCode, name, 0);
    });
}
