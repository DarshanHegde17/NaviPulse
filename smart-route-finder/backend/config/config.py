import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Application configuration class"""
    
    # Flask Configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    DEBUG = FLASK_ENV == 'development'
    PORT = int(os.getenv('PORT', 5000))
    
    # MongoDB Configuration
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
    DATABASE_NAME = os.getenv('DATABASE_NAME', 'smart_route_finder')
    
    # Google Maps API Configuration
    GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY', '')

    # TomTom Traffic (incidents + flow tiles; set in .env for backend proxy)
    TOMTOM_TRAFFIC_API_KEY = os.getenv('TOMTOM_TRAFFIC_API_KEY', '')

    # Aviationstack — live airport flights (https://aviationstack.com)
    AVIATIONSTACK_API_KEY = os.getenv('AVIATIONSTACK_API_KEY', '')

    # Indian Rail API — live station trains (https://indianrailapi.com)
    INDIAN_RAIL_API_KEY = os.getenv('INDIAN_RAIL_API_KEY', '')

    # IRCTC Connect — alternative railway API (https://irctc.rajivdubey.tech, free tier)
    IRCTC_CONNECT_API_KEY = os.getenv('IRCTC_CONNECT_API_KEY', '')
    
    # API Endpoints
    GOOGLE_DIRECTIONS_API = 'https://maps.googleapis.com/maps/api/directions/json'
    GOOGLE_GEOCODING_API = 'https://maps.googleapis.com/maps/api/geocode/json'
    GOOGLE_ROUTES_API = 'https://routes.googleapis.com/directions/v2:computeRoutes'
    
    # Application Settings
    MAX_ROUTES = 5
    DEFAULT_TRAVEL_MODE = 'DRIVE'
    
    # CORS Settings
    CORS_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:5500']
    
    @staticmethod
    def validate_config():
        """Validate required configuration"""
        if not Config.GOOGLE_MAPS_API_KEY:
            raise ValueError("GOOGLE_MAPS_API_KEY is required")
        return True
