import jwt
import datetime
from functools import wraps
from flask import request, jsonify, current_app
from models import User


def generate_token(user_id):
    """Generate a JWT token for the given user."""
    payload = {
        'user_id': user_id,
        'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
            hours=current_app.config.get('JWT_EXPIRATION_HOURS', 24)
        ),
        'iat': datetime.datetime.now(datetime.timezone.utc)
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')


def token_required(f):
    """Decorator to protect routes with JWT authentication."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]

        if not token:
            return jsonify({'error': 'Authentication token is missing'}), 401

        try:
            payload = jwt.decode(
                token,
                current_app.config['SECRET_KEY'],
                algorithms=['HS256']
            )
            current_user = User.query.get(payload['user_id'])
            if not current_user:
                return jsonify({'error': 'User not found'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401

        return f(current_user, *args, **kwargs)

    return decorated
