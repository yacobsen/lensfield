# Lensfield

Mobile AI for field-service technicians.

Lensfield turns equipment photos and technician notes into structured service reports — including equipment identification, risk flags, diagnostic context, recommended next steps, parts information, billable notes, and a customer-ready summary.

It’s built mobile-first for technicians working in HVAC, plumbing, electrical, and other field-service environments.

**Live app:** [lensfield.co](https://lensfield.co)

---

## What it does

- **Analyze equipment from photos** — identify equipment, read labels, surface visible issues, and pull out useful service context
- **Generate structured reports** — organize findings into risk level, diagnostic context, possible causes, recommended actions, parts, and billable notes
- **Create customer-ready summaries** — turn technician findings into clear, plain-English documentation
- **Work from any phone** — mobile-first PWA with no native app install required

---

## How it works

1. A technician takes a photo of the equipment
2. They add any notes or job context
3. Lensfield sends the job to the backend for AI analysis
4. The result comes back as a structured field-service report
5. The technician can review the findings and use the customer-facing summary

---

## Architecture

| Layer | Technology |
| --- | --- |
| Frontend | Vite PWA deployed on Vercel |
| Backend | Node.js / Express deployed on Railway |
| AI | Anthropic Claude |
| Production frontend | [lensfield.co](https://lensfield.co) |
| Production API | `api.lensfield.co` |
| Version control | GitHub with automated deployments |

---

## Why I built it

Field-service technicians can finish the physical work and still have a lot of documentation left to do. Job notes, equipment details, parts research, internal writeups, and customer summaries all add time after the actual service work is finished.

Most field-service platforms are built to store and manage that information once it exists. Lensfield is focused on the step before that: helping technicians turn what they see and say in the field into useful documentation while they’re still on the job.

The initial focus is HVAC, plumbing, and electrical service, but the same workflow can apply anywhere visual inspection and documentation happen together.
