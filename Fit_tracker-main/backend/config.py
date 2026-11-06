import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'fittrack-super-secret-key-2026')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///fittrack.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_EXPIRATION_HOURS = 24
