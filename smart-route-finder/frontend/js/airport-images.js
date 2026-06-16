/** Airport photo galleries — Wikimedia Commons API + curated fallbacks */
const WIKIMEDIA_COMMONS_API_URL = 'https://commons.wikimedia.org/w/api.php';
const WIKIMEDIA_AIRPORTS_CATEGORY = 'https://commons.wikimedia.org/wiki/Category:Airports_in_India';

const _airportPhotosCache = {};
const _airportPhotoMeta = {};

const AIRPORT_IMAGE_FALLBACK =    'https://images.unsplash.com/photo-1436491865332-7a61a386cc44?auto=format&fit=crop&w=1200&q=80';

const AIRPORT_GALLERY_EXTRAS = [
    'https://images.unsplash.com/photo-1583608205776-bdFD74ea0cd7?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1540962351504-03077e964a27?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1529074963764-7595c41d69a5?auto=format&fit=crop&w=1200&q=80',
];

const AIRPORT_GALLERY = {
    DEL: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Delhi_Indira_Gandhi_International_Airport_Terminal_3.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/IGI_Airport_Delhi.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Indira_Gandhi_International_Airport_2015.jpg?width=1200',
    ],
    BOM: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Chhatrapati_Shivaji_Maharaj_International_Airport.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Mumbai_Airport_Terminal_2.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Chhatrapati_Shivaji_International_Airport.jpg?width=1200',
    ],
    BLR: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Kempegowda_International_Airport,_Bangalore.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Kempegowda_International_Airport_Terminal_1.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Bengaluru_International_Airport.jpg?width=1200',
    ],
    HYD: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Rajiv_Gandhi_International_Airport.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Rajiv_Gandhi_International_Airport,_Hyderabad.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Hyderabad_Airport.jpg?width=1200',
    ],
    MAA: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Chennai_International_Airport.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Chennai_Airport_Terminal.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Anna_International_Airport.jpg?width=1200',
    ],
    CCU: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Netaji_Subhas_Chandra_Bose_International_Airport.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Kolkata_Airport.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Dum_Dum_Airport.jpg?width=1200',
    ],
    COK: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Cochin_International_Airport.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Cochin_International_Airport_Terminal.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Kochi_Airport.jpg?width=1200',
    ],
    TRV: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Trivandrum_International_Airport.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Thiruvananthapuram_Airport.jpg?width=1200',
    ],
    CCJ: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Calicut_International_Airport.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Kozhikode_Airport.jpg?width=1200',
    ],
    CNN: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Kannur_International_Airport.jpg?width=1200',
    ],
    GOI: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Dabolim_Airport.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Goa_Airport.jpg?width=1200',
    ],
    GOX: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Manohar_International_Airport.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Mopa_Airport.jpg?width=1200',
    ],
    AMD: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Sardar_Vallabhbhai_Patel_International_Airport.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Ahmedabad_Airport.jpg?width=1200',
    ],
    PNQ: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Pune_Airport.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Lohegaon_Airport.jpg?width=1200',
    ],
    NAG: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Dr._Babasaheb_Ambedkar_International_Airport,_Nagpur.jpg?width=1200',
    ],
    JAI: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Jaipur_International_Airport.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Jaipur_Airport_Terminal.jpg?width=1200',
    ],
    LKO: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Chaudhary_Charan_Singh_International_Airport.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Lucknow_Airport.jpg?width=1200',
    ],
    VNS: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Lal_Bahadur_Shastri_Airport.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Varanasi_Airport.jpg?width=1200',
    ],
    PAT: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Jayaprakash_Narayan_International_Airport.jpg?width=1200',
    ],
    GAU: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Lokpriya_Gopinath_Bordoloi_International_Airport.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Guwahati_Airport.jpg?width=1200',
    ],
    IXR: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Birsa_Munda_Airport.jpg?width=1200',
    ],
    BBI: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Biju_Patnaik_International_Airport.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Bhubaneswar_Airport.jpg?width=1200',
    ],
    IXC: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Chandigarh_Airport.jpg?width=1200',
    ],
    SXR: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Srinagar_Airport.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Sheikh_ul-Alam_International_Airport.jpg?width=1200',
    ],
    IXL: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Kushok_Bakula_Rimpochee_Airport.jpg?width=1200',
    ],
    IXB: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Bagdogra_Airport.jpg?width=1200',
    ],
    IXZ: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Veer_Savarkar_International_Airport.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Port_Blair_Airport.jpg?width=1200',
    ],
    ATQ: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Sri_Guru_Ram_Dass_Jee_International_Airport.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Amritsar_Airport.jpg?width=1200',
    ],
    IXE: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Mangalore_International_Airport.jpg?width=1200',
    ],
    BHO: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Raja_Bhoj_Airport.jpg?width=1200',
    ],
    IDR: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Devi_Ahilyabai_Holkar_Airport.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Indore_Airport.jpg?width=1200',
    ],
    VTZ: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Visakhapatnam_Airport.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Visakhapatnam_Airport_Terminal.jpg?width=1200',
    ],
    IMF: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Imphal_Airport.jpg?width=1200',
    ],
    AYJ: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Maharishi_Valimiki_International_Airport_Ayodhya.jpg?width=1200',
    ],
    DED: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Jolly_Grant_Airport.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Dehradun_Airport.jpg?width=1200',
    ],
    RPR: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Swami_Vivekananda_Airport.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Raipur_Airport.jpg?width=1200',
    ],
    GAY: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Gaya_Airport.jpg?width=1200',
    ],
    IXA: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Maharaja_Bir_Bikram_Airport.jpg?width=1200',
    ],
    CJB: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Coimbatore_International_Airport.jpg?width=1200',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Coimbatore_Airport.jpg?width=1200',
    ],
    IXM: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Madurai_Airport.jpg?width=1200',
    ],
    TRZ: [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Tiruchirappalli_International_Airport.jpg?width=1200',
    ],
};

function mergeAirportPhotoUrls(primary, iata) {
    const code = (iata || '').toUpperCase();
    const curated = getCuratedAirportImageUrls(code);
    const merged = [];
    const seen = new Set();
    [...primary, ...curated, AIRPORT_IMAGE_FALLBACK, ...AIRPORT_GALLERY_EXTRAS].forEach((url) => {
        if (url && !seen.has(url)) {
            seen.add(url);
            merged.push(url);
        }
    });
    return merged.slice(0, 12);
}

function getCuratedAirportImageUrls(iata) {
    const code = (iata || '').toUpperCase();
    const curated = AIRPORT_GALLERY[code];
    if (curated && curated.length) {
        const unique = [...new Set(curated.filter(Boolean))];
        if (unique.length >= 3) return unique;
        const extras = AIRPORT_GALLERY_EXTRAS.filter((url) => !unique.includes(url));
        return unique.concat(extras.slice(0, 3 - unique.length));
    }
    return [AIRPORT_IMAGE_FALLBACK, ...AIRPORT_GALLERY_EXTRAS.slice(0, 2)];
}

function getAirportImageUrls(iata) {
    const code = (iata || '').toUpperCase();
    if (_airportPhotosCache[code]?.length) return _airportPhotosCache[code];
    return getCuratedAirportImageUrls(code);
}

async function loadAirportPhotos(iata, name, city) {
    const code = (iata || '').toUpperCase();
    if (_airportPhotosCache[code]) {
        return { urls: _airportPhotosCache[code], meta: _airportPhotoMeta[code] || {} };
    }

    try {
        const data = await API.getAirportPhotos(code, name || '', city || '');
        const apiUrls = (data.photos || []).map((p) => p.url).filter(Boolean);
        const urls = mergeAirportPhotoUrls(apiUrls, code);
        _airportPhotosCache[code] = urls;
        _airportPhotoMeta[code] = {
            source: data.source || 'wikimedia-commons',
            apiUrl: data.apiUrl || WIKIMEDIA_COMMONS_API_URL,
            categoryUrl: data.categoryUrl || WIKIMEDIA_AIRPORTS_CATEGORY,
            live: Boolean(data.live),
        };
        return { urls, meta: _airportPhotoMeta[code] };
    } catch (err) {
        const urls = getCuratedAirportImageUrls(code);
        _airportPhotosCache[code] = urls;
        _airportPhotoMeta[code] = { source: 'curated-fallback', live: false, error: err.message };
        return { urls, meta: _airportPhotoMeta[code] };
    }
}
function getAirportImageUrl(iata) {
    return getAirportImageUrls(iata)[0] || AIRPORT_IMAGE_FALLBACK;
}

function airportImageHtml(iata, alt, className = 'airport-photo') {
    const src = getAirportImageUrl(iata);
    const safeAlt = String(alt || iata || 'Airport').replace(/"/g, '&quot;');
    return `<img class="${className}" src="${src}" alt="${safeAlt}" loading="lazy" onerror="this.onerror=null;this.src='${AIRPORT_IMAGE_FALLBACK}'">`;
}

function airportHeroGalleryHtml(iata, alt, urls = null) {
    const resolved = urls || getAirportImageUrls(iata);
    const safeAlt = String(alt || iata || 'Airport').replace(/"/g, '&quot;');
    const heroSrc = resolved[0] || AIRPORT_IMAGE_FALLBACK;
    const thumbs = resolved.slice(0, 4).map((src, idx) =>
        `<img class="airport-hero-thumb${idx === 0 ? ' active' : ''}" src="${src}" alt="${safeAlt} photo ${idx + 1}" loading="lazy" onerror="this.onerror=null;this.src='${AIRPORT_IMAGE_FALLBACK}'">`
    ).join('');

    return `
        <div class="airport-photo-block" data-airport-iata="${(iata || '').toUpperCase()}">
            <button type="button" class="airport-hero-wrap" data-gallery-iata="${(iata || '').toUpperCase()}" aria-label="View ${resolved.length} airport photos">
                <img class="airport-detail-hero" src="${heroSrc}" alt="${safeAlt}" loading="lazy" onerror="this.onerror=null;this.src='${AIRPORT_IMAGE_FALLBACK}'">
                <span class="photo-count-badge"><i class="fa-solid fa-images"></i> <span class="photo-count-text">${resolved.length} Photos</span></span>
            </button>
            <div class="airport-photo-toolbar">
                <button type="button" class="service-btn secondary view-photos-btn" data-gallery-iata="${(iata || '').toUpperCase()}">
                    <i class="fa-solid fa-camera"></i> View all photos
                </button>
                <span class="airport-photo-source" id="airportPhotoSource"></span>
            </div>
            <div class="airport-thumb-strip">${thumbs}</div>
        </div>
    `;
}

function refreshAirportPhotoBlock(block, iata, alt, urls, meta = {}) {
    if (!block || !urls?.length) return;

    const code = (iata || '').toUpperCase();
    _airportPhotosCache[code] = urls;

    const hero = block.querySelector('.airport-detail-hero');
    if (hero) hero.src = urls[0];

    const countText = block.querySelector('.photo-count-text');
    if (countText) countText.textContent = `${urls.length} Photos`;

    const strip = block.querySelector('.airport-thumb-strip');
    if (strip) {
        const safeAlt = String(alt || iata || 'Airport').replace(/"/g, '&quot;');
        strip.innerHTML = urls.slice(0, 4).map((src, idx) =>
            `<img class="airport-hero-thumb${idx === 0 ? ' active' : ''}" src="${src}" alt="${safeAlt} photo ${idx + 1}" loading="lazy" onerror="this.onerror=null;this.src='${AIRPORT_IMAGE_FALLBACK}'">`
        ).join('');
    }

    const sourceEl = block.querySelector('#airportPhotoSource') || block.querySelector('.airport-photo-source');
    if (sourceEl && meta.live) {
        const link = meta.categoryUrl || WIKIMEDIA_AIRPORTS_CATEGORY;
        sourceEl.innerHTML = `<a href="${link}" target="_blank" rel="noopener">Wikimedia Commons</a>`;
    } else if (sourceEl && meta.source === 'curated-fallback') {
        sourceEl.textContent = 'Curated photos';
    }
}
let galleryModalEl = null;
let galleryState = { urls: [], index: 0, title: '' };

function ensureGalleryModal() {
    if (galleryModalEl) return galleryModalEl;

    galleryModalEl = document.createElement('div');
    galleryModalEl.id = 'airportPhotoGallery';
    galleryModalEl.className = 'airport-gallery-modal';
    galleryModalEl.hidden = true;
    galleryModalEl.innerHTML = `
        <div class="airport-gallery-backdrop" data-gallery-close></div>
        <div class="airport-gallery-dialog" role="dialog" aria-modal="true" aria-label="Airport photo gallery">
            <div class="airport-gallery-header">
                <div>
                    <h4 id="airportGalleryTitle">Airport photos</h4>
                    <span class="airport-gallery-counter" id="airportGalleryCounter">1 / 1</span>
                </div>
                <button type="button" class="airport-gallery-close" data-gallery-close aria-label="Close gallery">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="airport-gallery-main">
                <button type="button" class="airport-gallery-nav prev" data-gallery-prev aria-label="Previous photo">
                    <i class="fa-solid fa-chevron-left"></i>
                </button>
                <img id="airportGalleryMain" class="airport-gallery-image" src="" alt="">
                <button type="button" class="airport-gallery-nav next" data-gallery-next aria-label="Next photo">
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
            </div>
            <div class="airport-gallery-thumbs" id="airportGalleryThumbs"></div>
        </div>
    `;
    document.body.appendChild(galleryModalEl);

    galleryModalEl.querySelectorAll('[data-gallery-close]').forEach((el) => {
        el.addEventListener('click', closeAirportPhotoGallery);
    });
    galleryModalEl.querySelector('[data-gallery-prev]')?.addEventListener('click', () => stepAirportGallery(-1));
    galleryModalEl.querySelector('[data-gallery-next]')?.addEventListener('click', () => stepAirportGallery(1));

    document.addEventListener('keydown', (e) => {
        if (galleryModalEl.hidden) return;
        if (e.key === 'Escape') closeAirportPhotoGallery();
        if (e.key === 'ArrowLeft') stepAirportGallery(-1);
        if (e.key === 'ArrowRight') stepAirportGallery(1);
    });

    return galleryModalEl;
}

function renderGallerySlide() {
    const modal = ensureGalleryModal();
    const { urls, index, title } = galleryState;
    const main = modal.querySelector('#airportGalleryMain');
    const counter = modal.querySelector('#airportGalleryCounter');
    const titleEl = modal.querySelector('#airportGalleryTitle');
    const thumbsHost = modal.querySelector('#airportGalleryThumbs');

    if (!main || !urls.length) return;

    const src = urls[index];
    main.src = src;
    main.alt = `${title} — photo ${index + 1}`;
    main.onerror = () => { main.onerror = null; main.src = AIRPORT_IMAGE_FALLBACK; };
    counter.textContent = `${index + 1} / ${urls.length}`;
    titleEl.textContent = title;

    thumbsHost.innerHTML = urls.map((url, idx) =>
        `<button type="button" class="airport-gallery-thumb${idx === index ? ' active' : ''}" data-gallery-index="${idx}" aria-label="Photo ${idx + 1}">
            <img src="${url}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${AIRPORT_IMAGE_FALLBACK}'">
        </button>`
    ).join('');

    thumbsHost.querySelectorAll('[data-gallery-index]').forEach((btn) => {
        btn.addEventListener('click', () => {
            galleryState.index = Number(btn.dataset.galleryIndex);
            renderGallerySlide();
        });
    });
}

function stepAirportGallery(delta) {
    const total = galleryState.urls.length;
    if (!total) return;
    galleryState.index = (galleryState.index + delta + total) % total;
    renderGallerySlide();
}

function openAirportPhotoGallery(iata, airportName, startIndex = 0) {
    const code = (iata || '').toUpperCase();
    const urls = _airportPhotosCache[code] || getAirportImageUrls(code);
    galleryState = {
        urls,
        index: Math.max(0, Math.min(startIndex, urls.length - 1)),
        title: airportName || code || 'Airport',
    };
    const modal = ensureGalleryModal();
    modal.hidden = false;
    document.body.classList.add('airport-gallery-open');
    renderGallerySlide();
}

function closeAirportPhotoGallery() {
    if (!galleryModalEl) return;
    galleryModalEl.hidden = true;
    document.body.classList.remove('airport-gallery-open');
}

function bindAirportGalleryTriggers(container, airportName) {
    if (!container) return;

    container.dataset.galleryName = airportName;
    if (container.dataset.galleryBound === '1') return;

    container.dataset.galleryBound = '1';
    container.addEventListener('click', (e) => {
        const name = container.dataset.galleryName || 'Airport';
        const thumb = e.target.closest('.airport-hero-thumb');
        if (thumb) {
            e.stopPropagation();
            const idx = [...container.querySelectorAll('.airport-hero-thumb')].indexOf(thumb);
            const iata = container.querySelector('[data-gallery-iata]')?.dataset.galleryIata;
            if (iata) openAirportPhotoGallery(iata, name, Math.max(0, idx));
            return;
        }
        const trigger = e.target.closest('[data-gallery-iata]');
        if (trigger) openAirportPhotoGallery(trigger.dataset.galleryIata, name, 0);
    });
}