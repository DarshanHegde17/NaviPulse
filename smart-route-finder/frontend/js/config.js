// API Configuration
const API_CONFIG = {
    BASE_URL: 'http://localhost:5000/api',
    GOOGLE_MAPS_API_KEY: 'YOUR_GOOGLE_MAPS_API_KEY', // Replace with your actual API key
    TOMTOM_TRAFFIC_API_KEY: 'osKebqnsXwEsOUAZgyy7nBixA6swZo7Y', // Add key for live traffic layer
    ENDPOINTS: {
        AUTH: {
            REGISTER: '/auth/register',
            LOGIN: '/auth/login',
            USER: '/auth/user',
            PREFERENCES: '/auth/preferences'
        },
        ROUTES: {
            SEARCH: '/routes/search',
            COMPARE: '/routes/compare',
            OPTIMIZE: '/routes/optimize',
            TRAFFIC: '/routes/traffic',
            TRAFFIC_INCIDENTS: '/routes/traffic/incidents',
            PLACES_NEARBY: '/routes/places/nearby',
            AIRPORT_FLIGHTS: '/routes/airport/flights',
            AIRPORT_PHOTOS: '/routes/airport/photos',
            RAILWAY_STATION: '/routes/railway/station',
            RAILWAY_PHOTOS: '/routes/railway/photos',
            RAILWAY_STATIONS: '/routes/railway/stations',
            RAILWAY_STATES: '/routes/railway/stations/states',
        },
        HISTORY: {
            GET: '/history',
            DELETE: '/history',
            CLEAR: '/history'
        },
        SAVED: {
            GET: '/saved',
            CREATE: '/saved',
            DELETE: '/saved',
            UPDATE: '/saved'
        }
    }
};

// Local Storage Keys
const STORAGE_KEYS = {
    USER: 'smart_route_user',
    TOKEN: 'smart_route_token',
    PREFERENCES: 'smart_route_preferences'
};

// Travel Mode Icons
const TRAVEL_MODE_ICONS = {
    driving: '🚗',
    walking: '🚶',
    bicycling: '🚴',
    transit: '🚌'
};

// Traffic Status Colors
const TRAFFIC_COLORS = {
    Low: '#10b981',
    Medium: '#f59e0b',
    Heavy: '#ef4444'
};
