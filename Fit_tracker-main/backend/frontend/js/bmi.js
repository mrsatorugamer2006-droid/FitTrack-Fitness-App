/**
 * FitTrack — BMI Calculator Module
 * Client-side BMI computation with visual scale.
 */
const BMI = {
  initialized: false,

  init() {
    if (!this.initialized) {
      this.bindForm();
      this.initialized = true;
    }

    // Pre-fill from user profile if available
    const user = JSON.parse(localStorage.getItem('fittrack_user') || '{}');
    if (user.height) document.getElementById('bmi-height').value = user.height;
    if (user.weight) document.getElementById('bmi-weight').value = user.weight;

    // Auto-calculate if both values exist
    if (user.height && user.weight) {
      this.calculate(user.height, user.weight);
    }
  },

  bindForm() {
    document.getElementById('bmi-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const height = parseFloat(document.getElementById('bmi-height').value);
      const weight = parseFloat(document.getElementById('bmi-weight').value);

      if (!height || !weight || height <= 0 || weight <= 0) {
        App.showToast('Please enter valid height and weight', 'error');
        return;
      }

      this.calculate(height, weight);
    });
  },

  calculate(heightCm, weightKg) {
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    const bmiRounded = Math.round(bmi * 10) / 10;

    let category, cssClass, range;
    if (bmi < 18.5) {
      category = 'Underweight';
      cssClass = 'underweight';
      range = 'BMI < 18.5';
    } else if (bmi < 25) {
      category = 'Normal Weight';
      cssClass = 'normal';
      range = 'BMI 18.5 – 24.9';
    } else if (bmi < 30) {
      category = 'Overweight';
      cssClass = 'overweight';
      range = 'BMI 25.0 – 29.9';
    } else {
      category = 'Obese';
      cssClass = 'obese';
      range = 'BMI ≥ 30.0';
    }

    const resultEl = document.getElementById('bmi-result');
    resultEl.style.display = 'block';
    resultEl.className = `bmi-result ${cssClass}`;
    resultEl.innerHTML = `
      <div class="bmi-value">${bmiRounded}</div>
      <div class="bmi-category">${category}</div>
      <div class="bmi-range">${range}</div>
      <div class="bmi-scale">
        <div class="bmi-scale-segment underweight" title="Underweight: <18.5"></div>
        <div class="bmi-scale-segment normal" title="Normal: 18.5-24.9"></div>
        <div class="bmi-scale-segment overweight" title="Overweight: 25-29.9"></div>
        <div class="bmi-scale-segment obese" title="Obese: 30+"></div>
      </div>
      <div class="bmi-labels">
        <span>Underweight</span>
        <span>Normal</span>
        <span>Overweight</span>
        <span>Obese</span>
      </div>
      <p style="margin-top: 16px; font-size: 13px; color: var(--text-muted);">
        Height: ${heightCm} cm · Weight: ${weightKg} kg
      </p>
    `;

    // Save to profile
    Api.updateProfile({ height: heightCm, weight: weightKg }).catch(() => {});
  }
};
