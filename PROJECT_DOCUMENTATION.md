# 🚀 AI DevOps Copilot Control Plane — Comprehensive Documentation

> **Project Name**: DevOps-AI (AI-Powered Enterprise DevOps Copilot & Automation Control Plane)  
> **Repository**: [github.com/TusharGupta2820/DevOps-AI](https://github.com/TusharGupta2820/DevOps-AI)  
> **Architecture**: Full-Stack Monorepo (React 19 + Express BFF + FastAPI Python + PostgreSQL + Jenkins REST API + Gemini AI)

---

## 📋 Table of Contents
1. [Project Overview](#-project-overview)
2. [Key Features & Modules](#-key-features--modules)
3. [Technology Stack & Architecture](#-technology-stack--architecture)
4. [Jenkins CI/CD Pipeline Integration](#-jenkins-cicd-pipeline-integration)
5. [FastAPI Backend & Database Schema](#-fastapi-backend--database-schema)
6. [AI Copilot & Gemini SRE Assistant](#-ai-copilot--gemini-sre-assistant)
7. [Security & Role-Based Access Control (RBAC)](#-security--role-based-access-control-rbac)
8. [Local Setup & Installation Guide](#-local-setup--installation-guide)
9. [Vercel Deployment Guide](#-vercel-deployment-guide)
10. [Faculty Presentation Cheat Sheet](#-faculty-presentation-cheat-sheet)

---

## 🎯 Project Overview

**DevOps-AI** is an enterprise-grade AI-assisted Cloud Infrastructure and CI/CD Automation Control Plane. It unifies server telemetry, container orchestration, automated Jenkins build pipelines, GitHub SCM webhooks, and AI-driven Site Reliability Engineering (SRE) root cause analysis into a single unified control dashboard.

### Core Value Proposition:
- **Automated CI/CD Observability**: Live tracking of 7-stage Jenkins pipelines with simulated streaming terminal logs.
- **AI-Powered SRE Copilot**: Leverages **Google Gemini AI** to generate instant Root Cause Analysis (RCA) reports from error stack traces.
- **Production Audit Trail**: Complete database persistence of all build executions, infrastructure changes, and user access with RBAC enforcement.
- **100% Responsive UI**: Clean, light-theme responsive design optimized for desktop, tablet, and mobile devices.

---

## ✨ Key Features & Modules

### 1. 📊 Interactive DevOps Dashboard (`/dashboard`)
- **Real-Time Health Gauges**: Visual circular SVG meters for CPU, RAM, Disk I/O, and Network throughput.
- **Top Metric Cards**: Server Health (%), Active Containers (142), In-Progress Builds (8), Today's Deployments (24), Failed Pipelines (1), and Response Time (42ms).
- **Active Pipeline Timeline**: Live step-by-step progress tracking across Source, Build, Test & Scan, and Deploy stages.
- **Recent Deployments Table**: Filterable by environment (`ALL`, `PROD`, `STG`, `DEV`) with detail modal and retry trigger.

### 2. ⚡ Jenkins CI/CD Automation Center (`/cicd`)
- **Visual 7-Stage Flowchart**: Interactive horizontal stage diagram (`Checkout SCM` → `Install & Lint` → `Unit Tests` → `Docker Build` → `Security Scan` → `Deploy K8s` → `Notify GitHub`).
- **Live Terminal Console**: Auto-scrolling, colorized build log execution stream.
- **Declarative Jenkinsfile Viewer**: Syntax-highlighted **Pipeline-as-Code** viewer showing exact shell commands (`sh 'trivy...'`, `sh 'kubectl...'`).
- **Build Execution History**: Persistent table with artifact tracking, commit SHA links, duration metrics, and **Abort/Re-run** controls.
- **REST API Telemetry**: Embedded `curl` request generator showcasing FastAPI `/api/v1/jenkins-builds` integration.

### 3. 🤖 AI DevOps Assistant (`/ai-assistant`)
- **SRE Chatbot**: Powered by Google Gemini AI to assist engineers with Kubernetes troubleshooting, Docker configuration, and log diagnostics.
- **Automated RCA Generator**: Generates structured Markdown Root Cause Analysis reports from incident logs.
- **Infrastructure Topology**: Visual cluster architecture modal showing nodes, ingress controllers, and microservice links.

### 4. 🐙 GitHub SCM Integration (`/github`)
- **Repository Telemetry**: Tracks default branch protection, star/fork counts, and build status checks.
- **Pull Request Hub**: Displays active PRs, review statuses, and passing/failing CI check badges.
- **Live Commit Feed**: Chronological commit stream with author attribution and SHA hashes.
- **Webhook Telemetry Listener**: Terminal display showing incoming GitHub `push` and `status` webhooks processed by the backend.

### 5. 🖥️ Infrastructure & Linux Telemetry (`/servers`, `/monitoring`, `/docker`, `/kubernetes`)
- **Server Inventory**: Node metrics (`prod-server-01`, `10.4.22.105`) with CPU/RAM utilization.
- **Process Management**: Real-time process listing with SIGTERM termination signal controls.
- **Container Registry**: Active Docker containers and Kubernetes pod statuses.

### 6. 🗄️ Database & ERD View (`/database-schema`)
- **PostgreSQL ERD Diagram**: Visual relational schema showing foreign key relationships between `users`, `repositories`, `deployments`, `jenkins_builds`, `audit_logs`, and `refresh_tokens`.

---

## 🏗️ Technology Stack & Architecture

```
                                  USER BROWSER
                                       │
                                       ▼
                     ┌───────────────────────────────────┐
                     │    React 19 + Vite Frontend      │
                     │  Tailwind CSS v4 + Motion UI     │
                     └─────────────────┬─────────────────┘
                                       │
                       HTTP / REST API │ (Port 3004 / Vercel Edge)
                                       ▼
                     ┌───────────────────────────────────┐
                     │   Node.js Express BFF Server     │
                     │   (server.ts / Gemini AI SDK)     │
                     └─────────────────┬─────────────────┘
                                       │
                                       ├────────────────────────┐
                                       ▼                        ▼
                     ┌───────────────────────────────────┐  ┌───────────────────────┐
                     │    FastAPI Python 3.11 Backend    │  │  Google Gemini AI API │
                     │  (Async SQLAlchemy 2.0 + Pydantic)│  │   (gemini-3.6-flash)  │
                     └─────────────────┬─────────────────┘  └───────────────────────┘
                                       │
                                       ├────────────────────────┐
                                       ▼                        ▼
                     ┌───────────────────────────────────┐  ┌───────────────────────┐
                     │   PostgreSQL Database (AsyncPG)   │  │ Linux Jenkins Server  │
                     │ (jenkins_builds, deployments, etc)│  │ (Port 8080 REST API)  │
                     └───────────────────────────────────┘  └───────────────────────┘
```

| Layer | Component | Technologies Used |
|---|---|---|
| **Frontend UI** | Client Web App | React 19, TypeScript, Vite 6, Tailwind CSS v4, Lucide Icons, Material Symbols |
| **BFF Proxy** | Middle Tier | Node.js, Express, `@google/genai` SDK, `psutil` Python telemetry collector |
| **Backend API** | REST API Layer | Python 3.11+, FastAPI, Uvicorn, Pydantic v2 |
| **Database ORM** | Data Layer | PostgreSQL, Async SQLAlchemy 2.0, AsyncPG, Alembic migrations |
| **CI/CD Automation** | Pipeline Engine | Jenkins REST API (`httpx`), Declarative Jenkinsfile, Docker, Trivy, Kubernetes `kubectl` |

---

## ⚙️ Jenkins CI/CD Pipeline Integration

### How Jenkins Works in This Project:
1. **Trigger**: When a user clicks **"Trigger Jenkins Build Now"** (or pushes to GitHub), the React UI sends a request to the backend.
2. **REST API Call**: The FastAPI service (`JenkinsClient` in [`backend/app/integrations/jenkins.py`](file:///d:/DevOps%20Proj/DevOps-AI/backend/app/integrations/jenkins.py)) sends an async HTTP request to Jenkins:
   - `GET /crumbIssuer/api/json` → Fetches CSRF Crumb header.
   - `POST /job/{name}/buildWithParameters` → Triggers build with `VERSION`, `ENVIRONMENT`, and `COMMIT_HASH`.
3. **Execution**: The Linux Jenkins server runs the Declarative `Jenkinsfile`:
   - Stage 1: `Checkout SCM`
   - Stage 2: `Install & Lint` (`npm ci && eslint .`)
   - Stage 3: `Unit & Integration Tests` (`pytest tests/`)
   - Stage 4: `Build & Push Docker Image` (`docker build`)
   - Stage 5: `Security Scan (Trivy)` (`trivy image ...`)
   - Stage 6: `Deploy to Kubernetes` (`kubectl set image ...`)
   - Stage 7: `Notify GitHub & Record to DevOps-AI DB` (`POST /api/v1/jenkins-builds`)
4. **Audit Logging**: Build status, duration, artifact paths, and logs URL are saved in PostgreSQL table `jenkins_builds`.

---

## 🗄️ FastAPI Backend & Database Schema

The database uses PostgreSQL with 6 primary production tables:

```
  +------------------+         +------------------+         +------------------+
  |      users       |         |   repositories   |         |   deployments    |
  +------------------+         +------------------+         +------------------+
  | id (PK)          |<--------| id (PK)          |<--------| id (PK)          |
  | email            |         | name             |         | service_name     |
  | role (ADMIN, etc)|         | owner_id (FK)    |         | environment      |
  +--------+---------+         +--------+---------+         | status           |
           |                            |                   +--------+---------+
           |                            |                            |
           |                            v                            |
           |                   +------------------+                  |
           +------------------>|  jenkins_builds  |<-----------------+
                               +------------------+
                               | id (PK)          |
                               | job_name         |
                               | build_number     |
                               | status           |
                               | duration_ms      |
                               | repository_id(FK)|
                               | deployment_id(FK)|
                               +------------------+
```

### Backend API Endpoints:
- `GET /api/v1/health` — System health check
- `GET /api/v1/jenkins-builds` — List all Jenkins build records (with `job_name` & `status` query filters)
- `GET /api/v1/jenkins-builds/{id}` — Get single build details
- `POST /api/v1/jenkins-builds` — Record a new build result (Protected: Admin/DevOps)
- `GET /api/v1/deployments` — Paginated deployment stream
- `POST /api/v1/deployments` — Trigger a new deployment
- `POST /api/v1/auth/login` — OAuth2 Password Flow JWT token login

---

## 🤖 AI Copilot & Gemini SRE Assistant

The AI DevOps Copilot is powered by **Google Gemini AI (`gemini-3.6-flash`)**.

### Features:
1. **Interactive SRE Chat**: Answers infrastructure queries, suggests `kubectl` / `docker` / `terraform` commands, and diagnoses active server alerts.
2. **Automated Root Cause Analysis (RCA)**: Accepts stack traces and generates a structured 6-part markdown RCA report including:
   - Incident Overview & Severity
   - Timeline of Events
   - Immediate Mitigation Steps Taken
   - Preventive Action Recommendations
3. **Smart Fallback**: If `GEMINI_API_KEY` is not provided, the application switches to a deterministic SRE fallback response engine, ensuring zero crashes.

---

## 🔐 Security & Role-Based Access Control (RBAC)

The application enforces **3 RBAC Persona Roles**:

| Role | Permissions | Visual Indicator |
|---|---|---|
| **ADMIN** | Full administrative access (create resources, trigger builds, manage users, delete pipelines) | 🔴 Red Badge |
| **DEVOPS_ENGINEER** | Can trigger deployments, re-run builds, update thresholds, run scripts | 🔵 Blue Badge |
| **VIEWER** | Read-only access. Triggering builds displays a permission toast alert | 🟢 Green Badge |

---

## 💻 Local Setup & Installation Guide

### Prerequisites:
- **Node.js**: v18.0 or higher
- **Python**: v3.11 or higher
- **Git**

### Installation Steps:

```powershell
# 1. Clone the Repository
git clone https://github.com/TusharGupta2820/DevOps-AI.git
cd DevOps-AI

# 2. Install Node.js Frontend Dependencies
npm install

# 3. Set Up Python Environment for FastAPI Backend
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt
cd ..

# 4. Create Environment File (.env)
copy .env.example .env

# 5. Start Development Server (Runs Frontend + Express BFF + FastAPI Backend)
npm run dev
```

The application will be accessible at:
- **Frontend App**: `http://localhost:3004` (or `http://localhost:5173`)
- **FastAPI OpenAPI Docs**: `http://localhost:8000/docs`

---

## 🌐 Vercel Deployment Guide

The frontend React application is configured for seamless one-click deployment on **Vercel**.

### Config File ([`vercel.json`](file:///d:/DevOps%20Proj/DevOps-AI/vercel.json)):
```json
{
  "buildCommand": "vite build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Steps to Deploy:
1. Push your repository to GitHub:
   ```powershell
   git add .
   git commit -m "feat: deploy to vercel"
   git push origin main
   ```
2. Log in to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import `TusharGupta2820/DevOps-AI`.
4. (Optional) Add `GEMINI_API_KEY` under Environment Variables.
5. Click **Deploy**. Vercel will build the static bundle into `dist/` and generate a live URL.

---

## 🎓 Faculty Presentation Cheat Sheet

When presenting this project to your faculty, follow this structured demo sequence:

```
1. Dashboard View        ──► Show live CPU/RAM gauges & active pipeline tracker
2. Jenkins CI/CD Module  ──► Click "Trigger Jenkins Build Now" & show live log terminal
3. Stage Flow Tab        ──► Explain the 7 stages (Checkout → Build → Trivy → Deploy)
4. Jenkinsfile Tab       ──► Show the Declarative Pipeline code (Pipeline-as-Code)
5. GitHub SCM Module     ──► Show active pull requests, commit feed & webhook listener
6. SRE AI Assistant      ──► Demonstrate Gemini AI Root Cause Analysis (RCA) report
7. Database & ERD View   ──► Show the PostgreSQL schema & relational architecture
```

---

*Documentation maintained by **Tushar Gupta** · Project Lead & DevOps Architect*
