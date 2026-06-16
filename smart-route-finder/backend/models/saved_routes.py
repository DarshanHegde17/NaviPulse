from datetime import datetime
from bson import ObjectId
from models.database import db

class SavedRoutes:
    """Saved Routes Model"""
    
    collection = db.get_db().saved_routes
    
    @staticmethod
    def _build_document(route_data: dict) -> dict:
        return {
            'user_id': route_data.get('user_id'),
            'route_name': route_data.get('route_name'),
            'route_index': route_data.get('route_index', 0),
            'source': route_data.get('source'),
            'destination': route_data.get('destination'),
            'source_coords': route_data.get('source_coords'),
            'destination_coords': route_data.get('destination_coords'),
            'distance': route_data.get('distance'),
            'duration': route_data.get('duration'),
            'travel_mode': route_data.get('travel_mode', 'driving'),
            'traffic_status': route_data.get('traffic_status', ''),
            'delay_time': route_data.get('delay_time', 0),
            'via_summary': route_data.get('via_summary', ''),
            'notes': route_data.get('notes', ''),
            'auto_saved': route_data.get('auto_saved', False),
            'last_used': datetime.utcnow(),
        }

    @staticmethod
    def create(route_data):
        """Save a new favorite route"""
        saved_route = SavedRoutes._build_document(route_data)
        saved_route['created_at'] = datetime.utcnow()

        try:
            result = SavedRoutes.collection.insert_one(saved_route)
            saved_route['_id'] = result.inserted_id
            return saved_route
        except Exception as e:
            raise Exception(f"Error saving route: {str(e)}")

    @staticmethod
    def save_or_update(route_data):
        """Update existing saved route for same trip + route index, or create new."""
        user_id = route_data.get('user_id')
        source = route_data.get('source')
        destination = route_data.get('destination')
        route_index = route_data.get('route_index', 0)

        if not all([user_id, source, destination]):
            raise ValueError('user_id, source, and destination are required')

        doc = SavedRoutes._build_document(route_data)
        query = {
            'user_id': user_id,
            'source': source,
            'destination': destination,
            'route_index': route_index,
        }

        try:
            existing = SavedRoutes.collection.find_one(query)
            if existing:
                SavedRoutes.collection.update_one(
                    {'_id': existing['_id']},
                    {'$set': doc},
                )
                doc['_id'] = existing['_id']
                doc['created_at'] = existing.get('created_at', datetime.utcnow())
                return doc

            doc['created_at'] = datetime.utcnow()
            result = SavedRoutes.collection.insert_one(doc)
            doc['_id'] = result.inserted_id
            return doc
        except Exception as e:
            raise Exception(f"Error saving route: {str(e)}")
    
    @staticmethod
    def get_user_routes(user_id):
        """Get user's saved routes"""
        try:
            routes = list(SavedRoutes.collection.find(
                {'user_id': user_id}
            ).sort('last_used', -1))
            
            # Convert ObjectId to string
            for route in routes:
                route['_id'] = str(route['_id'])
            
            return routes
        except Exception as e:
            raise Exception(f"Error fetching saved routes: {str(e)}")
    
    @staticmethod
    def update_last_used(route_id, user_id):
        """Update last used timestamp"""
        try:
            result = SavedRoutes.collection.update_one(
                {'_id': ObjectId(route_id), 'user_id': user_id},
                {'$set': {'last_used': datetime.utcnow()}}
            )
            return result.modified_count > 0
        except Exception as e:
            raise Exception(f"Error updating route: {str(e)}")
    
    @staticmethod
    def delete_route(route_id, user_id):
        """Delete a saved route"""
        try:
            result = SavedRoutes.collection.delete_one({
                '_id': ObjectId(route_id),
                'user_id': user_id
            })
            return result.deleted_count > 0
        except Exception as e:
            raise Exception(f"Error deleting route: {str(e)}")
