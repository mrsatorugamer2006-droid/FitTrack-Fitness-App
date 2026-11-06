from flask import Blueprint, request, jsonify
from models import db, WaterIntake
from auth import token_required
from datetime import datetime

water_bp = Blueprint('water', __name__)


@water_bp.route('', methods=['GET'])
@token_required
def get_water(current_user):
    """Get water intake entries for the current user."""
    date_filter = request.args.get('date')

    query = WaterIntake.query.filter_by(user_id=current_user.id)

    if date_filter:
        try:
            filter_date = datetime.strptime(date_filter, '%Y-%m-%d').date()
            query = query.filter_by(date=filter_date)
        except ValueError:
            pass

    entries = query.order_by(WaterIntake.date.desc(), WaterIntake.created_at.desc()).all()
    return jsonify([e.to_dict() for e in entries]), 200


@water_bp.route('/today', methods=['GET'])
@token_required
def get_water_today(current_user):
    """Get today's total water intake."""
    today = datetime.now().date()
    entries = WaterIntake.query.filter_by(
        user_id=current_user.id,
        date=today
    ).all()

    total_glasses = sum(e.glasses for e in entries)
    total_ml = sum(e.ml for e in entries)
    goal_ml = 2500  # 2.5L daily target

    return jsonify({
        'total_glasses': total_glasses,
        'total_ml': total_ml,
        'goal_ml': goal_ml,
        'percentage': min(100, round((total_ml / goal_ml) * 100)),
        'entries': [e.to_dict() for e in entries]
    }), 200


@water_bp.route('', methods=['POST'])
@token_required
def add_water(current_user):
    """Log water intake."""
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    glasses = data.get('glasses', 1)
    ml = data.get('ml', 250)

    try:
        glasses = int(glasses)
        ml = int(ml)
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid values'}), 400

    entry = WaterIntake(
        user_id=current_user.id,
        glasses=glasses,
        ml=ml
    )

    date_str = data.get('date')
    if date_str:
        try:
            entry.date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format'}), 400

    db.session.add(entry)
    db.session.commit()

    return jsonify({
        'message': 'Water intake logged! 💧',
        'entry': entry.to_dict()
    }), 201


@water_bp.route('/<int:entry_id>', methods=['DELETE'])
@token_required
def delete_water(current_user, entry_id):
    """Delete a water intake entry."""
    entry = WaterIntake.query.filter_by(id=entry_id, user_id=current_user.id).first()

    if not entry:
        return jsonify({'error': 'Entry not found'}), 404

    db.session.delete(entry)
    db.session.commit()

    return jsonify({'message': 'Water entry deleted'}), 200
