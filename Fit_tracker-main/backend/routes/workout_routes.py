from flask import Blueprint, request, jsonify
from models import db, Workout
from auth import token_required
from datetime import datetime

workout_bp = Blueprint('workouts', __name__)


@workout_bp.route('', methods=['GET'])
@token_required
def get_workouts(current_user):
    """Get all workouts for the current user."""
    date_filter = request.args.get('date')
    exercise_type = request.args.get('type')

    query = Workout.query.filter_by(user_id=current_user.id)

    if date_filter:
        try:
            filter_date = datetime.strptime(date_filter, '%Y-%m-%d').date()
            query = query.filter_by(date=filter_date)
        except ValueError:
            pass

    if exercise_type:
        query = query.filter_by(exercise_type=exercise_type)

    workouts = query.order_by(Workout.date.desc()).all()
    return jsonify([w.to_dict() for w in workouts]), 200


@workout_bp.route('', methods=['POST'])
@token_required
def create_workout(current_user):
    """Log a new workout."""
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    exercise_type = data.get('exercise_type', '').strip()
    duration_min = data.get('duration_min')

    if not exercise_type or not duration_min:
        return jsonify({'error': 'Exercise type and duration are required'}), 400

    try:
        duration_min = int(duration_min)
    except (ValueError, TypeError):
        return jsonify({'error': 'Duration must be a number'}), 400

    workout = Workout(
        user_id=current_user.id,
        exercise_type=exercise_type,
        duration_min=duration_min,
        calories_burned=data.get('calories_burned', 0),
        notes=data.get('notes', '')
    )

    date_str = data.get('date')
    if date_str:
        try:
            workout.date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format, use YYYY-MM-DD'}), 400

    db.session.add(workout)
    db.session.commit()

    return jsonify({
        'message': 'Workout logged successfully',
        'workout': workout.to_dict()
    }), 201


@workout_bp.route('/<int:workout_id>', methods=['PUT'])
@token_required
def update_workout(current_user, workout_id):
    """Update a workout entry."""
    workout = Workout.query.filter_by(id=workout_id, user_id=current_user.id).first()

    if not workout:
        return jsonify({'error': 'Workout not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    if 'exercise_type' in data:
        workout.exercise_type = data['exercise_type']
    if 'duration_min' in data:
        workout.duration_min = int(data['duration_min'])
    if 'calories_burned' in data:
        workout.calories_burned = int(data['calories_burned'])
    if 'notes' in data:
        workout.notes = data['notes']
    if 'date' in data:
        try:
            workout.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format'}), 400

    db.session.commit()

    return jsonify({
        'message': 'Workout updated',
        'workout': workout.to_dict()
    }), 200


@workout_bp.route('/<int:workout_id>', methods=['DELETE'])
@token_required
def delete_workout(current_user, workout_id):
    """Delete a workout entry."""
    workout = Workout.query.filter_by(id=workout_id, user_id=current_user.id).first()

    if not workout:
        return jsonify({'error': 'Workout not found'}), 404

    db.session.delete(workout)
    db.session.commit()

    return jsonify({'message': 'Workout deleted'}), 200
