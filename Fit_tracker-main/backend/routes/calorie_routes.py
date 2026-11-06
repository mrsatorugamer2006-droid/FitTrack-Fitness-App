from flask import Blueprint, request, jsonify
from models import db, CalorieEntry
from auth import token_required
from datetime import datetime

calorie_bp = Blueprint('calories', __name__)


@calorie_bp.route('', methods=['GET'])
@token_required
def get_calories(current_user):
    """Get all calorie entries for the current user."""
    date_filter = request.args.get('date')
    meal_type = request.args.get('meal_type')

    query = CalorieEntry.query.filter_by(user_id=current_user.id)

    if date_filter:
        try:
            filter_date = datetime.strptime(date_filter, '%Y-%m-%d').date()
            query = query.filter_by(date=filter_date)
        except ValueError:
            pass

    if meal_type:
        query = query.filter_by(meal_type=meal_type)

    entries = query.order_by(CalorieEntry.date.desc()).all()
    return jsonify([e.to_dict() for e in entries]), 200


@calorie_bp.route('', methods=['POST'])
@token_required
def create_calorie_entry(current_user):
    """Log a new calorie entry."""
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    meal_type = data.get('meal_type', '').strip()
    food_name = data.get('food_name', '').strip()
    calorie_count = data.get('calorie_count')

    if not meal_type or not food_name or calorie_count is None:
        return jsonify({'error': 'Meal type, food name, and calorie count are required'}), 400

    valid_meals = ['breakfast', 'lunch', 'dinner', 'snack']
    if meal_type.lower() not in valid_meals:
        return jsonify({'error': f'Meal type must be one of: {", ".join(valid_meals)}'}), 400

    try:
        calorie_count = int(calorie_count)
    except (ValueError, TypeError):
        return jsonify({'error': 'Calorie count must be a number'}), 400

    entry = CalorieEntry(
        user_id=current_user.id,
        meal_type=meal_type.lower(),
        food_name=food_name,
        calorie_count=calorie_count
    )

    date_str = data.get('date')
    if date_str:
        try:
            entry.date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format, use YYYY-MM-DD'}), 400

    db.session.add(entry)
    db.session.commit()

    return jsonify({
        'message': 'Calorie entry logged',
        'entry': entry.to_dict()
    }), 201


@calorie_bp.route('/<int:entry_id>', methods=['DELETE'])
@token_required
def delete_calorie_entry(current_user, entry_id):
    """Delete a calorie entry."""
    entry = CalorieEntry.query.filter_by(id=entry_id, user_id=current_user.id).first()

    if not entry:
        return jsonify({'error': 'Entry not found'}), 404

    db.session.delete(entry)
    db.session.commit()

    return jsonify({'message': 'Calorie entry deleted'}), 200
