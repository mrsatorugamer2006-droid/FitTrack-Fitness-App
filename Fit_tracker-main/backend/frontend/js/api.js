/**
 * FitTrack v2 — API Client
 * Centralized HTTP client for all backend communication.
 */
const API_BASE = '/api';

const Api = {
  getToken() { return localStorage.getItem('fittrack_token'); },

  headers(includeAuth = true) {
    const h = { 'Content-Type': 'application/json' };
    if (includeAuth) {
      const token = this.getToken();
      if (token) h['Authorization'] = `Bearer ${token}`;
    }
    return h;
  },

  async request(method, endpoint, body = null, auth = true) {
    const opts = { method, headers: this.headers(auth) };
    if (body) opts.body = JSON.stringify(body);

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, opts);
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('fittrack_token');
          localStorage.removeItem('fittrack_user');
          location.reload();
        }
        throw new Error(data.error || 'Something went wrong');
      }
      return data;
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        throw new Error('Cannot connect to server. Make sure the backend is running on port 5000.');
      }
      throw err;
    }
  },

  // Auth
  signup(data) { return this.request('POST', '/auth/signup', data, false); },
  login(data) { return this.request('POST', '/auth/login', data, false); },

  // Profile
  getProfile() { return this.request('GET', '/user/profile'); },
  updateProfile(data) { return this.request('PUT', '/user/profile', data); },

  // Workouts
  getWorkouts(params = '') { return this.request('GET', `/workouts${params ? '?' + params : ''}`); },
  createWorkout(data) { return this.request('POST', '/workouts', data); },
  updateWorkout(id, data) { return this.request('PUT', `/workouts/${id}`, data); },
  deleteWorkout(id) { return this.request('DELETE', `/workouts/${id}`); },

  // Calories
  getCalories(params = '') { return this.request('GET', `/calories${params ? '?' + params : ''}`); },
  createCalorie(data) { return this.request('POST', '/calories', data); },
  deleteCalorie(id) { return this.request('DELETE', `/calories/${id}`); },

  // Goals
  getGoals(params = '') { return this.request('GET', `/goals${params ? '?' + params : ''}`); },
  createGoal(data) { return this.request('POST', '/goals', data); },
  updateGoal(id, data) { return this.request('PUT', `/goals/${id}`, data); },
  deleteGoal(id) { return this.request('DELETE', `/goals/${id}`); },

  // Water
  getWaterToday() { return this.request('GET', '/water/today'); },
  getWater(params = '') { return this.request('GET', `/water${params ? '?' + params : ''}`); },
  addWater(data) { return this.request('POST', '/water', data); },
  deleteWater(id) { return this.request('DELETE', `/water/${id}`); },

  // Stats
  getWeeklyStats() { return this.request('GET', '/stats/weekly'); },
  getStreak() { return this.request('GET', '/stats/streak'); },

  // Activity
  getActivity(limit = 10) { return this.request('GET', `/activity?limit=${limit}`); },

  // Quote
  getQuote() { return this.request('GET', '/quote', null, false); },
};
