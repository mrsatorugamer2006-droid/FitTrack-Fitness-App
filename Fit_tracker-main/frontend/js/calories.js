/**
 * FitTrack — Calories Module
 * Handles calorie entry CRUD and list rendering.
 */
const Calories = {
  initialized: false,

  async load() {
    if (!this.initialized) {
      this.bindForm();
      this.initialized = true;
    }
    document.getElementById('calorie-date').value = App.todayStr();
    await this.fetchAndRender();
  },

  bindForm() {
    document.getElementById('calorie-form').addEventListener('submit', async (e) => {
      e.preventDefault();

      const data = {
        meal_type: document.getElementById('meal-type').value,
        food_name: document.getElementById('food-name').value,
        calorie_count: document.getElementById('calorie-count').value,
        date: document.getElementById('calorie-date').value,
      };

      try {
        await Api.createCalorie(data);
        App.showToast('Meal logged! 🍎', 'success');
        document.getElementById('calorie-form').reset();
        document.getElementById('calorie-date').value = App.todayStr();
        await this.fetchAndRender();
      } catch (err) {
        App.showToast(err.message, 'error');
      }
    });
  },

  async fetchAndRender() {
    const container = document.getElementById('calories-list');

    try {
      const entries = await Api.getCalories();

      if (entries.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="icon">🍎</div>
            <h4>No meals logged</h4>
            <p>Start tracking your calories above!</p>
          </div>`;
        return;
      }

      // Group by date
      const grouped = {};
      entries.forEach(e => {
        if (!grouped[e.date]) grouped[e.date] = [];
        grouped[e.date].push(e);
      });

      const mealIcons = {
        breakfast: '🌅',
        lunch: '☀️',
        dinner: '🌙',
        snack: '🍪'
      };

      let html = '';
      Object.keys(grouped).forEach(date => {
        const dayEntries = grouped[date];
        const dayTotal = dayEntries.reduce((sum, e) => sum + e.calorie_count, 0);

        html += `
          <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <span style="font-weight: 600; font-size: 14px;">${App.formatDate(date)}</span>
              <span class="badge badge-warning">${dayTotal} kcal total</span>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Meal</th>
                  <th>Food</th>
                  <th>Calories</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${dayEntries.map(e => `
                  <tr>
                    <td>${mealIcons[e.meal_type] || '🍽️'} ${e.meal_type}</td>
                    <td>${e.food_name}</td>
                    <td>${e.calorie_count} kcal</td>
                    <td class="actions">
                      <button class="btn btn-danger btn-sm" onclick="Calories.delete(${e.id})">🗑️</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>`;
      });

      container.innerHTML = html;
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><p>${err.message}</p></div>`;
    }
  },

  async delete(id) {
    if (!confirm('Delete this entry?')) return;
    try {
      await Api.deleteCalorie(id);
      App.showToast('Entry deleted', 'info');
      await this.fetchAndRender();
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  }
};
