from datetime import datetime
from bson import ObjectId
from models.database import db

class User:
    """User Model"""
    
    collection = db.get_db().users
    
    @staticmethod
    def create(username, email, password_hash):
        """Create a new user"""
        user_data = {
            'username': username,
            'email': email,
            'password': password_hash,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'preferences': {
                'default_travel_mode': 'DRIVE',
                'avoid_tolls': False,
                'avoid_highways': False
            }
        }
        
        try:
            result = User.collection.insert_one(user_data)
            user_data['_id'] = result.inserted_id
            return user_data
        except Exception as e:
            raise Exception(f"Error creating user: {str(e)}")
    
    @staticmethod
    def find_by_email(email):
        """Find user by email"""
        return User.collection.find_one({'email': email})
    
    @staticmethod
    def find_by_id(user_id):
        """Find user by ID"""
        try:
            return User.collection.find_one({'_id': ObjectId(user_id)})
        except:
            return None
    
    @staticmethod
    def update_preferences(user_id, preferences):
        """Update user preferences"""
        try:
            result = User.collection.update_one(
                {'_id': ObjectId(user_id)},
                {
                    '$set': {
                        'preferences': preferences,
                        'updated_at': datetime.utcnow()
                    }
                }
            )
            return result.modified_count > 0
        except Exception as e:
            raise Exception(f"Error updating preferences: {str(e)}")

    @staticmethod
    def update_profile(user_id, updates):
        """Update user profile fields"""
        allowed_fields = ['username', 'email']
        payload = {k: v for k, v in updates.items() if k in allowed_fields and v is not None}

        if not payload:
            return False

        try:
            payload['updated_at'] = datetime.utcnow()
            result = User.collection.update_one(
                {'_id': ObjectId(user_id)},
                {'$set': payload}
            )
            return result.modified_count > 0
        except Exception as e:
            raise Exception(f"Error updating profile: {str(e)}")
