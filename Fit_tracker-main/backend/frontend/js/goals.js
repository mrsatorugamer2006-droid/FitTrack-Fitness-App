/**
 * FitTrack v2 — Goals Module
 * Goal CRUD with animated progress bars and confetti on completion.
 */
const Goals = {
  initialized: false,

  async load() {
    if (!this.initialized) {
      this.bindForm();
      this.initialized = true;
    }
    await this.fetchAndRender();
  },

  bindForm() {
    document.getElementById('goal-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        goal_type: document.getElementById('goal-type').value,
        target_value: document.getElementById('goal-target').value,
        current_value: document.getElementById('goal-current').value || 0,
        deadline: document.getElementById('goal-deadline').value || null,
      };
      try {
        await Api.createGoal(data);
        App.showToast('Goal created! 🎯', 'success');
        document.getElementById('goal-form').reset();
        await this.fetchAndRender();
      } catch (err) {
        App.showToast(err.message, 'error');
      }
    });
  },

  async fetchAndRender() {
    const container = document.getElementById('goals-list');
    try {
      const goals = await Api.getGoals();

      if (goals.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="icon">🎯</div>
            <h4>No goals set</h4>
            <p>Set your first fitness goal above!</p>
          </div>`;
        return;
      }

      const typeLabels = {
        weight: '⚖️ Weight', workout: '💪 Workouts', calorie: '🔥 Calories',
        distance: '🏃 Distance', custom: '⭐ Custom'
      };

      const statusBadges = {
        active: 'badge-primary', completed: 'badge-success', abandoned: 'badge-danger'
      };

      container.innerHTML = `<div class="goals-list">
        ${goals.map((g, i) => {
          const pct = Math.min(100, Math.round((g.current_value / g.target_value) * 100));
          return `
            <div class="goal-item" style="animation-delay: ${i * 0.08}s">
              <div class="goal-header">
                <span class="goal-title">${typeLabels[g.goal_type] || g.goal_type}</span>
                <div style="display: flex; gap: 8px; align-items: center;">
                  <span class="badge ${statusBadges[g.status] || 'badge-primary'}">${g.status}</span>
                  <button class="btn btn-danger btn-sm" onclick="Goals.delete(${g.id})" title="Delete">🗑️</button>
                </div>
              </div>
              <div class="goal-progress">
                <div class="goal-progress-fill" style="width: ${pct}%"></div>
              </div>
              <div class="goal-meta">
                <span>${g.current_value} / ${g.target_value} (${pct}%)</span>
                <span>${g.deadline ? 'Due: ' + App.formatDate(g.deadline) : 'No deadline'}</span>
              </div>
              ${g.status === 'active' ? `
                <div style="margin-top: 14px; display: flex; gap: 8px;">
                  <input type="number" id="goal-update-${g.id}" placeholder="New value" step="0.1"
                    style="flex:1; padding: 10px 14px; background: var(--bg-input); border: 1.5px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-primary); font-size: 13px; font-family: inherit;">
                  <button class="btn btn-primary btn-sm" onclick="Goals.updateProgress(${g.id}, ${g.target_value})">Update</button>
                </div>
              ` : ''}
            </div>`;
        }).join('')}
      </div>`;
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><p>${err.message}</p></div>`;
    }
  },

  async updateProgress(id, targetValue) {
    const input = document.getElementById(`goal-update-${id}`);
    const val = parseFloat(input.value);
    if (isNaN(val)) {
      App.showToast('Enter a valid number', 'error');
      return;
    }

    try {
      const result = await Api.updateGoal(id, { current_value: val });
      // Check if goal just got completed
      if (val >= targetValue) {
        App.showToast('🎉 Goal completed! Amazing work!', 'success');
        App.fireConfetti();
      } else {
        App.showToast('Goal progress updated! ✨', 'success');
      }
      await this.fetchAndRender();
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  },

  async delete(id) {
    if (!confirm('Delete this goal?')) return;
    try {
      await Api.deleteGoal(id);
      App.showToast('Goal deleted', 'info');
      await this.fetchAndRender();
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  }
};
