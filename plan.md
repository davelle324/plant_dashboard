# Plant Care SaaS (Solo Developer Project Spec)

## Overview

Plant Care SaaS is a lightweight full-stack web application that helps users track, manage, and improve the health of their plants. The system functions as a plant “operating system” with logging, reminders, analytics, and optional AI assistance.

The project is designed to demonstrate:
- Full-stack engineering (Next.js + FastAPI)
- Relational database design
- SaaS architecture fundamentals
- Background jobs / scheduling
- Optional AI integration (local LLM + RAG)
- Clean UI dashboard design

---

## Core Goals

Build a production-style SaaS application that allows users to:

- Manage a collection of plants
- Log watering and care activities
- Track plant health over time
- Receive reminders for plant care
- View dashboards and growth history
- Optionally ask an AI assistant about plant health

---

## Tech Stack

### Frontend
- Next.js (App Router)
- TypeScript
- TailwindCSS (optional but recommended)

### Backend
- FastAPI (Python)
- SQLAlchemy ORM
- Pydantic schemas

### Database
- PostgreSQL (production)
- SQLite (local dev fallback)

### Background Jobs
- Celery + Redis (or simple cron for MVP)

### AI Layer (optional)
- Local LLM via Ollama
- Llama 3.1 8B Instruct or Qwen 8B
- Embeddings via `nomic-embed-text`

### Deployment
- Frontend: Vercel
- Backend: Render / Fly.io
- DB: Neon / Supabase Postgres

---

## Core Features (MVP)

### 1. User Authentication
- Email/password or OAuth (Clerk recommended)
- Each user has isolated plant data (multi-tenant design)

---

### 2. Plant Management

Each plant includes:
- id
- name
- species/type
- location (e.g., windowsill, hydroponic setup)
- watering_interval_days
- created_at

Features:
- Create plant
- Edit plant
- Delete plant
- View plant dashboard

---

### 3. Care Logging System

Users can log events:

Types:
- watering
- pruning
- fertilizing
- notes

Each log contains:
- id
- plant_id
- type
- note
- timestamp

---

### 4. Dashboard

For each plant:
- last watered date
- days since last care
- care history timeline
- simple health indicator (manual or computed)

---

### 5. Reminder System

Backend logic:
- calculate overdue plants based on watering_interval_days
- trigger reminders

MVP implementation:
- simple scheduled job (daily cron)
- later upgrade: Celery + Redis queue

---

## Optional AI Features (Phase 2)

### Plant Assistant (LLM)

Users can ask:
- "Why are my basil leaves turning yellow?"
- "Should I water this plant today?"
- "Summarize my plant’s health history"

Implementation:
- Send plant logs + metadata to LLM context
- Generate structured response

Model:
- Llama 3.1 8B Instruct or Qwen 8B via Ollama

---

### Embedding-Based Plant Memory (RAG)

Store all plant logs as embeddings:
- watering notes
- issues
- observations

Use:
- `nomic-embed-text`

Vector DB:
- ChromaDB or FAISS

Capabilities:
- semantic search across plant history
- query: “has this plant ever had drooping leaves?”

---

## System Architecture


---

## API Design (FastAPI)

### Plants
- GET /plants
- POST /plants
- GET /plants/{id}
- PUT /plants/{id}
- DELETE /plants/{id}

### Logs
- GET /plants/{id}/logs
- POST /logs

### Reminders
- GET /reminders
- background job runs daily

### AI (optional)
- POST /ai/ask
  - input: plant_id + question
  - output: response

---

## Frontend Pages (Next.js)

### Routes

- `/` → landing page
- `/dashboard` → all plants overview
- `/plant/[id]` → plant detail view
- `/plant/[id]/logs` → care history
- `/settings` → user settings

---

## UI Components

- PlantCard
- PlantGrid
- LogTimeline
- AddPlantModal
- AddLogModal
- ReminderBanner
- AIChatPanel (optional)

---

## Data Model (SQL)

### users
- id
- email
- password_hash

### plants
- id
- user_id
- name
- species
- location
- watering_interval_days

### logs
- id
- plant_id
- type
- note
- created_at

---

## Non-Functional Requirements

- Multi-tenant safe (user isolation required)
- API must validate all inputs (Pydantic)
- Fast response time (<200ms typical queries)
- Clean separation between frontend and backend
- Easily deployable via Docker (optional but recommended)

---

## Stretch Goals

- ✅ Photo upload per plant (growth tracking)
- ✅ Graphs (watering frequency, health trends — care activity chart + analytics trend chart)
- ✅ Plant “health score” algorithm (0–100 based on watering adherence)
- ✅ Dark mode
- Email notifications (SendGrid) — reminder data ready, just needs a cron + sender
- Mobile-friendly UI — functional but untested at phone widths
- Offline support (PWA)

---

## Success Criteria

This project is successful if:

- A user can fully manage plants end-to-end
- Care logs persist and display correctly
- Reminders are generated automatically
- UI is clean and usable
- System is deployable as a real SaaS

---

## Notes for Implementation

- Start with MVP only (plants + logs + dashboard)
- Do NOT build AI or embeddings first
- Prioritize data model correctness
- Keep backend simple and explicit
- Build UI only after API is stable
- Treat everything as production-ready from day 1 (schemas, validation, structure)