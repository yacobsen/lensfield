# FieldTech AI

AI-powered field intelligence tool for HVAC, plumbing, and electrical technicians.

Technicians photograph equipment, add a voice or text note, and get back a structured AI report in seconds — risk level, visual diagnosis, recommended actions, parts list with part numbers, billable notes, and a plain-English customer summary.

Built for owner-operated field service companies (5–30 employees) that run on ServiceTitan or pen-and-paper.

**Live app:** [field-tech-agent.vercel.app](https://field-tech-agent.vercel.app)

---

## What it does

- **Photo analysis** via Claude Vision API — identifies equipment, spots damage, reads labels
- **Structured output** — risk level, diagnosis, possible causes, parts list with part numbers, billable notes, equipment ID with warranty status
- **Customer report** — plain-English summary generated automatically, ready to send
- **Mobile-first PWA** — works from any phone, no install required

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Vite PWA — deployed on Vercel |
| Backend | Node.js / Express — deployed on Railway |
| AI | Claude Vision API (claude-sonnet) |
| Version control | GitHub with auto-deploy |

---

## Why I built this

Field service techs spend 20–30 minutes per job writing up notes, pulling part numbers, and drafting customer summaries. This compresses that to under 60 seconds.

ServiceTitan and competitors store job data — they don't interpret it. FieldTech is the interpretation layer: point a phone at a unit, get a complete job report back before you've put the camera away.

Secondary vertical identified: auto repair shops. Same pain, same workflow, 2–3 hour reskin.

---

## Running locally

```bash
# Clone the repo
git clone https://github.com/yacobsen/field-tech-agent.git
cd field-tech-agent

# Backend
cd api
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
npm install
npm run dev

# Frontend (new terminal)
cd apps/mobile-web
npm install
npm run dev
```

Backend runs on `localhost:3001`, frontend on `localhost:5173`.

