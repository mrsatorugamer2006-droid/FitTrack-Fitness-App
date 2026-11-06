/**
 * FitTrack v2 — Dashboard Module
 * Loads stats, quote, streak, activity feed, and renders charts.
 */
const Dashboard = {
  charts: {},

  async load() {
    // Load everything in parallel
    Promise.all([
      this.loadStats(),
      this.loadQuote(),
      this.loadStreak(),
      this.loadActivity(),
      this.loadWaterStat(),
    ]);
  },

  async loadStats() {
    try {
      const stats = await Api.getWeeklyStats();
      // Animate counters
      App.animateCounter('stat-workouts', stats.summary.total_workouts);
      App.animateCounter('stat-minutes', stats.summary.total_minutes);
      App.animateCounter('stat-burned', stats.summary.total_calories_burned);
      App.animateCounter('stat-goals', stats.summary.active_goals);
      this.renderCharts(stats.days);
    } catch (err) {
      console.error('Dashboard stats error:', err);
    }
  },

  async loadQuote() {
    try {
      const quote = await Api.getQuote();
      document.getElementById('quote-text').textContent = `"${quote.text}"`;
      document.getElementById('quote-author').textContent = `— ${quote.author}`;
    } catch (err) {
      document.getElementById('quote-text').textContent = '"The only bad workout is the one that didn\'t happen."';
      document.getElementById('quote-author').textContent = '— Unknown';
    }
  },

  async loadStreak() {
    try {
      const streak = await Api.getStreak();
      App.animateCounter('streak-count', streak.current_streak);
      App.animateCounter('stat-streak', streak.current_streak);
      document.getElementById('streak-best').textContent = `Best: ${streak.best_streak} days`;

      // Update sub text
      const sub = document.getElementById('stat-streak-sub');
      if (streak.current_streak >= 7) {
        sub.textContent = '🔥 On fire!';
      } else if (streak.current_streak >= 3) {
        sub.textContent = '💪 Keep going!';
      } else if (streak.current_streak > 0) {
        sub.textContent = 'Great start!';
      } else {
        sub.textContent = 'Start today!';
      }
    } catch (err) {
      console.error('Streak load error:', err);
    }
  },

  async loadWaterStat() {
    try {
      const water = await Api.getWaterToday();
      App.animateCounter('stat-water', water.total_ml);
      const sub = document.getElementById('stat-water-sub');
      sub.textContent = `${water.percentage}% of goal`;
    } catch (err) {
      console.error('Water stat error:', err);
    }
  },

  async loadActivity() {
    const container = document.getElementById('activity-feed');
    try {
      const activities = await Api.getActivity(8);

      if (activities.length === 0) {
        container.innerHTML = `
          <div class="empty-state" style="padding: 20px;">
            <div class="icon" style="font-size: 32px;">📜</div>
            <p>No activity yet. Start logging!</p>
          </div>`;
        return;
      }

      container.innerHTML = `
        <div class="activity-timeline">
          ${activities.map(a => `
            <div class="activity-item">
              <span class="activity-icon">${a.icon}</span>
              <span class="activity-title">${a.title}</span>
              <div class="activity-detail">${a.detail}</div>
              <div class="activity-time">${App.timeAgo(a.date)}</div>
            </div>
          `).join('')}
        </div>`;
    } catch (err) {
      container.innerHTML = `<p style="color: var(--text-muted); padding: 12px;">Could not load activity.</p>`;
    }
  },

  renderCharts(days) {
    const labels = days.map(d => d.day);

    // Workout Duration
    const durationCtx = document.getElementById('chart-workout-duration');
    if (this.charts.duration) this.charts.duration.destroy();
    this.charts.duration = new Chart(durationCtx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Minutes',
          data: days.map(d => d.workout_minutes),
          backgroundColor: createGradientVertical(durationCtx, '#6366f1', '#a855f7'),
          borderRadius: 8,
          borderSkipped: false,
          barThickness: 28,
        }]
      },
      options: chartOptions('Duration (min)')
    });

    // Calories
    const calCtx = document.getElementById('chart-calories');
    if (this.charts.calories) this.charts.calories.destroy();
    this.charts.calories = new Chart(calCtx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Consumed',
            data: days.map(d => d.calories_consumed),
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            fill: true, tension: 0.4,
            pointBackgroundColor: '#f59e0b',
            pointBorderColor: '#0a0e1a',
            pointBorderWidth: 2,
            pointRadius: 4, pointHoverRadius: 6,
          },
          {
            label: 'Burned',
            data: days.map(d => d.calories_burned),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            fill: true, tension: 0.4,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#0a0e1a',
            pointBorderWidth: 2,
            pointRadius: 4, pointHoverRadius: 6,
          }
        ]
      },
      options: chartOptions('Calories')
    });
  }
};

// ── Chart Helpers ──────────────────────────────────────────────
function chartOptions(yLabel = '') {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 1000, easing: 'easeOutCubic' },
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 12 },
          usePointStyle: true, pointStyle: 'circle', padding: 16,
        }
      },
      tooltip: {
        backgroundColor: '#1a1f35',
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        cornerRadius: 10,
        padding: 14,
        bodyFont: { family: 'Inter' },
        titleFont: { family: 'Inter', weight: '600' },
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.03)' },
        ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.03)' },
        ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } },
        title: {
          display: !!yLabel,
          text: yLabel,
          color: '#64748b',
          font: { family: 'Inter', size: 12 },
        },
        beginAtZero: true,
      }
    }
  };
}

function createGradientVertical(canvas, color1, color2) {
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, color1 + 'cc');
  gradient.addColorStop(1, color2 + '33');
  return gradient;
}
