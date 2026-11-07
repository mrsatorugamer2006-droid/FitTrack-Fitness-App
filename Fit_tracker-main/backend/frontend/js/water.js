/**
 * FitTrack v2 — Water Intake Tracker
 * Circular progress ring, glass visualization, and quick-add buttons.
 */
const Water = {
  initialized: false,
  goalMl: 2500,

  async load() {
    await this.fetchAndRender();
  },

  async fetchAndRender() {
    try {
      const data = await Api.getWaterToday();
      this.renderProgress(data);
      this.renderLog(data.entries);
    } catch (err) {
      console.error('Water load error:', err);
    }
  },

  renderProgress(data) {
    const { total_ml, total_glasses, percentage } = data;

    // Animate circular progress
    const ring = document.getElementById('water-progress-ring');
    if (ring) {
      const circumference = 2 * Math.PI * 90; // r=90
      const offset = circumference - (percentage / 100) * circumference;
      ring.style.strokeDashoffset = offset;
    }

    // Animate number
    App.animateCounter('water-total-ml', total_ml);

    // Render glass visualization (up to 10 glasses)
    const glassContainer = document.getElementById('water-glasses-visual');
    if (glassContainer) {
      const targetGlasses = Math.ceil(this.goalMl / 250); // 10 glasses
      let html = '';
      for (let i = 1; i <= targetGlasses; i++) {
        const filled = i <= total_glasses;
        html += `<div class="water-glass ${filled ? 'filled' : ''}" title="Glass ${i}"></div>`;
      }
      glassContainer.innerHTML = html;
    }
  },

  renderLog(entries) {
    const container = document.getElementById('water-log');
    if (!container) return;

    if (!entries || entries.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">💧</div>
          <h4>No water logged today</h4>
          <p>Start hydrating! Click the buttons to add water.</p>
        </div>`;
      return;
    }

    const totalMl = entries.reduce((s, e) => s + e.ml, 0);

    container.innerHTML = `
      <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
        <span class="badge badge-water">${entries.length} entries</span>
        <span style="font-weight: 700; color: var(--color-water);">${totalMl} ml total</span>
      </div>
      <table class="data-table">
        <thead>
          <tr><th>Time</th><th>Glasses</th><th>Volume</th><th>Actions</th></tr>
        </thead>
        <tbody>
          ${entries.map(e => `
            <tr>
              <td>${App.timeAgo(e.created_at)}</td>
              <td>${e.glasses} 🥤</td>
              <td>${e.ml} ml</td>
              <td class="actions">
                <button class="btn btn-danger btn-sm" onclick="Water.delete(${e.id})">🗑️</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>`;
  },

  async quickAdd(glasses) {
    const mlPerGlass = 250;
    const ml = glasses === 3 ? 500 : glasses * mlPerGlass; // 3 = 500ml bottle
    const actualGlasses = glasses === 3 ? 2 : glasses;

    try {
      await Api.addWater({ glasses: actualGlasses, ml });
      App.showToast(`+${ml}ml — Stay hydrated! 💧`, 'water');
      await this.fetchAndRender();
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  },

  async delete(id) {
    if (!confirm('Delete this entry?')) return;
    try {
      await Api.deleteWater(id);
      App.showToast('Water entry removed', 'info');
      await this.fetchAndRender();
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  }
};
