require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODE = API_KEY ? "REAL" : "MOCK";

console.log(`\n[startup] MODE=${MODE}\n`);

// Only require the SDK when a key is present — no key, no import
let anthropic = null;
if (MODE === "REAL") {
  const Anthropic = require("@anthropic-ai/sdk");
  anthropic = new Anthropic({ apiKey: API_KEY });
}

const upload = multer({ storage: multer.memoryStorage() });
app.use(cors());
app.use(express.json());

// ── Health ────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", mode: MODE });
});

// ── Mock responses (canonical schema) ────────────────────────
const MOCK_RESPONSES = [
  {
    risk_level: "HIGH",
    summary: "Visible water damage on ceiling panel near HVAC unit. Staining pattern suggests an ongoing leak.",
    category: "plumbing",
    recommended_actions: [
      "Shut off water supply to the affected zone immediately",
      "Photograph all stained panels before remediation begins",
      "Contact a licensed plumber — respond within 2 hours",
      "Place moisture barrier under the damaged area",
    ],
    follow_up_required: true,
    estimated_resolution: "4–6 hours",
    parts_materials: [
      "Moisture barrier sheet",
      "Ceiling replacement panel",
      "Paint — match existing color",
    ],
    hazards: [
      "Slip hazard from dripping water",
      "Potential mold growth if untreated beyond 24 hours",
    ],
    confidence: 0.87,
  },
  {
    risk_level: "HIGH",
    summary: "Electrical panel shows signs of overheating on breaker row 3. Scorch marks are visible.",
    category: "electrical",
    recommended_actions: [
      "Do NOT re-energize the panel until fully inspected",
      "Isolate the affected circuit immediately",
      "Call a licensed electrician — emergency priority",
      "Document breaker serial numbers before any work begins",
    ],
    follow_up_required: true,
    estimated_resolution: "Same day — licensed electrician required",
    parts_materials: [
      "Replacement breaker (match existing amperage)",
      "Wire connectors",
      "Electrical tape",
    ],
    hazards: [
      "Electrocution risk if panel is re-energized",
      "Fire hazard — scorch marks indicate sustained overheating",
    ],
    confidence: 0.92,
  },
  {
    risk_level: "LOW",
    summary: "HVAC filter is heavily clogged. Unit is running but airflow is significantly restricted.",
    category: "hvac",
    recommended_actions: [
      "Replace filter with MERV-13 or equivalent",
      "Log filter change in the maintenance record",
      "Inspect ductwork for additional debris",
      "Schedule next inspection in 90 days",
    ],
    follow_up_required: false,
    estimated_resolution: "30 minutes",
    parts_materials: ["MERV-13 filter — confirm unit size before ordering"],
    hazards: [],
    confidence: 0.95,
  },
  {
    risk_level: "HIGH",
    summary: "Horizontal crack in a load-bearing wall. Pattern suggests settling or structural stress — engineer review required.",
    category: "structural",
    recommended_actions: [
      "Do not apply temporary patches — requires professional assessment",
      "Restrict access to the adjacent area",
      "Engage a licensed structural engineer within 24 hours",
      "Document crack dimensions (length, width, depth) with a ruler as reference",
    ],
    follow_up_required: true,
    estimated_resolution: "Pending structural engineer assessment",
    parts_materials: [],
    hazards: ["Potential structural failure if load-bearing capacity is compromised"],
    confidence: 0.78,
  },
];

// ── Claude helpers (REAL mode) ────────────────────────────────
const CLAUDE_MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You are a field service AI assistant. Analyze the technician's report and return ONLY valid JSON — no markdown, no code fences, no explanation. Raw JSON only.

Use this exact schema:
{
  "risk_level": "LOW" or "MEDIUM" or "HIGH",
  "summary": "one or two sentence summary of the issue",
  "category": "hvac" or "electrical" or "plumbing" or "structural" or "general",
  "recommended_actions": ["action 1", "action 2"],
  "follow_up_required": true or false,
  "estimated_resolution": "human-readable time estimate",
  "parts_materials": ["item 1", "item 2"],
  "hazards": ["hazard 1"],
  "confidence": number between 0.0 and 1.0
}

Photo analysis rules (when an image is provided):
- First identify what physical object or scene is depicted (e.g. "electrical panel", "ceiling tile", "HVAC filter", "piece of furniture", "outdoor pipe").
- Base your assessment on what is ACTUALLY VISIBLE in the image. Do not invent or amplify hazards that are not supported by the visual evidence.
- If the image subject is clearly unrelated to the field note (e.g. note describes electrical risk but photo shows a chair), reflect that mismatch by lowering confidence.
- Only assign risk_level HIGH when the image shows direct, unambiguous visual evidence of danger.
- Never include a hazard in the hazards array unless the image (or a very clear text description) provides specific evidence for it.

Confidence calibration:
- 0.80–1.00: Image clearly shows the described issue; high certainty on category and risk.
- 0.60–0.79: Partial or indirect visual evidence; some uncertainty about severity or category.
- 0.00–0.59: Image is absent, unclear, or shows something unrelated to the claimed issue.`;

function buildContent(note, photoBuffer, photoMimeType, strict = false) {
  const content = [];

  if (photoBuffer) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: photoMimeType || "image/jpeg",
        data: photoBuffer.toString("base64"),
      },
    });
  }

  const strictPrefix = strict
    ? "IMPORTANT: Your previous response was not valid JSON. Return ONLY the raw JSON object — no markdown, no code fences, no extra text.\n\n"
    : "";

  // Explicit per-request photo instruction so Claude knows what to look for
  const photoInstruction = photoBuffer
    ? "A photo is attached. Identify the object or scene shown (e.g. electrical panel, ceiling tile, HVAC unit, furniture), then use it as primary evidence for your assessment. Only report hazards that are clearly visible in the image."
    : "No photo was provided. Base the assessment on the text note only and apply conservative confidence (below 0.6 unless the text is highly specific).";

  content.push({
    type: "text",
    text: `${strictPrefix}${photoInstruction}\n\nField note: ${note}`,
  });

  return content;
}

function tryParseJson(text) {
  const cleaned = text
    .replace(/^```(?:json)?\s*/im, "")
    .replace(/\s*```\s*$/im, "")
    .trim();
  return JSON.parse(cleaned);
}

async function analyzeWithClaude(note, photoBuffer, photoMimeType) {
  const callClaude = async (strict) => {
    const msg = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        { role: "user", content: buildContent(note, photoBuffer, photoMimeType, strict) },
      ],
    });
    return msg.content[0]?.text ?? "";
  };

  // Attempt 1
  try {
    const text = await callClaude(false);
    return tryParseJson(text);
  } catch (err) {
    console.warn("[analyze] Attempt 1 failed:", err.message, "— retrying with strict prompt");
  }

  // Attempt 2 — stricter instruction
  try {
    const text = await callClaude(true);
    return tryParseJson(text);
  } catch (err) {
    console.error("[analyze] Attempt 2 failed:", err.message, "— returning fallback");
    return null;
  }
}

// ── Confidence guardrail (REAL mode only) ─────────────────────
// If Claude is not confident enough, override with a neutral,
// non-alarmist response rather than risk a wild misclassification.
const CONFIDENCE_THRESHOLD = 0.6;

function applyConfidenceGuardrail(result) {
  const confidence = result.confidence ?? 1;
  if (confidence >= CONFIDENCE_THRESHOLD) return result;

  console.log(
    `[analyze] Low confidence (${confidence}) — overriding with neutral classification`
  );

  return {
    ...result,
    risk_level: "MEDIUM",
    hazards: [],
    summary: `Insufficient visual evidence — ${result.summary}`,
    recommended_actions: [
      "Conduct an in-person inspection before taking action",
      "Retake the photo with better lighting and closer framing if possible",
    ],
    follow_up_required: true,
    estimated_resolution: "Pending in-person inspection",
    // confidence is preserved so the frontend can still display it
  };
}

const FALLBACK_RESULT = {
  risk_level: "MEDIUM",
  summary: "Automated analysis could not be completed. Please review this report manually.",
  category: "general",
  recommended_actions: [
    "Review the report details manually",
    "Escalate to supervisor if the situation appears urgent",
  ],
  follow_up_required: true,
  estimated_resolution: "Unknown — manual review required",
  parts_materials: [],
  hazards: [],
  confidence: 0,
};

// ── POST /analyze ─────────────────────────────────────────────
app.post("/analyze", upload.single("photo"), async (req, res) => {
  const note = req.body.note || "";
  const hasPhoto = !!req.file;

  console.log(`[analyze] mode=${MODE} note="${note.slice(0, 80)}" hasPhoto=${hasPhoto}`);

  const meta = {
    model: MODE === "REAL" ? CLAUDE_MODEL : "mock-v1",
    photo_included: hasPhoto,
    analyzed_at: new Date().toISOString(),
  };

  // ── MOCK mode ─────────────────────────────────────────────
  if (MODE === "MOCK") {
    const index = note.length % MOCK_RESPONSES.length;
    setTimeout(() => res.json({ ...MOCK_RESPONSES[index], meta }), 800);
    return;
  }

  // ── REAL mode ─────────────────────────────────────────────
  try {
    const raw = await analyzeWithClaude(
      note,
      req.file?.buffer ?? null,
      req.file?.mimetype ?? null
    );
    const result = raw ? applyConfidenceGuardrail(raw) : FALLBACK_RESULT;
    res.json({ ...result, meta });
  } catch (err) {
    console.error("[analyze] Unexpected error:", err.message);
    // Don't leak error details to the client
    res.status(500).json({ error: "Analysis failed. Please try again." });
  }
});

app.listen(PORT, () => {
  console.log(`Field Tech API — http://localhost:${PORT} [MODE=${MODE}]`);
});
