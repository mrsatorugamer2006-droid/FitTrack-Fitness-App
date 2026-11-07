/**
 * FitTrack — Workouts Module
 * Handles workout CRUD and list rendering.
 */
const Workouts = {
  initialized: false,

  async load() {
    if (!this.initialized) {
      this.bindForm();
      this.initialized = true;
    }
    // Set default date to today
    document.getElementById('workout-date').value = App.todayStr();
    await this.fetchAndRender();
  },

  bindForm() {
    document.getElementById('workout-form').addEventListener('submit', async (e) => {
      e.preventDefault();

      const data = {
        exercise_type: document.getElementById('workout-type').value,
        duration_min: document.getElementById('workout-duration').value,
        calories_burned: document.getElementById('workout-calories').value || 0,
        date: document.getElementById('workout-date').value,
        notes: document.getElementById('workout-notes').value,
      };

      try {
        await Api.createWorkout(data);
        App.showToast('Workout logged! 💪', 'success');
        document.getElementById('workout-form').reset();
        document.getElementById('workout-date').value = App.todayStr();
        await this.fetchAndRender();
      } catch (err) {
        App.showToast(err.message, 'error');
      }
    });
  },

  async fetchAndRender() {
    const container = document.getElementById('workouts-list');

    try {
      const workouts = await Api.getWorkouts();

      if (workouts.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="icon">💪</div>
            <h4>No workouts yet</h4>
            <p>Log your first workout above to get started!</p>
          </div>`;
        return;
      }

      container.innerHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>Exercise</th>
              <th>Duration</th>
              <th>Calories</th>
              <th>Date</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${workouts.map(w => `
              <tr>
                <td><span class="badge badge-primary">${w.exercise_type}</span></td>
                <td>${w.duration_min} min</td>
                <td>${w.calories_burned} kcal</td>
                <td>${App.formatDate(w.date)}</td>
                <td>${w.notes || '—'}</td>
                <td class="actions">
                  <button class="btn btn-danger btn-sm" onclick="Workouts.delete(${w.id})">🗑️</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>`;
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><p>${err.message}</p></div>`;
    }
  },

  async delete(id) {
    if (!confirm('Delete this workout?')) return;
    try {
      await Api.deleteWorkout(id);
      App.showToast('Workout deleted', 'info');
      await this.fetchAndRender();
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  }
};
