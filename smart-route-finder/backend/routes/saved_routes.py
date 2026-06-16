from flask import Blueprint, request, jsonify
from models.saved_routes import SavedRoutes

saved_bp = Blueprint('saved', __name__, url_prefix='/api/saved')

@saved_bp.route('/', methods=['POST'])
def save_route():
    """Save a favorite route"""
    try:
        data = request.get_json()
        
        required_fields = ['user_id', 'source', 'destination']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        saved_route = SavedRoutes.save_or_update(data)

        return jsonify({
            'message': 'Route saved successfully',
            'route': {
                'id': str(saved_route['_id']),
                'route_name': saved_route['route_name'],
                'source': saved_route['source'],
                'destination': saved_route['destination'],
                'route_index': saved_route.get('route_index', 0),
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@saved_bp.route('/<user_id>', methods=['GET'])
def get_saved_routes(user_id):
    """Get user's saved routes"""
    try:
        routes = SavedRoutes.get_user_routes(user_id)
        
        return jsonify({
            'routes': routes,
            'total': len(routes)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@saved_bp.route('/<user_id>/<route_id>', methods=['PUT'])
def update_last_used(user_id, route_id):
    """Update last used timestamp"""
    try:
        success = SavedRoutes.update_last_used(route_id, user_id)
        
        if success:
            return jsonify({'message': 'Route updated'}), 200
        else:
            return jsonify({'error': 'Route not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@saved_bp.route('/<user_id>/<route_id>', methods=['DELETE'])
def delete_saved_route(user_id, route_id):
    """Delete a saved route"""
    try:
        success = SavedRoutes.delete_route(route_id, user_id)
        
        if success:
            return jsonify({'message': 'Route deleted'}), 200
        else:
            return jsonify({'error': 'Route not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500
