from flask import Blueprint, request, jsonify
from models import db, Goal
from auth import token_required
from datetime import datetime

goal_bp = Blueprint('goals', __name__)


@goal_bp.route('', methods=['GET'])
@token_required
def get_goals(current_user):
    """Get all goals for the current user."""
    status_filter = request.args.get('status')

    query = Goal.query.filter_by(user_id=current_user.id)

    if status_filter:
        query = query.filter_by(status=status_filter)

    goals = query.order_by(Goal.created_at.desc()).all()
    return jsonify([g.to_dict() for g in goals]), 200


@goal_bp.route('', methods=['POST'])
@token_required
def create_goal(current_user):
    """Create a new goal."""
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    goal_type = data.get('goal_type', '').strip()
    target_value = data.get('target_value')

    if not goal_type or target_value is None:
        return jsonify({'error': 'Goal type and target value are required'}), 400

    valid_types = ['weight', 'workout', 'calorie', 'distance', 'custom']
    if goal_type.lower() not in valid_types:
        return jsonify({'error': f'Goal type must be one of: {", ".join(valid_types)}'}), 400

    try:
        target_value = float(target_value)
    except (ValueError, TypeError):
        return jsonify({'error': 'Target value must be a number'}), 400

    goal = Goal(
        user_id=current_user.id,
        goal_type=goal_type.lower(),
        target_value=target_value,
        current_value=data.get('current_value', 0)
    )

    deadline = data.get('deadline')
    if deadline:
        try:
            goal.deadline = datetime.strptime(deadline, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format, use YYYY-MM-DD'}), 400

    db.session.add(goal)
    db.session.commit()

    return jsonify({
        'message': 'Goal created',
        'goal': goal.to_dict()
    }), 201


@goal_bp.route('/<int:goal_id>', methods=['PUT'])
@token_required
def update_goal(current_user, goal_id):
    """Update a goal."""
    goal = Goal.query.filter_by(id=goal_id, user_id=current_user.id).first()

    if not goal:
        return jsonify({'error': 'Goal not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    if 'current_value' in data:
        goal.current_value = float(data['current_value'])
    if 'target_value' in data:
        goal.target_value = float(data['target_value'])
    if 'status' in data:
        if data['status'] in ['active', 'completed', 'abandoned']:
            goal.status = data['status']
    if 'deadline' in data:
        try:
            goal.deadline = datetime.strptime(data['deadline'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format'}), 400

    # Auto-complete if target reached
    if goal.current_value >= goal.target_value and goal.status == 'active':
        goal.status = 'completed'

    db.session.commit()

    return jsonify({
        'message': 'Goal updated',
        'goal': goal.to_dict()
    }), 200


@goal_bp.route('/<int:goal_id>', methods=['DELETE'])
@token_required
def delete_goal(current_user, goal_id):
    """Delete a goal."""
    goal = Goal.query.filter_by(id=goal_id, user_id=current_user.id).first()

    if not goal:
        return jsonify({'error': 'Goal not found'}), 404

    db.session.delete(goal)
    db.session.commit()

    return jsonify({'message': 'Goal deleted'}), 200
