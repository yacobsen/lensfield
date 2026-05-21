// ── Config ────────────────────────────────────────────────────
// In production builds, set VITE_API_BASE_URL=https://your-api.com
// In dev, leave unset — Vite proxy routes /analyze to localhost:3001
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

// ── DOM refs ──────────────────────────────────────────────────
const form             = document.getElementById("report-form");
const photoInput       = document.getElementById("photo-input");
const photoPreview     = document.getElementById("photo-preview");
const photoPlaceholder = document.getElementById("photo-placeholder");
const retakeBtn        = document.getElementById("retake-btn");
const noteEl           = document.getElementById("note");
const submitBtn        = document.getElementById("submit-btn");
const loading          = document.getElementById("loading");
const resultPanel      = document.getElementById("result-panel");
const resultContent    = document.getElementById("result-content");
const severityBadge    = document.getElementById("severity-badge");
const newReportBtn     = document.getElementById("new-report-btn");
const headerNewBtn     = document.getElementById("header-new-btn");
const resultSubtitle   = document.getElementById("result-subtitle");
const historyPanel     = document.getElementById("history-panel");
const historyList      = document.getElementById("history-list");
const clearHistoryBtn  = document.getElementById("clear-history-btn");
const copyJsonBtn      = document.getElementById("copy-json-btn");
const copySummaryBtn   = document.getElementById("copy-summary-btn");
const exportPdfBtn     = document.getElementById("export-pdf-btn");
const toastEl          = document.getElementById("toast");
const printTimestamp   = document.getElementById("print-timestamp");

// ── State ─────────────────────────────────────────────────────
let photoFile   = null;
let currentData = null; // holds the current analysis result for copy/export

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
      if (record) renderResult(record.payload, false); // false = don't re-save
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
noteEl.addEventListener("input", checkReady);

// ── Photo capture ─────────────────────────────────────────────
photoInput.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  photoFile = file;

  photoPreview.src = URL.createObjectURL(file);
  photoPreview.classList.remove("hidden");
  photoPlaceholder.classList.add("hidden");
  retakeBtn.classList.remove("hidden");
  checkReady();
});

retakeBtn.addEventListener("click", () => {
  photoFile = null;
  photoInput.value = "";
  photoPreview.src = "";
  photoPreview.classList.add("hidden");
  photoPlaceholder.classList.remove("hidden");
  retakeBtn.classList.add("hidden");
});

// ── Submit ────────────────────────────────────────────────────
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const note = noteEl.value.trim();
  if (!note) return;

  const formData = new FormData();
  formData.append("note", note);
  if (photoFile) formData.append("photo", photoFile);

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

  // Subtitle: category · timestamp
  const ts = data.meta?.analyzed_at
    ? new Date(data.meta.analyzed_at).toLocaleString()
    : new Date().toLocaleString();
  if (printTimestamp)  printTimestamp.textContent = ts;
  if (resultSubtitle)  resultSubtitle.textContent = `${data.category ?? "general"} · ${ts}`;

  // Show "New Report" in the top bar while result is visible
  headerNewBtn.classList.remove("hidden");

  const hazards    = data.hazards             ?? [];
  const parts      = data.parts_materials     ?? [];
  const actions    = data.recommended_actions ?? [];
  const followup   = data.follow_up_required ? "Yes" : "No";
  const confidence = data.confidence != null
    ? `${Math.round(data.confidence * 100)}%`
    : "—";

  resultContent.innerHTML = `
    <div class="result-section">
      <span class="rs-label">Summary</span>
      <p class="rs-text">${escHtml(data.summary ?? "—")}</p>
    </div>

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

    ${parts.length > 0 ? `
    <div class="result-section">
      <span class="rs-label">Parts &amp; Materials</span>
      <ul class="rs-list rs-list--parts">
        ${parts.map((p) => `<li>${escHtml(p)}</li>`).join("")}
      </ul>
    </div>` : ""}

    <div class="result-stats">
      <div class="result-stat">
        <span class="rs-label">Follow-up</span>
        <span class="stat-value ${data.follow_up_required ? "stat-value--yes" : "stat-value--no"}">${followup}</span>
      </div>
      <div class="result-stat">
        <span class="rs-label">Est. Resolution</span>
        <span class="stat-value">${escHtml(data.estimated_resolution ?? "—")}</span>
      </div>
    </div>

    <div class="result-meta">
      <span>Analyzed: ${escHtml(ts)}</span>
      <span>Model: ${escHtml(data.meta?.model ?? "—")}</span>
      <span>Photo: ${data.meta?.photo_included ? "Yes" : "No"}</span>
      <span>Confidence: ${confidence}</span>
    </div>
  `;

  form.classList.add("hidden");
  historyPanel.classList.add("hidden");
  resultPanel.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ── New report ────────────────────────────────────────────────
newReportBtn.addEventListener("click", resetToForm);
headerNewBtn.addEventListener("click", resetToForm);

function resetToForm() {
  photoFile   = null;
  currentData = null;
  photoInput.value  = "";
  photoPreview.src  = "";
  photoPreview.classList.add("hidden");
  photoPlaceholder.classList.remove("hidden");
  retakeBtn.classList.add("hidden");
  noteEl.value      = "";
  submitBtn.disabled = true;
  resultContent.innerHTML = "";

  headerNewBtn.classList.add("hidden");
  resultPanel.classList.add("hidden");
  form.classList.remove("hidden");
  renderHistory();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

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
  const d  = currentData;
  const ts = d.meta?.analyzed_at
    ? new Date(d.meta.analyzed_at).toLocaleString()
    : new Date().toLocaleString();

  const lines = [
    `Field Tech Report — ${ts}`,
    `Risk: ${d.risk_level} | Category: ${d.category}`,
    "",
    `Summary: ${d.summary}`,
  ];
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
  lines.push(
    "",
    `Follow-up Required: ${d.follow_up_required ? "Yes" : "No"}`,
    `Estimated Resolution: ${d.estimated_resolution}`,
  );

  try {
    await navigator.clipboard.writeText(lines.join("\n"));
    showToast("Copied summary");
  } catch {
    showToast("Copy failed");
  }
});

// ── Export PDF ────────────────────────────────────────────────
exportPdfBtn.addEventListener("click", () => {
  window.print();
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
