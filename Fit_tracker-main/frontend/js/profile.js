/**
 * FitTrack v2 — Profile Module
 * Profile display, stats, avatar color picker, and edit form.
 */
const Profile = {
  initialized: false,
  colors: [
    '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e',
    '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#14b8a6', '#84cc16', '#d946ef', '#f97316',
  ],
  selectedColor: '#6366f1',

  async load() {
    if (!this.initialized) {
      this.bindForm();
      this.renderColorPicker();
      this.initialized = true;
    }
    await this.fetchAndRender();
  },

  renderColorPicker() {
    const container = document.getElementById('color-picker');
    if (!container) return;

    container.innerHTML = this.colors.map(c =>
      `<div class="color-swatch ${c === this.selectedColor ? 'active' : ''}" 
            style="background: ${c};" 
            data-color="${c}" 
            onclick="Profile.selectColor('${c}')"></div>`
    ).join('');
  },

  selectColor(color) {
    this.selectedColor = color;
    document.querySelectorAll('.color-swatch').forEach(el => {
      el.classList.toggle('active', el.dataset.color === color);
    });
  },

  async fetchAndRender() {
    try {
      const user = await Api.getProfile();
      localStorage.setItem('fittrack_user', JSON.stringify(user));

      // Profile display
      document.getElementById('profile-username').textContent = user.username;
      document.getElementById('profile-email').textContent = user.email;
      const avatar = document.getElementById('profile-avatar');
      avatar.textContent = (user.username || 'U')[0].toUpperCase();
      avatar.style.background = user.avatar_color || '#6366f1';

      // Edit form
      document.getElementById('profile-edit-username').value = user.username;
      document.getElementById('profile-edit-height').value = user.height || '';
      document.getElementById('profile-edit-weight').value = user.weight || '';

      this.selectedColor = user.avatar_color || '#6366f1';
      this.renderColorPicker();

      // Load stats
      this.loadProfileStats();

      // Update sidebar too
      App.updateUserUI(user);
    } catch (err) {
      console.error('Profile load error:', err);
    }
  },

  async loadProfileStats() {
    try {
      const [stats, streak] = await Promise.all([
        Api.getWeeklyStats(),
        Api.getStreak(),
      ]);

      App.animateCounter('profile-total-workouts', stats.summary.total_workouts);
      App.animateCounter('profile-total-calories', stats.summary.total_calories_burned);
      App.animateCounter('profile-goals-completed', stats.summary.completed_goals);
    } catch (err) {
      console.error('Profile stats error:', err);
    }
  },

  bindForm() {
    document.getElementById('profile-form').addEventListener('submit', async (e) => {
      e.preventDefault();

      const data = {
        username: document.getElementById('profile-edit-username').value,
        height: document.getElementById('profile-edit-height').value,
        weight: document.getElementById('profile-edit-weight').value,
        avatar_color: this.selectedColor,
      };

      try {
        const result = await Api.updateProfile(data);
        localStorage.setItem('fittrack_user', JSON.stringify(result.user));
        App.updateUserUI(result.user);
        App.showToast('Profile updated! ✨', 'success');
        await this.fetchAndRender();
      } catch (err) {
        App.showToast(err.message, 'error');
      }
    });
  },
};
