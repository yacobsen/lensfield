# Field Tech Agent

AI-powered field technician reporting tool — mobile PWA + Express API.

## Structure

```
field-tech-agent/
├── api/                     Express API (port 3001)
│   ├── .env.example         Copy to .env and add your key
│   └── src/index.js         POST /analyze — MOCK or REAL mode
└── apps/
    └── mobile-web/          Vite PWA (port 5173)
        ├── index.html
        ├── src/main.js      Camera, note, history, copy, export
        └── src/style.css    Dark theme + print styles
```

---

## Run locally (2 terminals)

### Terminal 1 — API

```bash
cd api
npm install
npm run dev
```

Verify: `curl http://localhost:3001/health`
Expected: `{"status":"ok","mode":"MOCK"}`

### Terminal 2 — Mobile web

```bash
cd apps/mobile-web
npm install
npm run dev -- --host   # --host exposes on local network for phone testing
```

Open on desktop: http://localhost:5173
Open on phone: http://<your-local-ip>:5173

---

## Modes

### MOCK mode (default — no key needed)

The API runs in MOCK mode when `ANTHROPIC_API_KEY` is not set.
Returns one of 4 realistic canned responses, rotated by note length.
The phone demo works fully in this mode.

### REAL mode (Claude AI)

1. Copy the env template:
   ```bash
   cp api/.env.example api/.env
   ```
2. Edit `api/.env` and add your key:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. Restart the API. You'll see `[startup] MODE=REAL` in the console.

In REAL mode the API calls `claude-sonnet-4-6` with the note + optional photo.
If Claude's response can't be parsed after one retry, a safe fallback is returned.

---

## API reference

### `POST /analyze`

**Request:** `multipart/form-data`
| Field | Type | Required |
|---|---|---|
| `note` | string | yes |
| `photo` | file (image/*) | no |

**Response schema:**
```json
{
  "risk_level": "LOW | MEDIUM | HIGH",
  "summary": "string",
  "category": "hvac | electrical | plumbing | structural | general",
  "recommended_actions": ["string"],
  "follow_up_required": true,
  "estimated_resolution": "string",
  "parts_materials": ["string"],
  "hazards": ["string"],
  "confidence": 0.92,
  "meta": {
    "model": "claude-sonnet-4-6 | mock-v1",
    "photo_included": true,
    "analyzed_at": "2026-02-24T00:00:00.000Z"
  }
}
```

---

## Features

| Feature | How |
|---|---|
| Camera capture | Native `<input capture="environment">` — works on iOS + Android |
| Field note | Textarea, required before submit |
| AI analysis | POST to `/analyze`, returns structured JSON |
| Report history | Last 25 reports saved to `localStorage` (`fta_reports`) |
| Load past report | Tap any history card to load it into the result view |
| Clear history | "Clear all" button with confirmation prompt |
| Copy JSON | Copies full analysis payload to clipboard |
| Copy Summary | Copies formatted plain-text (risk, hazards, actions) |
| Export PDF | `window.print()` — clean print layout, all controls hidden |
| PWA install | Add to home screen on iOS/Android via browser |

---

## Export PDF

1. Run an analysis (or load one from history).
2. Tap **Export PDF**.
3. In the print dialog, choose **Save as PDF**.

The printed output includes: header, timestamp, risk badge, category, summary,
hazards, recommended actions, parts/materials, follow-up, and estimated resolution.

---

## Production deployment (placeholders)

### Frontend → Vercel

```bash
# Set in Vercel dashboard: VITE_API_BASE_URL=https://your-api.render.com
cd apps/mobile-web && vercel deploy
```

### API → Render

- Build: `npm install` / Start: `npm start`
- Add env var: `ANTHROPIC_API_KEY=sk-ant-...`

> Deployment configs not yet committed. Add when ready to ship.
