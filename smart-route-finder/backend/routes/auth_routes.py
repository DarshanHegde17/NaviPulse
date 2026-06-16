from flask import Blueprint, request, jsonify
from models.user import User
import hashlib
import secrets

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not all([username, email, password]):
            return jsonify({'error': 'All fields are required'}), 400
        
        # Check if user exists
        if User.find_by_email(email):
            return jsonify({'error': 'Email already registered'}), 409
        
        # Hash password
        password_hash = hash_password(password)
        
        # Create user
        user = User.create(username, email, password_hash)
        
        return jsonify({
            'message': 'User registered successfully',
            'user': {
                'id': str(user['_id']),
                'username': user['username'],
                'email': user['email']
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()
        
        email = data.get('email')
        password = data.get('password')
        
        if not all([email, password]):
            return jsonify({'error': 'Email and password required'}), 400
        
        # Find user
        user = User.find_by_email(email)
        
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Verify password
        password_hash = hash_password(password)
        
        if password_hash != user['password']:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Generate session token (simplified - use JWT in production)
        session_token = secrets.token_hex(32)
        
        return jsonify({
            'message': 'Login successful',
            'token': session_token,
            'user': {
                'id': str(user['_id']),
                'username': user['username'],
                'email': user['email'],
                'preferences': user.get('preferences', {})
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/user/<user_id>', methods=['GET'])
def get_user(user_id):
    """Get user details"""
    try:
        user = User.find_by_id(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'user': {
                'id': str(user['_id']),
                'username': user['username'],
                'email': user['email'],
                'preferences': user.get('preferences', {})
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/preferences/<user_id>', methods=['PUT'])
def update_preferences(user_id):
    """Update user preferences"""
    try:
        data = request.get_json()
        preferences = data.get('preferences', {})
        
        success = User.update_preferences(user_id, preferences)
        
        if success:
            return jsonify({'message': 'Preferences updated successfully'}), 200
        else:
            return jsonify({'error': 'Failed to update preferences'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/user/<user_id>', methods=['PUT'])
def update_user(user_id):
    """Update user profile (username/email)"""
    try:
        data = request.get_json() or {}
        username = (data.get('username') or '').strip()
        email = (data.get('email') or '').strip().lower()

        if not username or not email:
            return jsonify({'error': 'Username and email are required'}), 400

        existing = User.find_by_email(email)
        if existing and str(existing.get('_id')) != user_id:
            return jsonify({'error': 'Email already registered'}), 409

        success = User.update_profile(user_id, {
            'username': username,
            'email': email
        })

        if not success:
            user = User.find_by_id(user_id)
            if not user:
                return jsonify({'error': 'User not found'}), 404

        user = User.find_by_id(user_id)
        return jsonify({
            'message': 'Profile updated successfully',
            'user': {
                'id': str(user['_id']),
                'username': user['username'],
                'email': user['email'],
                'preferences': user.get('preferences', {})
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
