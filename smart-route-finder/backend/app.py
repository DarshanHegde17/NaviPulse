from flask import Flask, jsonify
from flask_cors import CORS
from config.config import Config
from models.database import db
from routes import auth_bp, route_bp, history_bp, saved_bp

def create_app():
    """Application factory"""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(Config)
    
    # Enable CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": Config.CORS_ORIGINS,
            "methods": ["GET", "POST", "PUT", "DELETE"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Validate configuration
    try:
        Config.validate_config()
    except ValueError as e:
        print(f"Configuration Error: {str(e)}")
        print("Please set GOOGLE_MAPS_API_KEY in .env file")
    
    # Initialize database
    try:
        db.connect()
    except Exception as e:
        print(f"Database initialization failed: {str(e)}")
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(route_bp)
    app.register_blueprint(history_bp)
    app.register_blueprint(saved_bp)
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'Smart Route Finder API',
            'version': '1.0.0'
        }), 200
    
    # Root endpoint
    @app.route('/', methods=['GET'])
    def root():
        return jsonify({
            'message': 'Smart Route Finder API',
            'version': '1.0.0',
            'endpoints': {
                'auth': '/api/auth',
                'routes': '/api/routes',
                'history': '/api/history',
                'saved': '/api/saved'
            }
        }), 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Endpoint not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    print(f"\n{'='*50}")
    print(f"🚀 Smart Route Finder API Server")
    print(f"{'='*50}")
    print(f"Environment: {Config.FLASK_ENV}")
    print(f"Port: {Config.PORT}")
    print(f"Debug: {Config.DEBUG}")
    print(f"{'='*50}\n")
    
    app.run(
        host='0.0.0.0',
        port=Config.PORT,
        debug=Config.DEBUG
    )
