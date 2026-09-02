require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODE = API_KEY ? "REAL" : "MOCK";

console.log(`\n[startup] MODE=${MODE}\n`);

let anthropic = null;
if (MODE === "REAL") {
  const Anthropic = require("@anthropic-ai/sdk");
  anthropic = new Anthropic({ apiKey: API_KEY });
}

const upload = multer({ storage: multer.memoryStorage() });

const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(",")
  : ["http://localhost:5173", "http://127.0.0.1:5173"];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
}));
app.use(express.json());

// ── Health ────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", mode: MODE });
});

// ── Mock responses ────────────────────────────────────────────
const MOCK_RESPONSES = [
  {
    risk_level: "HIGH",
    visual_explanation: "The photo shows a drop ceiling tile with a large brown water stain spreading from the upper-left corner. The discoloration is dark at the edges suggesting repeated wetting and drying. A visible sag in the tile center indicates accumulated moisture weight.",
    summary: "Ceiling panel shows signs likely due to an active or recent leak above the tile. The staining pattern may indicate an ongoing supply line or condensate drain issue.",
    possible_causes: [
      "Condensate drain line blockage from HVAC unit above ceiling",
      "Pinhole leak in domestic water supply line running overhead",
      "Roof membrane failure allowing intermittent rainwater intrusion",
    ],
    category: "plumbing",
    recommended_actions: [
      "Confirm whether the drip is currently active before removing the tile",
      "Shut off water supply to the affected zone if an active leak is found",
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
    billable_notes: "Emergency call rate + 2 hr labor + materials estimate pending. Document water source before billing.",
    confidence: 0.87,
    equipment_id: { manufacturer: null, model: null, serial: null, estimated_age_years: null, warranty_likely: false },
    replacement_recommended: false,
    replacement_rationale: "Ceiling tile damage is cosmetic; replacement of the tile is warranted but the leak source must be confirmed first.",
    upsell_opportunities: [
      "Inspect roof membrane above affected area while on site",
      "Offer mold remediation assessment — 48-hour window before risk escalates",
    ],
    site_checklist: [
      "Confirm active drip has stopped before leaving",
      "Place moisture barrier under affected area",
      "Photograph all stained tiles for work order documentation",
      "Check adjacent tiles for soft spots or secondary staining",
      "Confirm water shutoff valve is accessible and marked",
    ],
  },
  {
    risk_level: "HIGH",
    visual_explanation: "The photo shows an electrical breaker panel with visible scorch marks on the plastic housing around breaker row 3. The discoloration is black and heat-spread, indicating sustained high current or arcing. One breaker appears slightly melted at the trip lever.",
    summary: "Electrical panel shows signs of sustained overheating on breaker row 3, possibly due to an overloaded circuit or a failing breaker allowing excessive current draw.",
    possible_causes: [
      "Failing breaker no longer tripping at rated amperage, causing sustained overload",
      "Loose wire connection at the breaker terminal causing arcing and heat buildup",
      "Overloaded circuit drawing sustained current above breaker rating",
    ],
    category: "electrical",
    recommended_actions: [
      "Verify panel is fully de-energized before any inspection or work",
      "Do NOT re-energize the panel until fully inspected by a licensed electrician",
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
    billable_notes: "Emergency electrician dispatch rate applies. Document breaker serial numbers for warranty check. Parts billed at cost + markup.",
    confidence: 0.92,
    equipment_id: { manufacturer: "Square D", model: "QO130L200PG", serial: null, estimated_age_years: 18, warranty_likely: false },
    replacement_recommended: true,
    replacement_rationale: "Panel is approximately 18 years old and shows evidence of sustained overheating; full panel replacement should be discussed with the customer.",
    upsell_opportunities: [
      "Inspect all breakers while panel is open — document any additional signs of wear",
      "Recommend whole-home surge protection installation during this visit",
    ],
    site_checklist: [
      "Confirm panel is fully de-energized before any work",
      "Photograph scorch marks with ruler for scale",
      "Record all breaker labels, amperage, and serial numbers",
      "Verify all downstream circuits are isolated",
      "Leave customer-facing notice if panel must remain off until licensed electrician arrives",
    ],
  },
  {
    risk_level: "LOW",
    visual_explanation: "The photo shows an HVAC air handler filter slide-out tray. The filter surface is heavily coated in grey dust and debris, with visible clumping. The filter media is no longer visible through the dust layer, indicating it is well past its service interval.",
    summary: "HVAC filter is heavily clogged, likely due to an overdue service interval. Airflow restriction is significant and may be causing the unit to run harder than necessary.",
    possible_causes: [
      "Filter not replaced within the recommended 90-day interval",
      "High-dust environment accelerating filter clogging beyond normal schedule",
    ],
    category: "hvac",
    recommended_actions: [
      "Check filter size label before purchasing a replacement",
      "Replace filter with MERV-13 or equivalent",
      "Log filter change in the maintenance record",
      "Inspect ductwork for additional debris",
      "Schedule next inspection in 90 days",
    ],
    follow_up_required: false,
    estimated_resolution: "30 minutes",
    parts_materials: ["MERV-13 filter — confirm unit size before ordering"],
    hazards: [],
    billable_notes: "Standard service call + 15 min labor + MERV-13 filter cost. Check service contract for filter coverage.",
    confidence: 0.95,
    equipment_id: { manufacturer: "Carrier", model: "FB4CNF036", serial: "0616A12345", estimated_age_years: 7, warranty_likely: true },
    replacement_recommended: false,
    replacement_rationale: "Unit is 7 years old and within expected service life; no replacement warranted at this time.",
    upsell_opportunities: [
      "Check refrigerant levels while servicing — system may need a top-off",
      "Offer annual filter subscription to prevent future clogging",
    ],
    site_checklist: [
      "Confirm filter size matches unit spec before installing replacement",
      "Log filter change date and technician name in maintenance record",
      "Cycle unit on after replacement and verify airflow improvement",
      "Check condensate drain line for blockage while access panel is open",
    ],
  },
  {
    risk_level: "HIGH",
    visual_explanation: "The photo shows an interior drywall surface with a horizontal crack running approximately 18 inches along the wall, roughly 4 feet from the floor. The crack edges show displacement — the upper section has shifted slightly outward relative to the lower section, suggesting active movement rather than a surface settling crack.",
    summary: "Horizontal crack with edge displacement may indicate settling or structural stress — signs suggest this is not a typical cosmetic crack and engineer review is warranted.",
    possible_causes: [
      "Foundation settling causing differential movement in the wall framing",
      "Overloaded floor or roof structure above the wall transmitting stress into the drywall",
      "Soil movement or drainage issue beneath the foundation causing slow subsidence",
    ],
    category: "structural",
    recommended_actions: [
      "Do not apply temporary patches before a structural assessment — patching may mask active movement",
      "Restrict access to the adjacent area",
      "Engage a licensed structural engineer within 24 hours",
      "Document crack dimensions (length, width, depth) with a ruler as reference",
    ],
    follow_up_required: true,
    estimated_resolution: "Pending structural engineer assessment",
    parts_materials: [],
    hazards: ["Potential structural failure if load-bearing capacity is compromised"],
    billable_notes: "Inspection fee + structural engineer referral. Document for liability — note this as a structural concern in the work order.",
    confidence: 0.78,
    equipment_id: { manufacturer: null, model: null, serial: null, estimated_age_years: null, warranty_likely: false },
    replacement_recommended: false,
    replacement_rationale: "No equipment to assess for replacement; structural repair scope must be determined by a licensed engineer.",
    upsell_opportunities: [
      "Place crack monitoring tape across the fracture to track active movement",
      "Inspect adjacent walls and ceiling for secondary cracking",
    ],
    site_checklist: [
      "Photograph crack with ruler for scale and document exact location",
      "Measure and record crack length, width, and displacement depth",
      "Check both sides of wall for corresponding damage",
      "Restrict customer access to adjacent area until engineer assessment",
      "Confirm structural engineer referral is documented in the work order",
    ],
  },
];

// ── Claude helpers (REAL mode) ────────────────────────────────
const CLAUDE_MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You are a field service AI assistant. Analyze the technician's report and return ONLY valid JSON — no markdown, no code fences, no explanation. Raw JSON only.

Use this exact schema:
{
  "risk_level": "LOW" or "MEDIUM" or "HIGH" or "CRITICAL",
  "visual_explanation": "2-4 sentences describing exactly what you see in the photo — identify the object, its condition, any visible damage/discoloration/wear/anomalies. If no photo was provided, say: No photo provided.",
  "summary": "1-2 sentence diagnosis using hedged language — e.g. 'Possible cause is…', 'This is likely due to…', 'Signs suggest…'. Avoid definitive conclusions unless confidence >= 0.85.",
  "possible_causes": ["most likely cause", "second possible cause", "third if warranted"],
  "category": "hvac" or "electrical" or "plumbing" or "structural" or "mechanical" or "general",
  "recommended_actions": ["Verify X before proceeding — first action must be a verification step", "corrective action 2"],
  "follow_up_required": true or false,
  "estimated_resolution": "human-readable time estimate",
  "parts_materials": ["part or material 1"],
  "hazards": ["specific hazard 1"],
  "billable_notes": "brief note on what should be billed — labor, parts, emergency rate, etc.",
  "confidence": number between 0.0 and 1.0,
  "equipment_id": {
    "manufacturer": "brand name visible on nameplate, or null",
    "model": "model number from label, or null",
    "serial": "serial number from label, or null",
    "estimated_age_years": number based on visible wear/date codes/style, or null,
    "warranty_likely": true if estimated_age_years is under 10 and no major wear, otherwise false
  },
  "replacement_recommended": true or false,
  "replacement_rationale": "one sentence explaining why replacement was or was not recommended — always populate",
  "upsell_opportunities": ["specific check or service 1", "specific check or service 2"],
  "site_checklist": ["verify X before leaving", "confirm Y", "document Z"]
}

Photo analysis rules (when an image is provided):
- Start visual_explanation by identifying the physical object shown (e.g. "electrical panel", "ceiling tile", "HVAC compressor", "piece of furniture").
- Describe the object's visible condition objectively — color, texture, damage signs, wear patterns.
- Base your assessment on what is ACTUALLY VISIBLE. Do not invent or amplify hazards not supported by the image.
- If the photo subject is unrelated to the field note, reflect that mismatch in visual_explanation and lower confidence.
- Only assign risk_level HIGH for significant visible damage requiring same-day response.
- Only assign risk_level CRITICAL for immediate life-safety threats: live electrical exposure, active fire risk, imminent structural collapse.

Confidence calibration:
- 0.85–1.00: Image clearly shows the described issue; high certainty on category and risk.
- 0.65–0.84: Partial or indirect visual evidence; some uncertainty about severity or category.
- 0.40–0.64: Indirect evidence or image/note mismatch; assessment is partially text-based.
- 0.00–0.39: No image, or image clearly shows something unrelated to the note.

diagnosis language rules:
- summary must use phrases like "possible cause", "likely due to", "signs suggest", "may indicate" unless confidence >= 0.85.
- First recommended_action must always be a verification step ("Check X", "Confirm Y", "Test Z") before any corrective actions.
- Do not state a definitive root cause unless the image provides unambiguous evidence.

possible_causes rules:
- 2-3 specific differential diagnoses ranked by likelihood (most likely first).
- Each cause must be specific and tied to visible evidence or the field note — not generic.
- Only include a third cause if the evidence genuinely supports multiple explanations.

hazards rules:
- Only include hazards when there is clear visual or textual evidence of a specific risk.
- For risk_level LOW or MEDIUM, hazards array must be empty UNLESS there is a life-threatening or injury-causing condition visually confirmed (e.g. exposed wiring, gas odor explicitly mentioned, fall hazard).
- For risk_level HIGH or CRITICAL, hazards are expected and must be specific — not generic ("electrical hazard" is not enough; "electrocution risk if panel is re-energized" is correct).
- Never include speculative hazards. "Potential future risk" is not a hazard.

equipment_id rules:
- Extract manufacturer, model, and serial from any visible nameplate, rating plate, or label in the photo. Set to null if not visible.
- Estimate age from visible wear patterns, design era, or any date codes visible. Set to null if truly unknown.
- warranty_likely: true only if estimated_age_years < 10 and unit shows no severe deterioration.

replacement_recommended rules:
- true if: estimated_age_years > 12, or repair cost likely exceeds 60% of replacement value, or visible wear suggests end-of-life.
- false for cosmetic damage, minor repairs, or young equipment.
- Always populate replacement_rationale with one clear sentence.

upsell_opportunities rules:
- 2-3 items ONLY. Must be specific to what is visible in the photo and described in the note.
- Never generic (not "check other equipment" — instead "check capacitor while compressor panel is open").

site_checklist rules:
- 3-5 items the technician should verify or complete before leaving this specific job.
- Tied to the actual issue found, not generic.

parts_materials rules:
- When equipment_id contains a visible manufacturer and/or model number, include compatible part names with likely part numbers or model suffixes where they can be reasonably inferred (e.g. "Carrier FB4CNF036 — 20x25x4 MERV-13 filter (part: FILXXCAR0020)"). Add "(verify model before ordering)" if uncertain.
- When no equipment ID is available, be as specific as possible based on visible size, type, and condition in the photo.
- Never invent a part number that cannot be reasonably inferred from visible labels or standard industry knowledge.
- Do not list generic materials like "screwdriver" — only consumables and replacement parts.

billable_notes rules:
- Always include this field, even if minimal (e.g. "Standard service call + 30 min labor").
- Flag emergency upcharge when risk_level is HIGH or CRITICAL.
- Mention parts cost if parts_materials is non-empty.`;

function buildContent(note, jobContext, photos, symptom, strict = false) {
  const content = [];

  for (const photo of photos) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: photo.mimetype || "image/jpeg",
        data: photo.buffer.toString("base64"),
      },
    });
  }

  const strictPrefix = strict
    ? "IMPORTANT: Your previous response was not valid JSON. Return ONLY the raw JSON object — no markdown, no code fences, no extra text.\n\n"
    : "";

  const photoInstruction = photos.length > 0
    ? `${photos.length > 1 ? photos.length + " photos are" : "A photo is"} attached. Identify what object or scene is shown, then use it as primary evidence for your assessment. Only report hazards clearly visible in the image(s).`
    : "No photo was provided. Base the assessment on the text note only. Apply conservative confidence (below 0.65 unless the text is highly specific).";

  const jobLine = jobContext && (jobContext.jobId || jobContext.site || jobContext.asset)
    ? `Job context — ID: ${jobContext.jobId || "N/A"} | Site: ${jobContext.site || "N/A"} | Asset: ${jobContext.asset || "N/A"}\n\n`
    : "";

  const symptomLine = symptom ? `Reported symptom: ${symptom}\n\n` : "";

  content.push({
    type: "text",
    text: `${strictPrefix}${photoInstruction}\n\n${jobLine}${symptomLine}Field note: ${note}`,
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

async function analyzeWithClaude(note, jobContext, photos, symptom) {
  const callClaude = async (strict) => {
    const msg = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1800,
      system: SYSTEM_PROMPT,
      messages: [
        { role: "user", content: buildContent(note, jobContext, photos, symptom, strict) },
      ],
    });
    return msg.content[0]?.text ?? "";
  };

  try {
    const text = await callClaude(false);
    return tryParseJson(text);
  } catch (err) {
    console.warn("[analyze] Attempt 1 failed:", err.message, "— retrying with strict prompt");
  }

  try {
    const text = await callClaude(true);
    return tryParseJson(text);
  } catch (err) {
    console.error("[analyze] Attempt 2 failed:", err.message, "— returning fallback");
    return null;
  }
}

// ── Confidence guardrail (REAL mode only) ─────────────────────
const CONFIDENCE_THRESHOLD = 0.50;

function applyConfidenceGuardrail(result) {
  const confidence = result.confidence ?? 1;
  if (confidence >= CONFIDENCE_THRESHOLD) return result;

  console.log(`[analyze] Low confidence (${confidence}) — adding low_confidence_note`);

  return {
    ...result,
    low_confidence_note: "Low confidence — verify findings on site before taking action",
  };
}

const FALLBACK_RESULT = {
  risk_level: "MEDIUM",
  visual_explanation: "Analysis could not be completed automatically.",
  summary: "Automated analysis could not be completed. Please review this report manually.",
  possible_causes: [],
  category: "general",
  recommended_actions: [
    "Review the report details manually",
    "Escalate to supervisor if the situation appears urgent",
  ],
  follow_up_required: true,
  estimated_resolution: "Unknown — manual review required",
  parts_materials: [],
  hazards: [],
  billable_notes: "Manual review required — bill standard inspection rate pending technician assessment.",
  confidence: 0,
  equipment_id: { manufacturer: null, model: null, serial: null, estimated_age_years: null, warranty_likely: false },
  replacement_recommended: false,
  replacement_rationale: "Insufficient data to assess replacement need.",
  upsell_opportunities: [],
  site_checklist: [],
};

// ── POST /analyze ─────────────────────────────────────────────
app.post(
  "/analyze",
  upload.fields([
    { name: "photo_1", maxCount: 1 },
    { name: "photo_2", maxCount: 1 },
    { name: "photo_3", maxCount: 1 },
  ]),
  async (req, res) => {
    const note = req.body.note || "";
    const symptom = req.body.symptom || null;
    const jobContext = {
      jobId: req.body.job_id || null,
      site:  req.body.site   || null,
      asset: req.body.asset  || null,
    };

    const photos = ["photo_1", "photo_2", "photo_3"]
      .map((k) => req.files?.[k]?.[0])
      .filter(Boolean);

    console.log(`[analyze] mode=${MODE} note="${note.slice(0, 80)}" photos=${photos.length} symptom=${symptom} job=${jobContext.jobId}`);

    const meta = {
      model: MODE === "REAL" ? CLAUDE_MODEL : "mock-v1",
      photo_count: photos.length,
      symptom: symptom || null,
      analyzed_at: new Date().toISOString(),
      job_context: jobContext,
    };

    // ── MOCK mode ─────────────────────────────────────────────
    if (MODE === "MOCK") {
      const index = note.length % MOCK_RESPONSES.length;
      setTimeout(() => res.json({ ...MOCK_RESPONSES[index], meta }), 800);
      return;
    }

    // ── REAL mode ─────────────────────────────────────────────
    try {
      const raw = await analyzeWithClaude(note, jobContext, photos, symptom);
      const result = raw ? applyConfidenceGuardrail(raw) : FALLBACK_RESULT;
      res.json({ ...result, meta });
    } catch (err) {
      console.error("[analyze] Unexpected error:", err.message);
      res.status(500).json({ error: "Analysis failed. Please try again." });
    }
  }
);

// ── POST /customer-report ─────────────────────────────────────
const CUSTOMER_REPORT_SYSTEM = `You are writing a friendly plain-English service report for a homeowner. Write exactly 2 short paragraphs. First paragraph: what the technician found when they arrived, in plain English. Second paragraph: what was actually done to resolve it — use the resolution_note field if provided, otherwise describe what was recommended. End with one sentence about next steps if relevant. Sign off with Your Service Team. Maximum 120 words total. No jargon.`;

const MOCK_CUSTOMER_REPORT = `Our technician visited today and found the reported issue. The problem was identified and the likely cause is well understood.

The technician addressed the issue as described and your system is on the path to normal operation. If anything changes or you have questions before your next scheduled visit, please don't hesitate to call us.

Your Service Team`;

app.post("/customer-report", async (req, res) => {
  const analysisData = req.body;

  if (!analysisData || typeof analysisData !== "object") {
    return res.status(400).json({ error: "Request body must be the analysis JSON." });
  }

  const resolutionNote = (typeof analysisData.resolution_note === "string" && analysisData.resolution_note)
    ? analysisData.resolution_note : null;

  console.log(`[customer-report] mode=${MODE} risk=${analysisData.risk_level} hasResolution=${!!resolutionNote}`);

  if (MODE === "MOCK") {
    setTimeout(() => res.json({ customer_report: MOCK_CUSTOMER_REPORT }), 600);
    return;
  }

  const resolutionSection = resolutionNote
    ? `\n\nResolution Note (what the technician actually did): ${resolutionNote}`
    : "";

  try {
    const msg = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 300,
      system: CUSTOMER_REPORT_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Here is the structured field analysis to convert into a customer report:\n\n${JSON.stringify(analysisData, null, 2)}${resolutionSection}`,
        },
      ],
    });
    const customer_report = msg.content[0]?.text?.trim() ?? "Report could not be generated.";
    res.json({ customer_report });
  } catch (err) {
    console.error("[customer-report] Error:", err.message);
    res.status(500).json({ error: "Could not generate customer report." });
  }
});

app.listen(PORT, () => {
  console.log(`Lensfield API — http://localhost:${PORT} [MODE=${MODE}]`);
});
