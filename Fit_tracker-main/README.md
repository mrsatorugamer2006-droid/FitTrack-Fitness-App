# FitTrack — Fitness Tracking Application

A premium fitness tracking dashboard built with **Flask** (Python) + **HTML/CSS/JavaScript**.

## Features

- 🔐 **JWT Authentication** — Secure signup/login
- 💪 **Workout Logger** — Log, view, and delete workouts (CRUD)
- 🍎 **Calorie Tracker** — Track daily meals grouped by date
- ⚖️ **BMI Calculator** — Instant BMI calculation with visual scale
- 🎯 **Goal Management** — Set fitness goals with progress tracking
- 📈 **Weekly Charts** — 4 interactive Chart.js visualizations
- 🌙 **Dark Theme** — Premium dark UI with glassmorphism design
- 📱 **Responsive** — Works on desktop & mobile

## Tech Stack

| Component  | Technology           |
|------------|----------------------|
| Frontend   | HTML, CSS, JavaScript |
| Backend    | Python Flask         |
| Database   | SQLite (SQLAlchemy)  |
| Auth       | JWT (PyJWT)          |
| Charts     | Chart.js 4           |
| Fonts      | Google Fonts (Inter) |

## Quick Start

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Run the Server

```bash
cd backend
python app.py
```

The app starts at **http://localhost:5000**

### 3. Open the App

Navigate to [http://localhost:5000](http://localhost:5000) in your browser.

## Project Structure

```
fittrack/
├── backend/
│   ├── app.py              # Flask app factory + routes
│   ├── config.py           # Configuration
│   ├── models.py           # SQLAlchemy models
│   ├── auth.py             # JWT middleware
│   ├── requirements.txt    # Python dependencies
│   └── routes/
│       ├── __init__.py
│       ├── auth_routes.py  # Signup/Login
│       ├── workout_routes.py
│       ├── calorie_routes.py
│       └── goal_routes.py
├── frontend/
│   ├── index.html          # SPA shell
│   ├── css/
│   │   └── styles.css      # Premium dark theme
│   └── js/
│       ├── api.js           # API client
│       ├── app.js           # Router & auth
│       ├── dashboard.js     # Dashboard view
│       ├── workouts.js      # Workout CRUD
│       ├── calories.js      # Calorie tracking
│       ├── bmi.js           # BMI calculator
│       ├── goals.js         # Goal management
│       └── charts.js        # Chart.js charts
└── README.md
```

## API Endpoints

| Method | Endpoint             | Auth | Description          |
|--------|----------------------|------|----------------------|
| POST   | /api/auth/signup     | ❌   | Register user        |
| POST   | /api/auth/login      | ❌   | Login, get JWT       |
| GET    | /api/user/profile    | ✅   | Get profile          |
| PUT    | /api/user/profile    | ✅   | Update profile       |
| GET    | /api/workouts        | ✅   | List workouts        |
| POST   | /api/workouts        | ✅   | Log workout          |
| PUT    | /api/workouts/:id    | ✅   | Update workout       |
| DELETE | /api/workouts/:id    | ✅   | Delete workout       |
| GET    | /api/calories        | ✅   | List calorie entries |
| POST   | /api/calories        | ✅   | Log calorie entry    |
| DELETE | /api/calories/:id    | ✅   | Delete calorie entry |
| GET    | /api/goals           | ✅   | List goals           |
| POST   | /api/goals           | ✅   | Create goal          |
| PUT    | /api/goals/:id       | ✅   | Update goal          |
| DELETE | /api/goals/:id       | ✅   | Delete goal          |
| GET    | /api/stats/weekly    | ✅   | Weekly stats         |
