# AI DevOps Copilot — FastAPI Backend Foundation

Production-grade asynchronous Python 3.13 backend for the **AI DevOps Copilot** platform. Built following Clean Architecture principles, Repository Pattern, Service Layer, and FastAPI REST API standards.

---

## 🏗️ Architecture Overview

```text
backend/
├── app/
│   ├── api/             # Versioned REST Controllers (v1)
│   ├── auth/            # JWT Token handling & Auth dependencies
│   ├── config/          # Pydantic Settings configuration management
│   ├── database/        # Async SQLAlchemy 2.0 & Redis session factories
│   ├── integrations/    # Integrations (Jenkins, GitHub, Prometheus, Docker)
│   ├── middleware/      # Logging, Rate limiting & Global Exception handling
│   ├── models/          # SQLAlchemy 2.0 ORM Entities (PostgreSQL)
│   ├── repositories/    # Async Repository Pattern CRUD layer
│   ├── schemas/         # Pydantic v2 DTOs and Response Wrappers
│   ├── services/        # Business Domain Service Layer
│   ├── utils/           # Structlog JSON structured logging
│   └── workers/         # Celery task queue & worker configurations
├── alembic/             # Database migrations
├── Dockerfile           # Multi-stage container build
├── docker-compose.yml   # Multi-container stack (API, PostgreSQL, Redis, Worker)
└── pyproject.toml       # Python 3.13 package specs
```

---

## 🚀 Quickstart with Docker Compose

To boot up the complete environment (FastAPI server, PostgreSQL 16, Redis 7, Celery Worker):

```bash
cd backend
docker-compose up --build
```

- **Interactive API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Liveness Probe**: `GET /api/v1/health/liveness`
- **Readiness Probe**: `GET /api/v1/health/readiness`
- **Prometheus Metrics**: `GET /api/v1/metrics`

---

## 🛠️ Local Development (Without Docker)

1. **Setup Python 3.13 virtual environment**:
   ```bash
   python3.13 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` from project root or export local environment variables.

3. **Run Database Migrations**:
   ```bash
   alembic upgrade head
   ```

4. **Launch Dev Server**:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

---

## 🔑 Key Features & Design Patterns

1. **Clean Architecture & Dependency Injection**:
   - Controllers handle HTTP routing only (`app/api/v1/endpoints`)
   - Services contain domain logic (`app/services`)
   - Repositories encapsulate database queries (`app/repositories`)

2. **Pydantic Settings**:
   Type-safe configuration management loaded dynamically from `.env` and system environment variables.

3. **Structured JSON Logging**:
   `structlog` integration producing context-enriched JSON logs with correlation IDs (`X-Request-ID`).

4. **Resilience & Protection**:
   - Sliding-window Redis rate limiting middleware (`app/middleware/rate_limit.py`)
   - Global exception handling returning RFC-compliant error details
