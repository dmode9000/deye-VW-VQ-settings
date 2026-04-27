import { appState, cloneStateForVnom, dataStateByVnom } from "./modules/state.js";
import { renderCharts } from "./modules/chart.js";
import {
  applyStateToInputs,
  formatPercentInput,
  initPercentInputs,
  initVoltageInputs,
  setApplyStatus,
  setCalcMode,
  setupEventHandlers,
  setupLayoutWatchers,
  showToast,
  syncCheckboxUI,
  updateOverlayDisplay,
} from "./modules/ui.js";
import {
  getLimitVoltage,
  getStartVoltage,
  updateLimitInfo,
  validateThresholds,
} from "./modules/validation.js";

function enforceMonotonicVoltages(prefix, values) {
  for (let i = 1; i < values.length; i++) {
    if (values[i] < values[i - 1]) values[i] = values[i - 1];
    const input = document.getElementById(`${prefix}${i + 1}`);
    if (input) {
      input.value = values[i].toFixed(1);
      updateOverlayDisplay(input);
    }
  }
}

function syncData() {
  for (let i = 0; i < 4; i++) {
    appState.dataState.vw.v[i] = parseFloat(document.getElementById(`vw_v${i + 1}`)?.value) || 0;
    appState.dataState.vw.p[i] = parseFloat(document.getElementById(`vw_p${i + 1}`)?.value) || 0;
    appState.dataState.vq.v[i] = parseFloat(document.getElementById(`vq_v${i + 1}`)?.value) || 0;
    appState.dataState.vq.q[i] = parseFloat(document.getElementById(`vq_q${i + 1}`)?.value) || 0;
  }

  enforceMonotonicVoltages("vw_v", appState.dataState.vw.v);
  enforceMonotonicVoltages("vq_v", appState.dataState.vq.v);

  appState.dataState.vq.lock_in = parseFloat(document.getElementById("vq_lock_in")?.value) || 0;
  appState.dataState.vq.lock_out = parseFloat(document.getElementById("vq_lock_out")?.value) || 0;

  document.querySelectorAll(".overlay-field .overlay-input").forEach(updateOverlayDisplay);
  setCalcMode("manual");
  setApplyStatus("manual");
  renderCharts({ appState, getLimitVoltage, getStartVoltage });
}

function applyLimitPreset() {
  if (!validateThresholds()) {
    setApplyStatus("pending");
    return;
  }

  const vNom = parseInt(document.getElementById("vNom")?.value, 10);
  const base = dataStateByVnom[vNom];
  const limitVoltage = getLimitVoltage();
  const startVoltage = getStartVoltage();

  const v1 = (startVoltage / vNom) * 100;
  const limitPercent = (limitVoltage / vNom) * 100;

  const prevV1 = appState.dataState.vw.v[0];
  const prevV2 = appState.dataState.vw.v[1];
  const prevV3 = appState.dataState.vw.v[2];
  const prevV4 = appState.dataState.vw.v[3];

  const prevRange = prevV4 - prevV1;
  const ratio2 = prevRange > 0 ? (prevV2 - prevV1) / prevRange : 1 / 3;
  const ratio3 = prevRange > 0 ? (prevV3 - prevV1) / prevRange : 2 / 3;

  const minGap = (0.1 / vNom) * 100;
  const newRange = limitPercent - v1;

  let v2 = v1 + ratio2 * newRange;
  let v3 = v1 + ratio3 * newRange;

  if (v2 <= v1 + minGap) v2 = v1 + minGap;
  if (v3 <= v2 + minGap) v3 = v2 + minGap;
  if (v3 >= limitPercent - minGap) v3 = limitPercent - minGap;
  if (v2 >= v3 - minGap) v2 = Math.max(v1 + minGap, v3 - minGap);

  appState.dataState.vw.v = [v1, v2, v3, limitPercent].map((x) => parseFloat(x.toFixed(1)));
  appState.dataState.vw.p = [...base.vw.p].map((x) => parseFloat(x.toFixed(1)));
  appState.dataState.vq.v = [base.vq.v[0], base.vq.v[1], v1, limitPercent].map((x) =>
    parseFloat(x.toFixed(1)),
  );
  appState.dataState.vq.q = [...base.vq.q].map((x) => parseFloat(x.toFixed(1)));

  document.getElementById("limitStart").value = ((v1 * vNom) / 100).toFixed(0);

  applyStateToInputs(appState.dataState);
  setCalcMode("auto");
  setApplyStatus("applied");
  updateLimitInfo();
  renderCharts({ appState, getLimitVoltage, getStartVoltage });
  showToast(appState, `✓ Криві оновлено для INV Output Voltage ${vNom} В`);
}

function refreshAll() {
  const vNom = parseInt(document.getElementById("vNom")?.value, 10);
  appState.dataState = cloneStateForVnom(vNom);
  applyStateToInputs(appState.dataState);
  syncCheckboxUI();
  setCalcMode("auto");
  setApplyStatus("default");
  updateLimitInfo();
  applyLimitPreset();
}

function resetSelectedProfile() {
  const vNom = parseInt(document.getElementById("vNom")?.value, 10);
  appState.dataState = cloneStateForVnom(vNom);
  applyStateToInputs(appState.dataState);
  setCalcMode("auto");
  setApplyStatus("default");
  updateLimitInfo();
  validateThresholds();
  renderCharts({ appState, getLimitVoltage, getStartVoltage });
  showToast(appState, `↺ Дефолтні точки для ${vNom} В відновлено`);
}

function onLimitChange(flag) {
  setCalcMode("auto");
  setApplyStatus(flag || "pending");
  validateThresholds();
  updateLimitInfo();
  renderCharts({ appState, getLimitVoltage, getStartVoltage });
}

function retryInitialRender(maxAttempts = 6, delayMs = 220) {
  let attempts = 0;

  const tick = () => {
    Promise.resolve(renderCharts({ appState, getLimitVoltage, getStartVoltage })).then((ok) => {
      if (ok || appState.chartsInitialized) return;
      attempts += 1;
      if (attempts < maxAttempts) {
        setTimeout(tick, delayMs);
      }
    });
  };

  requestAnimationFrame(tick);
}

function scheduleLayoutRerender(delay = 80) {
  if (appState.layoutRerenderTimer) clearTimeout(appState.layoutRerenderTimer);

  appState.layoutRerenderTimer = setTimeout(() => {
    if (appState.chartsInitialized) {
      renderCharts({ appState, getLimitVoltage, getStartVoltage });
    } else {
      retryInitialRender(3, 140);
    }
  }, delay);
}

function bootCharts() {
  refreshAll();
  retryInitialRender();
}

function buildInputs() {
  initVoltageInputs();
  initPercentInputs();

  setupEventHandlers({
    appState,
    onLimitChange,
    applyLimitPreset,
    resetSelectedProfile,
    refreshAll,
    syncData,
    renderCharts: () => renderCharts({ appState, getLimitVoltage, getStartVoltage }),
  });

  setupLayoutWatchers(scheduleLayoutRerender);
  syncCheckboxUI();
}

buildInputs();
bootCharts();

window.addEventListener(
  "load",
  () => {
    if (!appState.chartsInitialized) {
      retryInitialRender(6, 220);
      return;
    }
    renderCharts({ appState, getLimitVoltage, getStartVoltage });
  },
  { once: true },
);

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => {
    renderCharts({ appState, getLimitVoltage, getStartVoltage });
  });
}

window.formatPercentInput = formatPercentInput;
