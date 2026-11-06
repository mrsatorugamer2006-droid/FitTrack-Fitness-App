from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timezone

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    height = db.Column(db.Float, nullable=True)  # in cm
    weight = db.Column(db.Float, nullable=True)  # in kg
    avatar_color = db.Column(db.String(20), default='#6366f1')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    workouts = db.relationship('Workout', backref='user', lazy=True, cascade='all, delete-orphan')
    calories = db.relationship('CalorieEntry', backref='user', lazy=True, cascade='all, delete-orphan')
    goals = db.relationship('Goal', backref='user', lazy=True, cascade='all, delete-orphan')
    water_entries = db.relationship('WaterIntake', backref='user', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'height': self.height,
            'weight': self.weight,
            'avatar_color': self.avatar_color,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Workout(db.Model):
    __tablename__ = 'workouts'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    exercise_type = db.Column(db.String(100), nullable=False)
    duration_min = db.Column(db.Integer, nullable=False)
    calories_burned = db.Column(db.Integer, default=0)
    date = db.Column(db.Date, default=lambda: datetime.now(timezone.utc).date())
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'exercise_type': self.exercise_type,
            'duration_min': self.duration_min,
            'calories_burned': self.calories_burned,
            'date': self.date.isoformat() if self.date else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class CalorieEntry(db.Model):
    __tablename__ = 'calories'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    meal_type = db.Column(db.String(50), nullable=False)
    food_name = db.Column(db.String(200), nullable=False)
    calorie_count = db.Column(db.Integer, nullable=False)
    date = db.Column(db.Date, default=lambda: datetime.now(timezone.utc).date())
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'meal_type': self.meal_type,
            'food_name': self.food_name,
            'calorie_count': self.calorie_count,
            'date': self.date.isoformat() if self.date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Goal(db.Model):
    __tablename__ = 'goals'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    goal_type = db.Column(db.String(50), nullable=False)
    target_value = db.Column(db.Float, nullable=False)
    current_value = db.Column(db.Float, default=0)
    deadline = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(20), default='active')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'goal_type': self.goal_type,
            'target_value': self.target_value,
            'current_value': self.current_value,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class WaterIntake(db.Model):
    __tablename__ = 'water_intake'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    glasses = db.Column(db.Integer, nullable=False, default=1)
    ml = db.Column(db.Integer, nullable=False, default=250)
    date = db.Column(db.Date, default=lambda: datetime.now(timezone.utc).date())
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'glasses': self.glasses,
            'ml': self.ml,
            'date': self.date.isoformat() if self.date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
