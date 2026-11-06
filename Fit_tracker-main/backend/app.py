import os
import sys
import random
from datetime import datetime, timedelta, timezone
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from config import Config
from models import db, User, Workout, CalorieEntry, Goal, WaterIntake
from auth import token_required

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# ── Motivational Quotes ──────────────────────────────────────
QUOTES = [
    {"text": "The only bad workout is the one that didn't happen.", "author": "Unknown"},
    {"text": "Take care of your body. It's the only place you have to live.", "author": "Jim Rohn"},
    {"text": "The pain you feel today will be the strength you feel tomorrow.", "author": "Arnold Schwarzenegger"},
    {"text": "Fitness is not about being better than someone else. It's about being better than you used to be.", "author": "Khloe Kardashian"},
    {"text": "Your body can stand almost anything. It's your mind that you have to convince.", "author": "Andrew Murphy"},
    {"text": "The secret of getting ahead is getting started.", "author": "Mark Twain"},
    {"text": "Don't limit your challenges. Challenge your limits.", "author": "Jerry Dunn"},
    {"text": "Success usually comes to those who are too busy to be looking for it.", "author": "Henry David Thoreau"},
    {"text": "All progress takes place outside the comfort zone.", "author": "Michael John Bobak"},
    {"text": "Strength does not come from the body. It comes from the will.", "author": "Mahatma Gandhi"},
    {"text": "The hard days are the best because that's when champions are made.", "author": "Gabby Douglas"},
    {"text": "Push yourself because no one else is going to do it for you.", "author": "Unknown"},
    {"text": "It never gets easier. You just get stronger.", "author": "Unknown"},
    {"text": "Sweat is fat crying.", "author": "Unknown"},
    {"text": "Wake up with determination. Go to bed with satisfaction.", "author": "Unknown"},
]


def create_app():
    app = Flask(__name__,
                static_folder=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend'),
                static_url_path='')
    app.config.from_object(Config)

    CORS(app)
    db.init_app(app)

    # Register blueprints
    from routes.auth_routes import auth_bp
    from routes.workout_routes import workout_bp
    from routes.calorie_routes import calorie_bp
    from routes.goal_routes import goal_bp
    from routes.water_routes import water_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(workout_bp, url_prefix='/api/workouts')
    app.register_blueprint(calorie_bp, url_prefix='/api/calories')
    app.register_blueprint(goal_bp, url_prefix='/api/goals')
    app.register_blueprint(water_bp, url_prefix='/api/water')

    # ── User Profile Routes ──────────────────────────────────
    @app.route('/api/user/profile', methods=['GET'])
    @token_required
    def get_profile(current_user):
        return jsonify(current_user.to_dict()), 200

    @app.route('/api/user/profile', methods=['PUT'])
    @token_required
    def update_profile(current_user):
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        if 'username' in data:
            current_user.username = data['username']
        if 'height' in data:
            current_user.height = float(data['height'])
        if 'weight' in data:
            current_user.weight = float(data['weight'])
        if 'avatar_color' in data:
            current_user.avatar_color = data['avatar_color']

        db.session.commit()
        return jsonify({
            'message': 'Profile updated',
            'user': current_user.to_dict()
        }), 200

    # ── Weekly Stats Route ───────────────────────────────────
    @app.route('/api/stats/weekly', methods=['GET'])
    @token_required
    def weekly_stats(current_user):
        today = datetime.now(timezone.utc).date()
        week_start = today - timedelta(days=today.weekday())

        days = []
        for i in range(7):
            day = week_start + timedelta(days=i)
            day_name = day.strftime('%a')

            day_workouts = Workout.query.filter_by(user_id=current_user.id, date=day).all()
            day_calories = CalorieEntry.query.filter_by(user_id=current_user.id, date=day).all()
            day_water = WaterIntake.query.filter_by(user_id=current_user.id, date=day).all()

            total_workout_min = sum(w.duration_min for w in day_workouts)
            total_cal_burned = sum(w.calories_burned for w in day_workouts)
            total_cal_consumed = sum(c.calorie_count for c in day_calories)
            workout_count = len(day_workouts)
            total_water_ml = sum(w.ml for w in day_water)

            days.append({
                'date': day.isoformat(),
                'day': day_name,
                'workout_minutes': total_workout_min,
                'calories_burned': total_cal_burned,
                'calories_consumed': total_cal_consumed,
                'workout_count': workout_count,
                'water_ml': total_water_ml,
            })

        total_workouts = sum(d['workout_count'] for d in days)
        total_minutes = sum(d['workout_minutes'] for d in days)
        total_burned = sum(d['calories_burned'] for d in days)
        total_consumed = sum(d['calories_consumed'] for d in days)
        total_water = sum(d['water_ml'] for d in days)

        active_goals = Goal.query.filter_by(user_id=current_user.id, status='active').count()
        completed_goals = Goal.query.filter_by(user_id=current_user.id, status='completed').count()

        return jsonify({
            'days': days,
            'summary': {
                'total_workouts': total_workouts,
                'total_minutes': total_minutes,
                'total_calories_burned': total_burned,
                'total_calories_consumed': total_consumed,
                'active_goals': active_goals,
                'completed_goals': completed_goals,
                'net_calories': total_consumed - total_burned,
                'total_water_ml': total_water,
            }
        }), 200

    # ── Streak Route ─────────────────────────────────────────
    @app.route('/api/stats/streak', methods=['GET'])
    @token_required
    def get_streak(current_user):
        today = datetime.now(timezone.utc).date()
        streak = 0
        check_date = today

        while True:
            has_workout = Workout.query.filter_by(
                user_id=current_user.id, date=check_date
            ).first()

            if has_workout:
                streak += 1
                check_date -= timedelta(days=1)
            else:
                break

        # Best streak (look back 365 days)
        best_streak = 0
        current_run = 0
        for i in range(365):
            d = today - timedelta(days=i)
            has = Workout.query.filter_by(user_id=current_user.id, date=d).first()
            if has:
                current_run += 1
                best_streak = max(best_streak, current_run)
            else:
                current_run = 0

        return jsonify({
            'current_streak': streak,
            'best_streak': best_streak,
        }), 200

    # ── Activity Feed ────────────────────────────────────────
    @app.route('/api/activity', methods=['GET'])
    @token_required
    def get_activity(current_user):
        limit = request.args.get('limit', 15, type=int)

        activities = []

        workouts = Workout.query.filter_by(user_id=current_user.id)\
            .order_by(Workout.created_at.desc()).limit(limit).all()
        for w in workouts:
            activities.append({
                'type': 'workout',
                'icon': '💪',
                'title': f'{w.exercise_type} workout',
                'detail': f'{w.duration_min} min · {w.calories_burned} kcal burned',
                'date': w.created_at.isoformat(),
                'timestamp': w.created_at.timestamp()
            })

        meals = CalorieEntry.query.filter_by(user_id=current_user.id)\
            .order_by(CalorieEntry.created_at.desc()).limit(limit).all()
        for c in meals:
            activities.append({
                'type': 'meal',
                'icon': '🍎',
                'title': f'{c.food_name}',
                'detail': f'{c.meal_type} · {c.calorie_count} kcal',
                'date': c.created_at.isoformat(),
                'timestamp': c.created_at.timestamp()
            })

        goals = Goal.query.filter_by(user_id=current_user.id)\
            .order_by(Goal.created_at.desc()).limit(limit).all()
        for g in goals:
            pct = round((g.current_value / g.target_value) * 100) if g.target_value else 0
            activities.append({
                'type': 'goal',
                'icon': '🎯',
                'title': f'{g.goal_type.title()} goal',
                'detail': f'{pct}% complete — {g.status}',
                'date': g.created_at.isoformat(),
                'timestamp': g.created_at.timestamp()
            })

        water_entries = WaterIntake.query.filter_by(user_id=current_user.id)\
            .order_by(WaterIntake.created_at.desc()).limit(limit).all()
        for w in water_entries:
            activities.append({
                'type': 'water',
                'icon': '💧',
                'title': f'Drank {w.glasses} glass(es)',
                'detail': f'{w.ml} ml',
                'date': w.created_at.isoformat(),
                'timestamp': w.created_at.timestamp()
            })

        # Sort by timestamp descending, take top N
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        return jsonify(activities[:limit]), 200

    # ── Motivational Quote ───────────────────────────────────
    @app.route('/api/quote', methods=['GET'])
    def get_quote():
        quote = random.choice(QUOTES)
        return jsonify(quote), 200

    # ── Serve Frontend ───────────────────────────────────────
    @app.route('/')
    def serve_frontend():
        return send_from_directory(app.static_folder, 'index.html')

    @app.route('/<path:path>')
    def serve_static(path):
        return send_from_directory(app.static_folder, path)

    with app.app_context():
        db.create_all()

    @app.route('/')
    def home():
        return app.send_static_file('index.html')
    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
