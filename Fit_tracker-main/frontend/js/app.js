/**
 * FitTrack v2 — Main Application Controller
 * Handles routing, auth state, toasts, confetti, animated counters, and navigation.
 */
const App = {
  currentPage: 'dashboard',

  init() {
    this.bindAuthForms();
    this.bindNavigation();
    this.bindMobileToggle();
    this.checkAuth();
  },

  // ── Auth State ──────────────────────────────────────────────
  checkAuth() {
    const token = localStorage.getItem('fittrack_token');
    const user = JSON.parse(localStorage.getItem('fittrack_user') || 'null');
    if (token && user) this.showApp(user);
    else this.showAuth();
  },

  showAuth() {
    document.getElementById('auth-view').style.display = 'block';
    document.getElementById('app-view').style.display = 'none';
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('signup-page').style.display = 'none';
  },

  showApp(user) {
    document.getElementById('auth-view').style.display = 'none';
    document.getElementById('app-view').style.display = 'block';
    this.updateUserUI(user);
    this.navigateTo('dashboard');
  },

  updateUserUI(user) {
    document.getElementById('user-name').textContent = user.username || 'User';
    document.getElementById('user-email').textContent = user.email || '';
    const initial = (user.username || 'U')[0].toUpperCase();
    const avatarEl = document.getElementById('user-avatar');
    avatarEl.textContent = initial;
    if (user.avatar_color) avatarEl.style.background = user.avatar_color;

    // Greeting
    const hour = new Date().getHours();
    let greeting = 'Good evening';
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 18) greeting = 'Good afternoon';
    const greetEl = document.getElementById('dashboard-greeting');
    if (greetEl) greetEl.textContent = `${greeting}, ${user.username || 'there'}! Here's your fitness overview.`;
  },

  logout() {
    localStorage.removeItem('fittrack_token');
    localStorage.removeItem('fittrack_user');
    this.showAuth();
    this.showToast('Logged out successfully', 'info');
  },

  // ── Auth Forms ──────────────────────────────────────────────
  bindAuthForms() {
    document.getElementById('show-signup').addEventListener('click', () => {
      document.getElementById('login-page').style.display = 'none';
      document.getElementById('signup-page').style.display = 'flex';
    });
    document.getElementById('show-login').addEventListener('click', () => {
      document.getElementById('signup-page').style.display = 'none';
      document.getElementById('login-page').style.display = 'flex';
    });

    // Login
    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('login-btn');
      const errEl = document.getElementById('login-error');
      btn.disabled = true; btn.textContent = 'Signing in...'; errEl.classList.remove('show');
      try {
        const data = await Api.login({
          email: document.getElementById('login-email').value,
          password: document.getElementById('login-password').value,
        });
        localStorage.setItem('fittrack_token', data.token);
        localStorage.setItem('fittrack_user', JSON.stringify(data.user));
        this.showApp(data.user);
        this.showToast('Welcome back! 🎉', 'success');
      } catch (err) {
        errEl.textContent = err.message; errEl.classList.add('show');
      } finally {
        btn.disabled = false; btn.textContent = 'Sign In';
      }
    });

    // Signup
    document.getElementById('signup-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('signup-btn');
      const errEl = document.getElementById('signup-error');
      btn.disabled = true; btn.textContent = 'Creating account...'; errEl.classList.remove('show');
      try {
        const data = await Api.signup({
          username: document.getElementById('signup-username').value,
          email: document.getElementById('signup-email').value,
          password: document.getElementById('signup-password').value,
          height: document.getElementById('signup-height').value || null,
          weight: document.getElementById('signup-weight').value || null,
        });
        localStorage.setItem('fittrack_token', data.token);
        localStorage.setItem('fittrack_user', JSON.stringify(data.user));
        this.showApp(data.user);
        this.showToast('Account created! Welcome to FitTrack 🚀', 'success');
        this.fireConfetti();
      } catch (err) {
        errEl.textContent = err.message; errEl.classList.add('show');
      } finally {
        btn.disabled = false; btn.textContent = 'Create Account';
      }
    });

    document.getElementById('logout-btn').addEventListener('click', () => this.logout());
  },

  // ── Navigation ──────────────────────────────────────────────
  bindNavigation() {
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', () => {
        this.navigateTo(item.getAttribute('data-page'));
        document.getElementById('sidebar').classList.remove('open');
      });
    });
  },

  navigateTo(page) {
    this.currentPage = page;

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (activeNav) activeNav.classList.add('active');

    document.querySelectorAll('.page-view').forEach(el => el.classList.remove('active'));
    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) pageEl.classList.add('active');

    switch (page) {
      case 'dashboard': Dashboard.load(); break;
      case 'workouts': Workouts.load(); break;
      case 'calories': Calories.load(); break;
      case 'water': Water.load(); break;
      case 'bmi': BMI.init(); break;
      case 'goals': Goals.load(); break;
      case 'progress': Charts.loadProgress(); break;
      case 'profile': Profile.load(); break;
    }
  },

  bindMobileToggle() {
    document.getElementById('mobile-toggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });
  },

  // ── Toasts ──────────────────────────────────────────────────
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const icons = { success: '✅', error: '❌', info: 'ℹ️', water: '💧' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  // ── Animated Counters ───────────────────────────────────────
  animateCounter(element, target, duration = 1200) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (!el) return;

    const start = parseInt(el.textContent) || 0;
    const diff = target - start;
    if (diff === 0) { el.textContent = target; return; }

    const startTime = performance.now();
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.round(start + diff * eased);
      el.textContent = current.toLocaleString();
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  },

  // ── Confetti ────────────────────────────────────────────────
  fireConfetti() {
    const container = document.getElementById('confetti-container');
    const colors = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f43f5e'];

    for (let i = 0; i < 60; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.width = (Math.random() * 8 + 4) + 'px';
      piece.style.height = (Math.random() * 8 + 4) + 'px';
      piece.style.animationDuration = (Math.random() * 2 + 2) + 's';
      piece.style.animationDelay = (Math.random() * 1) + 's';
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      container.appendChild(piece);
    }
    setTimeout(() => { container.innerHTML = ''; }, 5000);
  },

  // ── Skeleton Loader ─────────────────────────────────────────
  showSkeleton(containerId, count = 3) {
    const container = document.getElementById(containerId);
    if (!container) return;
    let html = '';
    for (let i = 0; i < count; i++) {
      html += `<div class="skeleton skeleton-card" style="animation-delay: ${i * 0.1}s"></div>`;
    }
    container.innerHTML = html;
  },

  // ── Helpers ─────────────────────────────────────────────────
  formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },

  timeAgo(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
  },

  todayStr() { return new Date().toISOString().split('T')[0]; }
};

document.addEventListener('DOMContentLoaded', () => App.init());
