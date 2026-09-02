// ── Config ────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

// ── DOM refs ──────────────────────────────────────────────────
const form             = document.getElementById("report-form");
const noteEl           = document.getElementById("note");
const symptomEl        = document.getElementById("symptom");
const charCount        = document.getElementById("char-count");
const micBtn           = document.getElementById("mic-btn");
const recordIndicator  = document.getElementById("record-indicator");
const jobIdEl          = document.getElementById("job-id");
const siteEl           = document.getElementById("site");
const assetEl          = document.getElementById("asset");
const submitBtn        = document.getElementById("submit-btn");
const loading          = document.getElementById("loading");
const resultPanel      = document.getElementById("result-panel");
const resultContent    = document.getElementById("result-content");
const resultRiskBar    = document.getElementById("result-risk-bar");
const resultJobContext = document.getElementById("result-job-context");
const severityBadge    = document.getElementById("severity-badge");
const confidenceBarFill = document.getElementById("confidence-bar-fill");
const confidencePct    = document.getElementById("confidence-pct");
const newReportBtn     = document.getElementById("new-report-btn");
const headerNewBtn     = document.getElementById("header-new-btn");
const resultSubtitle   = document.getElementById("result-subtitle");
const historyPanel     = document.getElementById("history-panel");
const historyList      = document.getElementById("history-list");
const clearHistoryBtn  = document.getElementById("clear-history-btn");
const customerReportBtn    = document.getElementById("customer-report-btn");
const customerModal        = document.getElementById("customer-report-modal");
const customerModalClose   = document.getElementById("customer-modal-close");
const customerModalLoading = customerModal.querySelector(".customer-modal-loading");
const customerModalText    = document.getElementById("customer-modal-text");
const customerModalShare   = document.getElementById("customer-modal-share");
const customerModalCopy    = document.getElementById("customer-modal-copy");
const shareBtn         = document.getElementById("share-btn");
const copyJsonBtn      = document.getElementById("copy-json-btn");
const copySummaryBtn   = document.getElementById("copy-summary-btn");
const exportPdfBtn     = document.getElementById("export-pdf-btn");
const contrastBtn      = document.getElementById("contrast-btn");
const toastEl          = document.getElementById("toast");
const printTimestamp   = document.getElementById("print-timestamp");
const resolutionNoteEl          = document.getElementById("resolution-note");
const resolutionMicBtn          = document.getElementById("resolution-mic-btn");
const resolutionRecordIndicator = document.getElementById("resolution-record-indicator");

// ── State ─────────────────────────────────────────────────────
let photoFiles  = [null, null, null]; // up to 3 photos (index 0=slot1, 1=slot2, 2=slot3)
let currentData = null;

// ── Job context collapse ──────────────────────────────────────
const jobToggle    = document.getElementById("job-toggle");
const jobFieldsBody = document.getElementById("job-fields-body");

jobToggle.addEventListener("click", () => {
  const expanded = jobToggle.getAttribute("aria-expanded") === "true";
  jobToggle.setAttribute("aria-expanded", String(!expanded));
  jobFieldsBody.classList.toggle("collapsed", expanded);
});

// ── High-contrast mode ────────────────────────────────────────
const HC_KEY = "fta_high_contrast";

function applyContrast(on) {
  document.body.classList.toggle("high-contrast", on);
  document.documentElement.classList.toggle("high-contrast", on);
  contrastBtn.setAttribute("aria-pressed", String(on));
}

applyContrast(localStorage.getItem(HC_KEY) === "1");

contrastBtn.addEventListener("click", () => {
  const next = !document.body.classList.contains("high-contrast");
  applyContrast(next);
  localStorage.setItem(HC_KEY, next ? "1" : "0");
});

// ── Image compression ─────────────────────────────────────────
async function compressImage(file, maxWidth = 900, quality = 0.75) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement("canvas");
      canvas.width  = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

// ── Multi-photo slots ─────────────────────────────────────────
const photoSlots = document.querySelectorAll(".photo-slot");

function syncSlotVisibility() {
  photoSlots.forEach((slot, i) => {
    const slotNum = i + 1;
    if (slotNum === 1) return; // primary always visible
    // Show secondary slot only if the previous slot has a photo
    const prevFilled = photoFiles[i - 1] != null;
    slot.classList.toggle("hidden", !prevFilled);
  });
}

photoSlots.forEach((slot, i) => {
  const input   = slot.querySelector(".slot-input");
  const preview = slot.querySelector(".slot-preview");
  const placeholder = slot.querySelector(".slot-placeholder");
  const retake  = slot.querySelector(".slot-retake");

  input.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    slot.querySelector(".slot-placeholder").classList.add("photo-area--pulse-off");
    const compressed = await compressImage(file);
    photoFiles[i] = compressed;

    preview.src = URL.createObjectURL(compressed);
    preview.classList.remove("hidden");
    placeholder.classList.add("hidden");
    retake.classList.remove("hidden");

    syncSlotVisibility();
    checkReady();
  });

  retake.addEventListener("click", () => {
    photoFiles[i] = null;
    // Clear this slot and all subsequent slots
    for (let j = i; j < photoSlots.length; j++) {
      const s = photoSlots[j];
      const p = s.querySelector(".slot-preview");
      const ph = s.querySelector(".slot-placeholder");
      const r = s.querySelector(".slot-retake");
      const inp = s.querySelector(".slot-input");
      photoFiles[j] = null;
      p.src = "";
      p.classList.add("hidden");
      ph.classList.remove("hidden");
      r.classList.add("hidden");
      inp.value = "";
    }
    syncSlotVisibility();
    checkReady();
  });
});

function resetPhotoSlots() {
  photoFiles = [null, null, null];
  photoSlots.forEach((slot, i) => {
    const preview = slot.querySelector(".slot-preview");
    const placeholder = slot.querySelector(".slot-placeholder");
    const retake = slot.querySelector(".slot-retake");
    const input = slot.querySelector(".slot-input");
    preview.src = "";
    preview.classList.add("hidden");
    placeholder.classList.remove("hidden");
    retake.classList.add("hidden");
    input.value = "";
    if (i > 0) slot.classList.add("hidden");
  });
}

// ── Voice notes ───────────────────────────────────────────────
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isRecording = false;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  let finalTranscript = "";

  recognition.onstart = () => {
    isRecording = true;
    micBtn.classList.add("mic-btn--recording");
    recordIndicator.classList.remove("hidden");
    finalTranscript = noteEl.value;
  };

  recognition.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) {
        finalTranscript += (finalTranscript && !finalTranscript.endsWith(" ") ? " " : "") + t;
      } else {
        interim = t;
      }
    }
    noteEl.value = finalTranscript + (interim ? ` ${interim}` : "");
    updateCharCount();
    checkReady();
  };

  recognition.onend = () => {
    isRecording = false;
    micBtn.classList.remove("mic-btn--recording");
    recordIndicator.classList.add("hidden");
    noteEl.value = finalTranscript.trim();
    updateCharCount();
    checkReady();
  };

  recognition.onerror = (e) => {
    console.warn("[voice] error:", e.error);
    isRecording = false;
    micBtn.classList.remove("mic-btn--recording");
    recordIndicator.classList.add("hidden");
    if (e.error !== "no-speech" && e.error !== "aborted") {
      showToast("Voice not available — type your note");
    }
  };

  micBtn.addEventListener("click", () => {
    if (isRecording) {
      recognition.stop();
    } else {
      try { recognition.start(); } catch { /* already started */ }
    }
  });
} else {
  micBtn.classList.add("hidden");
}

// ── Resolution Note voice ─────────────────────────────────────
let resolutionRecognition = null;
let isResolutionRecording = false;

if (SpeechRecognition) {
  resolutionRecognition = new SpeechRecognition();
  resolutionRecognition.continuous = true;
  resolutionRecognition.interimResults = true;
  resolutionRecognition.lang = "en-US";

  let resolutionFinalTranscript = "";

  resolutionRecognition.onstart = () => {
    isResolutionRecording = true;
    resolutionMicBtn.classList.add("mic-btn--recording");
    resolutionRecordIndicator.classList.remove("hidden");
    resolutionFinalTranscript = resolutionNoteEl.value;
  };

  resolutionRecognition.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) {
        resolutionFinalTranscript += (resolutionFinalTranscript && !resolutionFinalTranscript.endsWith(" ") ? " " : "") + t;
      } else {
        interim = t;
      }
    }
    resolutionNoteEl.value = resolutionFinalTranscript + (interim ? ` ${interim}` : "");
  };

  resolutionRecognition.onend = () => {
    isResolutionRecording = false;
    resolutionMicBtn.classList.remove("mic-btn--recording");
    resolutionRecordIndicator.classList.add("hidden");
    resolutionNoteEl.value = resolutionFinalTranscript.trim();
  };

  resolutionRecognition.onerror = (e) => {
    console.warn("[resolution voice] error:", e.error);
    isResolutionRecording = false;
    resolutionMicBtn.classList.remove("mic-btn--recording");
    resolutionRecordIndicator.classList.add("hidden");
    if (e.error !== "no-speech" && e.error !== "aborted") {
      showToast("Voice not available — type your note");
    }
  };

  resolutionMicBtn.addEventListener("click", () => {
    if (isResolutionRecording) {
      resolutionRecognition.stop();
    } else {
      try { resolutionRecognition.start(); } catch { /* already started */ }
    }
  });
} else {
  resolutionMicBtn.classList.add("hidden");
}

// ── History ───────────────────────────────────────────────────
const HISTORY_KEY = "fta_reports";
const HISTORY_MAX = 25;

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveReport(note, data) {
  const records = loadHistory();
  records.unshift({
    id: Date.now().toString(),
    analyzed_at: data.meta?.analyzed_at ?? new Date().toISOString(),
    note,
    risk_level: data.risk_level ?? "UNKNOWN",
    category:   data.category   ?? "general",
    summary:    data.summary    ?? "",
    payload:    data,
  });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(records.slice(0, HISTORY_MAX)));
}

function renderHistory() {
  const records = loadHistory();
  if (records.length === 0) {
    historyPanel.classList.add("hidden");
    return;
  }
  historyPanel.classList.remove("hidden");

  historyList.innerHTML = records.slice(0, 10).map((r) => {
    const date = new Date(r.analyzed_at).toLocaleString(undefined, {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
    const riskClass = (r.risk_level || "").toLowerCase();
    const summary   = r.summary.length > 72
      ? r.summary.slice(0, 72) + "…"
      : r.summary;
    return `
      <button class="history-item" data-id="${escHtml(r.id)}" data-risk="${escHtml(r.risk_level)}" type="button">
        <div class="history-item-top">
          <span class="history-item-date">${escHtml(date)}</span>
          <span class="severity-badge ${riskClass}">${escHtml(r.risk_level)}</span>
        </div>
        <div class="history-item-category">${escHtml(r.category)}</div>
        <div class="history-item-summary">${escHtml(summary)}</div>
      </button>
    `;
  }).join("");

  historyList.querySelectorAll(".history-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id     = btn.dataset.id;
      const record = loadHistory().find((r) => r.id === id);
      if (record) renderResult(record.payload, false);
    });
  });
}

clearHistoryBtn.addEventListener("click", () => {
  if (confirm("Clear all previous reports?")) {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
  }
});

// ── Ready check ───────────────────────────────────────────────
function checkReady() {
  submitBtn.disabled = noteEl.value.trim().length === 0;
}

// ── Char count ────────────────────────────────────────────────
function updateCharCount() {
  const len = noteEl.value.length;
  charCount.textContent = `${len} character${len === 1 ? "" : "s"}`;
  charCount.classList.toggle("char-count--good", len >= 30);
}

noteEl.addEventListener("input", () => {
  updateCharCount();
  checkReady();
});

// ── Submit ────────────────────────────────────────────────────
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const note = noteEl.value.trim();
  if (!note) return;

  if (isRecording && recognition) recognition.stop();
  if (isResolutionRecording && resolutionRecognition) resolutionRecognition.stop();

  const formData = new FormData();
  formData.append("note", note);
  if (symptomEl.value) formData.append("symptom", symptomEl.value);
  photoFiles.forEach((f, i) => { if (f) formData.append(`photo_${i + 1}`, f); });
  if (jobIdEl.value.trim()) formData.append("job_id", jobIdEl.value.trim());
  if (siteEl.value.trim())  formData.append("site",   siteEl.value.trim());
  if (assetEl.value.trim()) formData.append("asset",  assetEl.value.trim());

  setLoading(true);
  try {
    const res = await fetch(`${API_BASE}/analyze`, { method: "POST", body: formData });
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    const data = await res.json();
    saveReport(note, data);
    renderResult(data, true);
  } catch (err) {
    alert(`Failed to analyze: ${err.message}\n\nMake sure the API is running on port 3001.`);
  } finally {
    setLoading(false);
  }
});

// ── Render result ─────────────────────────────────────────────
function renderResult(data, shouldSave = false) {
  currentData = data;

  const riskLevel = data.risk_level ?? "UNKNOWN";
  const riskClass = riskLevel.toLowerCase();

  severityBadge.textContent = riskLevel;
  severityBadge.className   = `severity-badge ${riskClass}`;
  resultRiskBar.dataset.risk = riskClass;

  const confidenceVal = data.confidence ?? null;
  if (confidenceVal != null) {
    const pct = Math.round(confidenceVal * 100);
    confidenceBarFill.style.width = `${pct}%`;
    confidenceBarFill.dataset.risk = riskClass;
    confidencePct.textContent = `${pct}%`;
  } else {
    confidenceBarFill.style.width = "0%";
    confidencePct.textContent = "—";
  }

  const jc = data.meta?.job_context ?? {};
  const jobPills = [
    jc.jobId ? `<span class="jc-pill"><span class="jc-key">Job</span> ${escHtml(jc.jobId)}</span>` : "",
    jc.site  ? `<span class="jc-pill"><span class="jc-key">Site</span> ${escHtml(jc.site)}</span>`  : "",
    jc.asset ? `<span class="jc-pill"><span class="jc-key">Asset</span> ${escHtml(jc.asset)}</span>` : "",
  ].filter(Boolean);
  if (jobPills.length > 0) {
    resultJobContext.innerHTML = jobPills.join("");
    resultJobContext.classList.remove("hidden");
  } else {
    resultJobContext.classList.add("hidden");
  }

  const ts = data.meta?.analyzed_at
    ? new Date(data.meta.analyzed_at).toLocaleString()
    : new Date().toLocaleString();
  if (printTimestamp) printTimestamp.textContent = ts;
  if (resultSubtitle) resultSubtitle.textContent = `${data.category ?? "general"} · ${ts}`;

  headerNewBtn.classList.remove("hidden");

  const hazards   = data.hazards             ?? [];
  const parts     = data.parts_materials     ?? [];
  const actions   = data.recommended_actions ?? [];
  const upsell    = data.upsell_opportunities ?? [];
  const checklist = data.site_checklist      ?? [];
  const causes    = data.possible_causes     ?? [];
  const equip     = data.equipment_id ?? {};
  const hasEquip  = Object.values(equip).some((v) => v != null);

  resultContent.innerHTML = `
    ${data.low_confidence_note ? `
    <div class="result-section result-section--warn">
      <span class="rs-label rs-label--warn">⚠ Low Confidence</span>
      <p class="rs-text">${escHtml(data.low_confidence_note)}</p>
    </div>` : ""}

    ${data.visual_explanation ? (() => {
      const sentences = data.visual_explanation.split(/(?<=[.!?])\s+/);
      const preview   = escHtml(sentences[0] ?? data.visual_explanation);
      const full      = escHtml(data.visual_explanation);
      const hasMore   = sentences.length > 1;
      return `
    <div class="result-section result-section--vision vision-collapsible">
      <div class="vision-header">
        <span class="rs-label rs-label--vision">What the AI Sees</span>
        ${hasMore ? `<button type="button" class="vision-toggle" aria-expanded="false">Show</button>` : ""}
      </div>
      <p class="rs-text rs-text--vision vision-preview">${preview}${hasMore ? "…" : ""}</p>
      ${hasMore ? `<p class="rs-text rs-text--vision vision-full hidden">${full}</p>` : ""}
    </div>`;
    })() : ""}

    <div class="result-section result-section--summary">
      <span class="rs-label">Summary</span>
      <p class="rs-text rs-text--summary">${escHtml(data.summary ?? "—")}</p>
    </div>

    ${causes.length > 0 ? `
    <div class="result-section">
      <span class="rs-label">Possible Causes</span>
      <ul class="rs-list rs-list--causes">
        ${causes.map((c) => `<li>${escHtml(c)}</li>`).join("")}
      </ul>
    </div>` : ""}

    ${hazards.length > 0 ? `
    <div class="result-section result-section--hazard">
      <span class="rs-label">Hazards</span>
      <ul class="rs-list rs-list--hazard">
        ${hazards.map((h) => `<li>${escHtml(h)}</li>`).join("")}
      </ul>
    </div>` : ""}

    <div class="result-section">
      <span class="rs-label">Recommended Actions</span>
      <ol class="rs-list rs-list--actions">
        ${actions.map((a) => `<li>${escHtml(a)}</li>`).join("")}
      </ol>
    </div>

    ${hasEquip ? `
    <div class="result-section equipment-id-card">
      <span class="rs-label">Equipment ID</span>
      <div class="equip-fields">
        ${equip.manufacturer ? `<div class="equip-row"><span class="equip-key">Manufacturer</span><span class="equip-val">${escHtml(equip.manufacturer)}</span></div>` : ""}
        ${equip.model ? `<div class="equip-row"><span class="equip-key">Model</span><span class="equip-val equip-val--mono">${escHtml(equip.model)}</span></div>` : ""}
        ${equip.serial ? `<div class="equip-row"><span class="equip-key">Serial</span><span class="equip-val equip-val--mono">${escHtml(equip.serial)}</span></div>` : ""}
        ${equip.estimated_age_years != null ? `<div class="equip-row"><span class="equip-key">Est. Age</span><span class="equip-val">${equip.estimated_age_years} years</span></div>` : ""}
        <div class="equip-row">
          <span class="equip-key">Warranty</span>
          <span class="warranty-pill ${equip.warranty_likely ? "warranty-pill--active" : "warranty-pill--expired"}">
            ${equip.warranty_likely ? "Likely in warranty" : "Warranty unlikely"}
          </span>
        </div>
      </div>
    </div>` : ""}

    ${data.replacement_recommended ? `
    <div class="result-section replacement-callout">
      <span class="rs-label rs-label--replacement">⚠ Replacement Conversation</span>
      <p class="rs-text">${escHtml(data.replacement_rationale ?? "")}</p>
    </div>` : ""}

    ${upsell.length > 0 ? `
    <div class="result-section result-section--collapsible">
      <button type="button" class="rs-section-toggle" aria-expanded="false">
        <span class="rs-label">While You're On Site (${upsell.length})</span>
        <span class="rs-toggle-chevron" aria-hidden="true">›</span>
      </button>
      <ul class="rs-list rs-list--upsell rs-collapsible-body hidden">
        ${upsell.map((u) => `<li>${escHtml(u)}</li>`).join("")}
      </ul>
    </div>` : ""}

    ${checklist.length > 0 ? `
    <div class="result-section result-section--collapsible">
      <button type="button" class="rs-section-toggle" aria-expanded="false">
        <span class="rs-label">Before You Leave (${checklist.length})</span>
        <span class="rs-toggle-chevron" aria-hidden="true">›</span>
      </button>
      <ul class="rs-list rs-list--checklist rs-collapsible-body hidden">
        ${checklist.map((item, i) => `
        <li class="checklist-item" data-index="${i}">
          <span class="checklist-box"></span>
          <span class="checklist-text">${escHtml(item)}</span>
        </li>`).join("")}
      </ul>
    </div>` : ""}

    ${parts.length > 0 ? `
    <div class="result-section">
      <span class="rs-label">Parts &amp; Materials</span>
      <ul class="rs-list rs-list--parts">
        ${parts.map((p) => `<li>${escHtml(p)}</li>`).join("")}
      </ul>
    </div>` : ""}

    ${data.billable_notes ? `
    <div class="result-section result-section--billing">
      <span class="rs-label rs-label--billing">Billable Notes</span>
      <p class="rs-text">${escHtml(data.billable_notes)}</p>
    </div>` : ""}

    <div class="result-stats">
      <div class="result-stat">
        <span class="rs-label">Follow-up</span>
        <span class="stat-value ${data.follow_up_required ? "stat-value--yes" : "stat-value--no"}">${data.follow_up_required ? "Yes" : "No"}</span>
      </div>
      <div class="result-stat">
        <span class="rs-label">Est. Resolution</span>
        <span class="stat-value">${escHtml(data.estimated_resolution ?? "—")}</span>
      </div>
    </div>

    <div class="result-meta">
      <span>Analyzed: ${escHtml(ts)}</span>
      <span>Model: ${escHtml(data.meta?.model ?? "—")}</span>
      <span>Photos: ${data.meta?.photo_count ?? 0}</span>
      ${data.meta?.symptom ? `<span>Symptom: ${escHtml(data.meta.symptom)}</span>` : ""}
    </div>
  `;

  // Wire up checklist interactivity
  resultContent.querySelectorAll(".checklist-item").forEach((item) => {
    item.addEventListener("click", () => item.classList.toggle("checklist-item--checked"));
  });

  // Wire up collapsible section toggles (While You're On Site / Before You Leave)
  resultContent.querySelectorAll(".rs-section-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!expanded));
      btn.nextElementSibling.classList.toggle("hidden", expanded);
    });
  });

  // Wire up vision section toggle
  resultContent.querySelectorAll(".vision-toggle").forEach((btn) => {
    const section  = btn.closest(".vision-collapsible");
    const preview  = section.querySelector(".vision-preview");
    const full     = section.querySelector(".vision-full");
    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!expanded));
      btn.textContent = expanded ? "Show" : "Hide";
      preview.classList.toggle("hidden", !expanded);
      full.classList.toggle("hidden", expanded);
    });
  });

  form.classList.add("hidden");
  historyPanel.classList.add("hidden");
  resultPanel.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ── New report ────────────────────────────────────────────────
newReportBtn.addEventListener("click", resetToForm);
headerNewBtn.addEventListener("click", resetToForm);

function resetToForm() {
  currentData = null;
  resetPhotoSlots();
  noteEl.value = "";
  symptomEl.value = "";
  updateCharCount();
  jobIdEl.value = "";
  siteEl.value  = "";
  assetEl.value = "";
  submitBtn.disabled = true;
  resolutionNoteEl.value = "";
  resultContent.innerHTML = "";
  headerNewBtn.classList.add("hidden");
  resultPanel.classList.add("hidden");
  form.classList.remove("hidden");
  renderHistory();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ── Share text builder ────────────────────────────────────────
function buildShareText(d) {
  const ts = d.meta?.analyzed_at
    ? new Date(d.meta.analyzed_at).toLocaleString()
    : new Date().toLocaleString();
  const jc = d.meta?.job_context ?? {};
  const jobLine = [
    jc.jobId ? `Job: ${jc.jobId}` : "",
    jc.site  ? `Site: ${jc.site}` : "",
    jc.asset ? `Asset: ${jc.asset}` : "",
  ].filter(Boolean).join(" | ");

  const lines = [`Lensfield Report — ${ts}`, `Risk: ${d.risk_level} | Category: ${(d.category ?? "").toUpperCase()}`];
  if (jobLine) lines.push(jobLine);
  if (d.meta?.symptom) lines.push(`Symptom: ${d.meta.symptom}`);
  lines.push("", `Summary: ${d.summary}`);
  if ((d.possible_causes ?? []).length > 0) {
    lines.push("", "Possible Causes:");
    d.possible_causes.forEach((c) => lines.push(`  • ${c}`));
  }
  if ((d.hazards ?? []).length > 0) {
    lines.push("", "Hazards:");
    d.hazards.forEach((h) => lines.push(`  • ${h}`));
  }
  if ((d.recommended_actions ?? []).length > 0) {
    lines.push("", "Recommended Actions:");
    d.recommended_actions.forEach((a) => lines.push(`  • ${a}`));
  }
  if ((d.parts_materials ?? []).length > 0) {
    lines.push("", "Parts / Materials:");
    d.parts_materials.forEach((p) => lines.push(`  • ${p}`));
  }
  if (d.billable_notes) lines.push("", `Billable Notes: ${d.billable_notes}`);
  lines.push(
    "",
    `Follow-up Required: ${d.follow_up_required ? "Yes" : "No"}`,
    `Estimated Resolution: ${d.estimated_resolution}`,
  );
  return lines.join("\n");
}

// ── Share Report ──────────────────────────────────────────────
shareBtn.addEventListener("click", async () => {
  if (!currentData) return;
  const text = buildShareText(currentData);
  if (navigator.share) {
    try {
      await navigator.share({ title: `Lensfield Report — ${currentData.risk_level} Risk`, text });
    } catch (err) {
      if (err.name !== "AbortError") showToast("Share failed");
    }
  } else {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied to clipboard");
    } catch {
      showToast("Share not available on this browser");
    }
  }
});

// ── Customer Report ───────────────────────────────────────────
customerReportBtn.addEventListener("click", async () => {
  if (!currentData) return;
  customerModal.classList.remove("hidden");
  customerModalLoading.classList.remove("hidden");
  customerModalText.textContent = "";

  try {
    const res = await fetch(`${API_BASE}/customer-report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...currentData, resolution_note: resolutionNoteEl.value.trim() || null }),
    });
    if (!res.ok) throw new Error(`${res.status}`);
    const { customer_report } = await res.json();
    customerModalText.textContent = customer_report;
  } catch {
    customerModalText.textContent = "Could not generate customer report. Please try again.";
  } finally {
    customerModalLoading.classList.add("hidden");
  }
});

customerModalClose.addEventListener("click", () => customerModal.classList.add("hidden"));
customerModal.addEventListener("click", (e) => {
  if (e.target === customerModal) customerModal.classList.add("hidden");
});

customerModalShare.addEventListener("click", async () => {
  const text = customerModalText.textContent;
  if (!text) return;
  if (navigator.share) {
    await navigator.share({ title: "Service Report", text }).catch(() => {});
  } else {
    await navigator.clipboard.writeText(text).catch(() => {});
    showToast("Copied");
  }
});

customerModalCopy.addEventListener("click", async () => {
  await navigator.clipboard.writeText(customerModalText.textContent).catch(() => {});
  showToast("Copied");
});

// ── Copy JSON ─────────────────────────────────────────────────
copyJsonBtn.addEventListener("click", async () => {
  if (!currentData) return;
  try {
    await navigator.clipboard.writeText(JSON.stringify(currentData, null, 2));
    showToast("Copied JSON");
  } catch {
    showToast("Copy failed — try long-pressing the text");
  }
});

// ── Copy Summary ──────────────────────────────────────────────
copySummaryBtn.addEventListener("click", async () => {
  if (!currentData) return;
  try {
    await navigator.clipboard.writeText(buildShareText(currentData));
    showToast("Copied summary");
  } catch {
    showToast("Copy failed");
  }
});

// ── Export PDF ────────────────────────────────────────────────
exportPdfBtn.addEventListener("click", () => window.print());

// ── More-options menu ─────────────────────────────────────────
const moreActionsBtn  = document.getElementById("more-actions-btn");
const moreActionsMenu = document.getElementById("more-actions-menu");

moreActionsBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  const open = !moreActionsMenu.classList.contains("hidden");
  moreActionsMenu.classList.toggle("hidden", open);
  moreActionsBtn.setAttribute("aria-expanded", String(!open));
});

document.addEventListener("click", () => {
  moreActionsMenu.classList.add("hidden");
  moreActionsBtn.setAttribute("aria-expanded", "false");
});

// ── Toast ─────────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("toast--visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("toast--visible"), 2200);
}

// ── Helpers ───────────────────────────────────────────────────
function setLoading(on) {
  loading.classList.toggle("hidden", !on);
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── PWA service worker ────────────────────────────────────────
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("SW registration failed:", err);
    });
  });
}

// ── Init ──────────────────────────────────────────────────────
renderHistory();
