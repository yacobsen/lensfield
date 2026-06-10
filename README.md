# FieldTech AI

Mobile AI tool for field service technicians — HVAC, plumbing, electrical, and more.

Photograph equipment, add a note, get back a structured report: risk level, visual 
diagnosis, recommended actions, parts list with part numbers, billable notes, and a 
customer-ready summary. No app install, works on any phone.

Built for owner-operated field service companies (5–30 employees).

**Live app:** [field-tech-agent.vercel.app](https://field-tech-agent.vercel.app)

---

## What it does

- **Photo analysis** via Claude Vision API — identifies equipment, spots damage, reads labels
- **Structured output** — risk level, diagnosis, possible causes, parts list with part numbers, billable notes, equipment ID with warranty status
- **Customer report** — plain-English summary ready to send on the spot
- **Mobile-first PWA** — no install required, runs in the browser on any device

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

Talking to techs and ops managers, the same complaint kept coming up: documentation 
takes longer than the job. Writing up notes, looking up part numbers, drafting something 
coherent for the customer — that's 20-30 minutes per call, every call.

The platforms they use (ServiceTitan, Jobber, etc.) are good at storing what happened. 
None of them tell you what to do about it. FieldTech sits on top of whatever they're 
already running and handles the writeup automatically.

Started with HVAC, plumbing, and electrical. The same workflow applies to auto repair, 
medical equipment servicing, industrial maintenance — anywhere a tech is standing in 
front of a broken thing and needs to document it fast.

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
