
# Verdante    
<img width="1024" height="1024" alt="logo-verdante" src="https://github.com/user-attachments/assets/1c007cb3-f919-442d-a977-93476da62e96" />



## 🌍 Overview

Verdante is a carbon‑aware orchestration and simulation platform that helps teams run compute workloads in a greener, cheaper, and more compliant way. It analyzes global cloud regions, energy grids, and regulatory constraints to recommend the optimal execution strategy for any job.

Training a single large AI model can emit 626,000+ lbs of CO₂ — equivalent to the lifetime emissions of five cars. Verdante makes sustainable compute accessible and actionable.

🔗 Live Demo: [https://verdente-upstart-2026.vercel.app](url)

## ✨Features
Carbon Intelligence
-Real‑time grid carbon intensity
-Forecasting for low‑carbon windows
-Automated load shifting

Optimization Engine
-Multi‑region workload routing
-Cost vs. carbon vs. performance tradeoff modeling
-Custom optimization weights (Team & Pro tiers)

Compliance
-Canada/EU data‑residency templates
-Export‑ready sustainability reports
-Audit logs (Pro tier)

Reporting
-CO₂ impact reports
-Cost simulations
-PDF + JSON exports

Automation
-Policy‑based workload routing
-Integration hooks (Pro tier)
-Multi‑project rollups

## How It Works
Verdante acts like a map for cloud computing:

-Define your workload + priorities
-Verdante analyzes global regions & energy grids
-It recommends the optimal route
-It simulates the run and generates audit‑ready reports

# Tech Stack
Layer	Technology
Framework:	Next.js
Language:	TypeScript
Hosting:	Vercel
Data	Static simulation models (backend‑ready architecture)
UI	React components

# Hackathon Stack (FastAPI + Postgres + Next.js)

## Run (Docker)
1) Ensure you have Docker + Docker Compose.
2) Copy `.env.example` to `.env`.
3) Start:
   - `docker compose up --build`

## URLs
- Frontend: http://localhost:${FRONTEND_PORT:-3000}
- Backend:   http://localhost:${BACKEND_PORT:-8000}

## Backend endpoints
- GET /api/health
- GET /api/hello
- GET /api/db/ping

# Project Structure
Code
/public          → static assets
/app or /pages   → routes & UI
/components      → UI components
/lib             → utilities & helpers
/styles          → global styles

# Pricing Tiers
## Free / Developer
1 project, 5 jobs
Basic presets
JSON export

## Team — $19/user/month
Unlimited projects & jobs
Full optimization weights
Compliance templates
PDF + JSON exports

## Team workspace

Pro / FinOps — Custom
Provider/region modeling
Custom compliance policies
Audit logs
Integration hooks
Multi‑project rollups

# Team
Built by a multidisciplinary team from McGill & Concordia:

Aron Segovia — Computer Engineering @ McGill
Robin Glaude — Software Engineering (MSc) + Management @ McGill
Shrin Zoufan — PhD Civil Engineering @ Concordia



# Contributing
Contributions are welcome!
Open an issue or submit a PR — we’ll review quickly.


