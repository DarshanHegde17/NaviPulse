from pymongo import MongoClient
from config.config import Config
from datetime import datetime

class Database:
    """MongoDB Database Handler"""
    
    _instance = None
    _client = None
    _db = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Database, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._client is None:
            self.connect()
    
    def connect(self):
        """Establish MongoDB connection"""
        try:
            self._client = MongoClient(Config.MONGODB_URI)
            self._db = self._client[Config.DATABASE_NAME]
            # Test connection
            self._client.server_info()
            print(f"✓ Connected to MongoDB: {Config.DATABASE_NAME}")
            self._create_indexes()
        except Exception as e:
            print(f"✗ MongoDB connection failed: {str(e)}")
            raise
    
    def _create_indexes(self):
        """Create database indexes for optimization"""
        try:
            # Users collection indexes
            self._db.users.create_index("email", unique=True)
            self._db.users.create_index("username", unique=True)
            
            # Route history indexes
            self._db.route_history.create_index([("user_id", 1), ("created_at", -1)])
            self._db.route_history.create_index("created_at")
            
            # Saved routes indexes
            self._db.saved_routes.create_index([("user_id", 1)])
            
            print("✓ Database indexes created")
        except Exception as e:
            print(f"Warning: Index creation failed: {str(e)}")
    
    def get_db(self):
        """Get database instance"""
        return self._db
    
    def close(self):
        """Close database connection"""
        if self._client:
            self._client.close()
            print("✓ MongoDB connection closed")

# Global database instance
db = Database()
