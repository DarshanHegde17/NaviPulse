// History Page JavaScript

let currentTab = 'search-history';

// Load History on Page Load
document.addEventListener('DOMContentLoaded', () => {
    loadSearchHistory();
    loadSavedRoutes();

    if (window.location.hash === '#saved-routes') {
        showTab('saved-routes', document.querySelector('[data-tab="saved-routes"]'));
    }
});

function showTab(tabName, btnEl) {
    currentTab = tabName;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    if (btnEl) {
        btnEl.classList.add('active');
    } else {
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
    }
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName)?.classList.add('active');
}

function escapeHtml(text) {
    const el = document.createElement('span');
    el.textContent = text || '';
    return el.innerHTML;
}

function trafficClass(status) {
    return `traffic-${(status || 'low').toLowerCase()}`;
}

function formatTravelMode(mode) {
    const labels = { driving: 'Car', walking: 'Walking', bicycling: 'Bike', transit: 'Transit' };
    return labels[mode] || mode || 'Car';
}

// Load Search History
async function loadSearchHistory() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    const historyList = document.getElementById('historyList');
    
    try {
        const response = await API.getHistory(user.id);
        
        if (response.history.length === 0) {
            historyList.innerHTML = '<div class="empty-state">No search history found</div>';
            return;
        }
        
        historyList.innerHTML = '';
        
        response.history.forEach(item => {
            const historyItem = createHistoryItem(item);
            historyList.appendChild(historyItem);
        });
        
    } catch (error) {
        historyList.innerHTML = '<div class="error-state">Error loading history</div>';
        console.error('Error loading history:', error);
    }
}

// Load Saved Routes
async function loadSavedRoutes() {
    const user = getCurrentUser();
    if (!user) return;
    
    const savedList = document.getElementById('savedList');
    
    try {
        const response = await API.getSavedRoutes(user.id);
        
        if (response.routes.length === 0) {
            savedList.innerHTML = '<div class="empty-state">No saved routes found</div>';
            return;
        }
        
        savedList.innerHTML = '';
        
        response.routes.forEach(item => {
            const savedItem = createSavedItem(item);
            savedList.appendChild(savedItem);
        });
        
    } catch (error) {
        savedList.innerHTML = '<div class="error-state">Error loading saved routes</div>';
        console.error('Error loading saved routes:', error);
    }
}

// Create History Item
function createHistoryItem(item) {
    const div = document.createElement('div');
    div.className = 'history-item';
    
    const date = new Date(item.created_at);
    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    
    div.innerHTML = `
        <div class="history-info">
            <h3>
                <i class="fas fa-map-marker-alt"></i> ${escapeHtml(item.source)}
                <i class="fas fa-arrow-right arrow"></i>
                ${escapeHtml(item.destination)}
            </h3>
            <div class="history-meta">
                <span><i class="fas fa-car"></i> ${formatTravelMode(item.travel_mode)}</span>
                <span><i class="fas fa-road"></i> ${formatDistance(item.distance)}</span>
                <span><i class="fas fa-clock"></i> ${formatDuration(item.duration)}</span>
                <span class="${trafficClass(item.traffic_status)}"><i class="fas fa-traffic-light"></i> ${escapeHtml(item.traffic_status || '—')}</span>
                <span><i class="fas fa-calendar"></i> ${formattedDate}</span>
            </div>
        </div>
        <div class="history-actions">
            <button class="btn-icon btn-repeat" title="Repeat Search"><i class="fas fa-redo"></i></button>
            <button class="btn-icon btn-delete" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
    `;

    div.querySelector('.btn-repeat').addEventListener('click', (e) => {
        e.stopPropagation();
        repeatSearch(item.source, item.destination, item.travel_mode || 'driving');
    });
    div.querySelector('.btn-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteHistoryItem(item._id);
    });
    div.addEventListener('click', () => repeatSearch(item.source, item.destination, item.travel_mode || 'driving'));

    return div;
}

// Create Saved Item
function createSavedItem(item) {
    const div = document.createElement('div');
    div.className = 'history-item';
    
    const date = new Date(item.last_used);
    const formattedDate = date.toLocaleDateString();
    
    div.innerHTML = `
        <div class="history-info">
            <h3><i class="fas fa-star" style="color:#ff6a00"></i> ${escapeHtml(item.route_name || 'Saved Route')}</h3>
            <p style="color:#aaa;margin:0.5rem 0;font-size:14px;">
                ${escapeHtml(item.source)} <span style="color:#ff6a00">→</span> ${escapeHtml(item.destination)}
            </p>
            <div class="history-meta">
                <span><i class="fas fa-road"></i> ${formatDistance(item.distance)}</span>
                <span><i class="fas fa-clock"></i> ${formatDuration(item.duration)}</span>
                ${item.traffic_status ? `<span class="${trafficClass(item.traffic_status)}"><i class="fas fa-traffic-light"></i> ${escapeHtml(item.traffic_status)}</span>` : ''}
                <span><i class="fas fa-calendar"></i> Last used: ${formattedDate}</span>
            </div>
            ${item.via_summary ? `<p style="color:#888;font-size:12px;margin-top:8px;"><i class="fas fa-route"></i> ${escapeHtml(item.via_summary)}</p>` : ''}
        </div>
        <div class="history-actions">
            <button class="btn-icon btn-use" title="Use Route"><i class="fas fa-play"></i></button>
            <button class="btn-icon btn-delete-saved" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
    `;

    div.querySelector('.btn-use').addEventListener('click', (e) => {
        e.stopPropagation();
        useRoute(item.source, item.destination, item.travel_mode || 'driving');
    });
    div.querySelector('.btn-delete-saved').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteSavedRoute(item._id);
    });

    return div;
}

// Repeat Search
function repeatSearch(source, destination, travelMode) {
    sessionStorage.setItem('searchParams', JSON.stringify({
        source,
        destination,
        travelMode
    }));
    window.location.href = 'dashboard.html';
}

// Use Route
function useRoute(source, destination, travelMode) {
    repeatSearch(source, destination, travelMode);
}

// Delete History Item
async function deleteHistoryItem(historyId) {
    if (!confirm('Delete this history entry?')) return;
    
    const user = getCurrentUser();
    if (!user) return;
    
    try {
        await API.deleteHistory(user.id, historyId);
        loadSearchHistory();
    } catch (error) {
        alert('Error deleting history: ' + error.message);
    }
}

// Delete Saved Route
async function deleteSavedRoute(routeId) {
    if (!confirm('Delete this saved route?')) return;
    
    const user = getCurrentUser();
    if (!user) return;
    
    try {
        await API.deleteSavedRoute(user.id, routeId);
        loadSavedRoutes();
    } catch (error) {
        alert('Error deleting route: ' + error.message);
    }
}

// Clear All History
async function clearHistory() {
    if (!confirm('Are you sure you want to clear all history? This cannot be undone.')) return;
    
    const user = getCurrentUser();
    if (!user) return;
    
    try {
        await API.clearHistory(user.id);
        loadSearchHistory();
        alert('History cleared successfully');
    } catch (error) {
        alert('Error clearing history: ' + error.message);
    }
}

