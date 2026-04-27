import { STATUS_MESSAGES } from "./constants.js";

export function updateOverlayDisplay(input) {
  const wrapper = input.closest(".overlay-field");
  if (!wrapper) return;
  wrapper.dataset.display =
    input.value === "" || isNaN(input.value) ? "" : `${parseFloat(input.value).toFixed(1)}%`;
}

export function formatPercentInput(input) {
  const value = input.value.trim();
  input.value = value === "" || isNaN(value) ? "" : parseFloat(value).toFixed(1);
  updateOverlayDisplay(input);
}

export function initVoltageInputs() {
  document.querySelectorAll(".voltage-input").forEach((input) => {
    input.addEventListener("blur", function () {
      formatPercentInput(this);
    });
    formatPercentInput(input);
  });
}

export function initPercentInputs() {
  document.querySelectorAll(".percent-input").forEach((input) => {
    input.addEventListener("blur", function () {
      formatPercentInput(this);
    });
    formatPercentInput(input);
  });
}

export function setCalcMode(mode) {
  const el = document.getElementById("calcMode");
  if (!el) return;
  const isManual = mode === "manual";
  el.textContent = isManual ? "РЕЖИМ: РУЧНИЙ" : "РЕЖИМ: АВТО";
  el.classList.toggle("manual", isManual);
  el.classList.toggle("auto", !isManual);
}

export function setApplyStatus(state) {
  const el = document.getElementById("applyStatus");
  if (!el) return;

  el.textContent = STATUS_MESSAGES[state] || STATUS_MESSAGES.pending;
  el.classList.toggle("applied", state === "applied");
}

export function showToast(appState, message) {
  const toastEl = document.getElementById("toast");
  if (!toastEl) return;

  if (appState.toastTimer) clearTimeout(appState.toastTimer);
  toastEl.textContent = message;
  toastEl.classList.add("show");
  appState.toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2400);
}

export function syncCheckboxUI() {
  const vwOn = document.getElementById("vw_en")?.checked;
  const vqOn = document.getElementById("vq_en")?.checked;

  document.querySelectorAll(".vw-input").forEach((input) => {
    input.disabled = !vwOn;
    input.classList.toggle("disabled-input", !vwOn);
    const field = input.closest(".overlay-field");
    if (field) field.classList.toggle("disabled-field", !vwOn);
  });

  document.querySelectorAll(".vq-input").forEach((input) => {
    input.disabled = !vqOn;
    input.classList.toggle("disabled-input", !vqOn);
    const field = input.closest(".overlay-field");
    if (field) field.classList.toggle("disabled-field", !vqOn);
  });

  document.getElementById("chartVW")?.parentElement?.classList.toggle("disabled-chart", !vwOn);
  document.getElementById("chartVQ")?.parentElement?.classList.toggle("disabled-chart", !vqOn);
}

function setupCheckboxHandlers() {
  document.getElementById("vw_en")?.addEventListener("change", syncCheckboxUI);
  document.getElementById("vq_en")?.addEventListener("change", syncCheckboxUI);
}

export function setGuideFocus(appState, guide, renderCharts) {
  appState.activeGuide = guide;
  document.body.dataset.guide = guide || "";
  renderCharts();
}

export function setupLayoutWatchers(scheduleLayoutRerender) {
  const imgA = document.getElementById("imgGridSettings");
  const imgB = document.getElementById("imgGridSettingsVwVq");

  [imgA, imgB].forEach((img) => {
    if (!img) return;
    if (img.complete) {
      scheduleLayoutRerender(0);
    } else {
      img.addEventListener("load", () => scheduleLayoutRerender(0), { once: true });
    }
  });

  window.addEventListener("resize", () => scheduleLayoutRerender(120));
}

export function setupEventHandlers({
  appState,
  onLimitChange,
  applyLimitPreset,
  resetSelectedProfile,
  refreshAll,
  syncData,
  renderCharts,
}) {
  const limitStart = document.getElementById("limitStart");
  const limitVoltage = document.getElementById("limitVoltage");

  document.getElementById("vNom")?.addEventListener("change", refreshAll);
  document.getElementById("applyPresetBtn")?.addEventListener("click", applyLimitPreset);
  document.getElementById("resetProfileBtn")?.addEventListener("click", resetSelectedProfile);

  limitStart?.addEventListener("input", () => onLimitChange("start"));
  limitStart?.addEventListener("focus", () => setGuideFocus(appState, "start", renderCharts));
  limitStart?.addEventListener("blur", () => setGuideFocus(appState, null, renderCharts));

  limitVoltage?.addEventListener("input", () => onLimitChange("limit"));
  limitVoltage?.addEventListener("focus", () => setGuideFocus(appState, "limit", renderCharts));
  limitVoltage?.addEventListener("blur", () => setGuideFocus(appState, null, renderCharts));

  document.querySelectorAll(".overlay-input").forEach((input) => {
    input.addEventListener("input", syncData);
  });

  setupCheckboxHandlers();
}

export function applyStateToInputs(dataState) {
  for (let i = 0; i < 4; i++) {
    document.getElementById(`vw_v${i + 1}`).value = dataState.vw.v[i].toFixed(1);
    document.getElementById(`vw_p${i + 1}`).value = dataState.vw.p[i].toFixed(1);
    document.getElementById(`vq_v${i + 1}`).value = dataState.vq.v[i].toFixed(1);
    document.getElementById(`vq_q${i + 1}`).value = dataState.vq.q[i].toFixed(1);
  }

  document.getElementById("vq_lock_in").value = dataState.vq.lock_in.toFixed(1);
  document.getElementById("vq_lock_out").value = dataState.vq.lock_out.toFixed(1);

  document.querySelectorAll(".overlay-field .overlay-input").forEach(updateOverlayDisplay);
}
