from datetime import datetime
from bson import ObjectId
from models.database import db

class RouteHistory:
    """Route History Model"""
    
    collection = db.get_db().route_history
    
    @staticmethod
    def create(route_data):
        """Save route search to history"""
        history_entry = {
            'user_id': route_data.get('user_id'),
            'source': route_data.get('source'),
            'destination': route_data.get('destination'),
            'source_coords': route_data.get('source_coords'),
            'destination_coords': route_data.get('destination_coords'),
            'route_name': route_data.get('route_name'),
            'distance': route_data.get('distance'),
            'duration': route_data.get('duration'),
            'traffic_status': route_data.get('traffic_status'),
            'delay_time': route_data.get('delay_time', 0),
            'travel_mode': route_data.get('travel_mode', 'DRIVE'),
            'route_type': route_data.get('route_type'),  # fastest, shortest
            'created_at': datetime.utcnow()
        }
        
        try:
            result = RouteHistory.collection.insert_one(history_entry)
            history_entry['_id'] = result.inserted_id
            return history_entry
        except Exception as e:
            raise Exception(f"Error saving route history: {str(e)}")
    
    @staticmethod
    def get_user_history(user_id, limit=20):
        """Get user's route search history"""
        try:
            history = list(RouteHistory.collection.find(
                {'user_id': user_id}
            ).sort('created_at', -1).limit(limit))
            
            # Convert ObjectId to string
            for entry in history:
                entry['_id'] = str(entry['_id'])
            
            return history
        except Exception as e:
            raise Exception(f"Error fetching history: {str(e)}")
    
    @staticmethod
    def delete_history(history_id, user_id):
        """Delete a history entry"""
        try:
            result = RouteHistory.collection.delete_one({
                '_id': ObjectId(history_id),
                'user_id': user_id
            })
            return result.deleted_count > 0
        except Exception as e:
            raise Exception(f"Error deleting history: {str(e)}")
    
    @staticmethod
    def clear_user_history(user_id):
        """Clear all history for a user"""
        try:
            result = RouteHistory.collection.delete_many({'user_id': user_id})
            return result.deleted_count
        except Exception as e:
            raise Exception(f"Error clearing history: {str(e)}")
