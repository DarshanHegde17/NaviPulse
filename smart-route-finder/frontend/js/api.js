// API Helper Functions

class API {
    static async request(endpoint, options = {}) {
        const url = `${API_CONFIG.BASE_URL}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        if (token) {
            defaultOptions.headers['Authorization'] = `Bearer ${token}`;
        }
        
        const config = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
    // Auth APIs
    static async register(username, email, password) {
        return this.request(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
    }
    
    static async login(email, password) {
        return this.request(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }
    
    static async getUser(userId) {
        return this.request(`${API_CONFIG.ENDPOINTS.AUTH.USER}/${userId}`);
    }

    static async updateUser(userId, username, email) {
        return this.request(`${API_CONFIG.ENDPOINTS.AUTH.USER}/${userId}`, {
            method: 'PUT',
            body: JSON.stringify({ username, email })
        });
    }

    static async updatePreferences(userId, preferences) {
        return this.request(`${API_CONFIG.ENDPOINTS.AUTH.PREFERENCES}/${userId}`, {
            method: 'PUT',
            body: JSON.stringify({ preferences })
        });
    }
    
    // Route APIs
    static async searchRoutes(origin, destination, travelMode, userId = null) {
        return this.request(API_CONFIG.ENDPOINTS.ROUTES.SEARCH, {
            method: 'POST',
            body: JSON.stringify({
                origin,
                destination,
                travel_mode: travelMode,
                user_id: userId
            })
        });
    }
    
    static async compareRoutes(routeIndices, routes) {
        return this.request(API_CONFIG.ENDPOINTS.ROUTES.COMPARE, {
            method: 'POST',
            body: JSON.stringify({
                route_indices: routeIndices,
                routes: routes
            })
        });
    }
    
    static async optimizeRoute(routes, type = 'both') {
        return this.request(API_CONFIG.ENDPOINTS.ROUTES.OPTIMIZE, {
            method: 'POST',
            body: JSON.stringify({ routes, type })
        });
    }

    static async getAirportFlights(iata, type = 'both') {
        const qs = new URLSearchParams({ iata, type });
        return this.request(`${API_CONFIG.ENDPOINTS.ROUTES.AIRPORT_FLIGHTS}?${qs}`);
    }

    static async getLiveFlights({ lamin, lomin, lamax, lomax } = {}) {
        const qs = new URLSearchParams();
        if (lamin != null) qs.set('lamin', String(lamin));
        if (lomin != null) qs.set('lomin', String(lomin));
        if (lamax != null) qs.set('lamax', String(lamax));
        if (lomax != null) qs.set('lomax', String(lomax));
        return this.request(`${API_CONFIG.ENDPOINTS.ROUTES.FLIGHTS_LIVE}?${qs}`);
    }

    static async getLiveTrains(hubs = '') {
        const qs = new URLSearchParams();
        if (hubs) qs.set('hubs', hubs);
        return this.request(`${API_CONFIG.ENDPOINTS.ROUTES.TRAINS_LIVE}?${qs}`);
    }

    static async trackTrain(number, date = '') {
        const qs = new URLSearchParams({ number: String(number) });
        if (date) qs.set('date', date);
        return this.request(`${API_CONFIG.ENDPOINTS.ROUTES.TRAINS_TRACK}?${qs}`);
    }

    static async getAirportPhotos(iata, name = '', city = '') {
        const qs = new URLSearchParams({ iata, name, city });
        return this.request(`${API_CONFIG.ENDPOINTS.ROUTES.AIRPORT_PHOTOS}?${qs}`);
    }

    static async getRailwayStationTrains(code, hours = 2) {
        const qs = new URLSearchParams({ code, hours: String(hours) });
        return this.request(`${API_CONFIG.ENDPOINTS.ROUTES.RAILWAY_STATION}?${qs}`);
    }

    static async getRailwayPhotos(code, name = '', city = '') {
        const qs = new URLSearchParams({ code, name, city });
        return this.request(`${API_CONFIG.ENDPOINTS.ROUTES.RAILWAY_PHOTOS}?${qs}`);
    }

    static async getRailwayStates() {
        return this.request(API_CONFIG.ENDPOINTS.ROUTES.RAILWAY_STATES);
    }

    static async getRailwayStations({ state = '', q = '', limit = 80, offset = 0 } = {}) {
        const qs = new URLSearchParams();
        if (state) qs.set('state', state);
        if (q) qs.set('q', q);
        qs.set('limit', String(limit));
        qs.set('offset', String(offset));
        return this.request(`${API_CONFIG.ENDPOINTS.ROUTES.RAILWAY_STATIONS}?${qs}`);
    }

    static async getRailwayStationDetail(code) {
        return this.request(`${API_CONFIG.ENDPOINTS.ROUTES.RAILWAY_STATIONS}/${encodeURIComponent(code)}`);
    }
    
    // History APIs
    static async getHistory(userId, limit = 20) {
        return this.request(`${API_CONFIG.ENDPOINTS.HISTORY.GET}/${userId}?limit=${limit}`);
    }
    
    static async deleteHistory(userId, historyId) {
        return this.request(`${API_CONFIG.ENDPOINTS.HISTORY.DELETE}/${userId}/${historyId}`, {
            method: 'DELETE'
        });
    }
    
    static async clearHistory(userId) {
        return this.request(`${API_CONFIG.ENDPOINTS.HISTORY.CLEAR}/${userId}/clear`, {
            method: 'DELETE'
        });
    }
    
    // Saved Routes APIs
    static async getSavedRoutes(userId) {
        return this.request(`${API_CONFIG.ENDPOINTS.SAVED.GET}/${userId}`);
    }
    
    static async saveRoute(routeData) {
        return this.request(API_CONFIG.ENDPOINTS.SAVED.CREATE, {
            method: 'POST',
            body: JSON.stringify(routeData)
        });
    }
    
    static async deleteSavedRoute(userId, routeId) {
        return this.request(`${API_CONFIG.ENDPOINTS.SAVED.DELETE}/${userId}/${routeId}`, {
            method: 'DELETE'
        });
    }
}

// Utility Functions
function getCurrentUser() {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
}

function setCurrentUser(user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

function setAuthToken(token) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
}

function clearAuth() {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
}

function isAuthenticated() {
    return !!localStorage.getItem(STORAGE_KEYS.TOKEN);
}

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
        return `${hours} hr ${minutes} min`;
    }
    return `${minutes} min`;
}

function formatDistance(meters) {
    const km = meters / 1000;
    return `${km.toFixed(2)} km`;
}

function showMessage(elementId, message, type = 'success') {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.className = `message ${type}`;
        element.style.display = 'block';
        
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}
