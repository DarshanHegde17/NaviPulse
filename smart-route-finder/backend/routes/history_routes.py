from flask import Blueprint, request, jsonify
from models.route_history import RouteHistory

history_bp = Blueprint('history', __name__, url_prefix='/api/history')

@history_bp.route('/<user_id>', methods=['GET'])
def get_history(user_id):
    """Get user's route search history"""
    try:
        limit = request.args.get('limit', 20, type=int)
        
        history = RouteHistory.get_user_history(user_id, limit)
        
        return jsonify({
            'history': history,
            'total': len(history)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@history_bp.route('/<user_id>/<history_id>', methods=['DELETE'])
def delete_history_entry(user_id, history_id):
    """Delete a specific history entry"""
    try:
        success = RouteHistory.delete_history(history_id, user_id)
        
        if success:
            return jsonify({'message': 'History entry deleted'}), 200
        else:
            return jsonify({'error': 'Entry not found or unauthorized'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@history_bp.route('/<user_id>/clear', methods=['DELETE'])
def clear_history(user_id):
    """Clear all history for a user"""
    try:
        count = RouteHistory.clear_user_history(user_id)
        
        return jsonify({
            'message': f'Cleared {count} history entries',
            'count': count
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
