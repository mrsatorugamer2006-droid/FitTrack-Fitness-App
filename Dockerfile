FROM python:3.12-slim
WORKDIR /app
COPY Fit_tracker-main/backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY Fit_tracker-main/backend/ ./backend/
COPY Fit_tracker-main/frontend/ ./frontend/
WORKDIR /app/backend
ENV PYTHONPATH=/app/backend
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-8000} 'app:create_app()'"]
