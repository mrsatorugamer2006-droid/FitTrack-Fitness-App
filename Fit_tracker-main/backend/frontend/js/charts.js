/**
 * FitTrack v2 — Charts Module (Weekly Progress)
 * 4 charts: workout minutes, calories comparison, workout count, water intake.
 */
const Charts = {
  instances: {},

  async loadProgress() {
    try {
      const stats = await Api.getWeeklyStats();
      const days = stats.days;
      const labels = days.map(d => d.day);

      this.renderMinutesChart(labels, days);
      this.renderCaloriesCompare(labels, days);
      this.renderCountChart(labels, days);
      this.renderWaterChart(labels, days);
    } catch (err) {
      console.error('Progress charts error:', err);
    }
  },

  destroyChart(name) {
    if (this.instances[name]) {
      this.instances[name].destroy();
      delete this.instances[name];
    }
  },

  renderMinutesChart(labels, days) {
    this.destroyChart('minutes');
    const ctx = document.getElementById('chart-progress-minutes');
    this.instances.minutes = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Minutes',
          data: days.map(d => d.workout_minutes),
          backgroundColor: createGradientVertical(ctx, '#6366f1', '#a855f7'),
          borderRadius: 8,
          borderSkipped: false,
          barThickness: 28,
        }]
      },
      options: chartOptions('Minutes')
    });
  },

  renderCaloriesCompare(labels, days) {
    this.destroyChart('caloriesCompare');
    const ctx = document.getElementById('chart-progress-calories');
    this.instances.caloriesCompare = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Consumed',
            data: days.map(d => d.calories_consumed),
            backgroundColor: 'rgba(245, 158, 11, 0.6)',
            borderRadius: 6, borderSkipped: false,
          },
          {
            label: 'Burned',
            data: days.map(d => d.calories_burned),
            backgroundColor: 'rgba(16, 185, 129, 0.6)',
            borderRadius: 6, borderSkipped: false,
          }
        ]
      },
      options: chartOptions('Calories')
    });
  },

  renderCountChart(labels, days) {
    this.destroyChart('count');
    const ctx = document.getElementById('chart-progress-count');
    this.instances.count = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Workouts',
          data: days.map(d => d.workout_count),
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6, 182, 212, 0.08)',
          fill: true, tension: 0.4,
          pointBackgroundColor: '#06b6d4',
          pointBorderColor: '#0a0e1a',
          pointBorderWidth: 2,
          pointRadius: 5, pointHoverRadius: 7,
        }]
      },
      options: {
        ...chartOptions('Count'),
        scales: {
          ...chartOptions('Count').scales,
          y: { ...chartOptions('Count').scales.y, ticks: { ...chartOptions('Count').scales.y.ticks, stepSize: 1 } }
        }
      }
    });
  },

  renderWaterChart(labels, days) {
    this.destroyChart('water');
    const ctx = document.getElementById('chart-progress-water');
    this.instances.water = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Water (ml)',
          data: days.map(d => d.water_ml),
          backgroundColor: createGradientVertical(ctx, '#0ea5e9', '#7dd3fc'),
          borderRadius: 8,
          borderSkipped: false,
          barThickness: 28,
        }]
      },
      options: {
        ...chartOptions('ml'),
        plugins: {
          ...chartOptions('ml').plugins,
          annotation: {
            annotations: {
              goal: {
                type: 'line',
                yMin: 2500, yMax: 2500,
                borderColor: 'rgba(56, 189, 248, 0.3)',
                borderWidth: 2,
                borderDash: [6, 4],
                label: {
                  display: true,
                  content: 'Goal: 2500ml',
                  color: '#94a3b8',
                  font: { size: 11 },
                }
              }
            }
          }
        }
      }
    });
  },
};
