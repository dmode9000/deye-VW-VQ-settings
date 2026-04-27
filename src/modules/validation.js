import { LIMIT_DEFAULTS, VALIDATION_MESSAGES } from "./constants.js";

export function getLimitVoltage() {
  const v = parseFloat(document.getElementById("limitVoltage")?.value);
  return isNaN(v) ? LIMIT_DEFAULTS.limitVoltage : v;
}

export function getStartVoltage() {
  const v = parseFloat(document.getElementById("limitStart")?.value);
  return isNaN(v) ? LIMIT_DEFAULTS.startVoltage : v;
}

export function updateLimitInfo() {
  const vNomEl = document.getElementById("vNom");
  if (!vNomEl) return;

  const vNom = parseInt(vNomEl.value, 10);
  const percentEl = document.getElementById("limitPercent");
  const nominalEl = document.getElementById("nominalValue");

  if (percentEl) {
    percentEl.textContent = ((getLimitVoltage() / vNom) * 100).toFixed(1);
  }
  if (nominalEl) {
    nominalEl.textContent = vNom.toFixed(0);
  }
}

export function validateThresholds() {
  const warningEl = document.getElementById("limitWarning");
  if (!warningEl) return true;

  const startVoltage = getStartVoltage();
  const limitVoltage = getLimitVoltage();

  if (startVoltage >= limitVoltage) {
    warningEl.textContent = VALIDATION_MESSAGES.startMustBeLessThanLimit;
    warningEl.classList.remove("hidden", "advice");
    return false;
  }

  if (limitVoltage - startVoltage < 2) {
    warningEl.textContent = VALIDATION_MESSAGES.narrowInterval;
    warningEl.classList.remove("hidden");
    warningEl.classList.add("advice");
    return true;
  }

  warningEl.textContent = "";
  warningEl.classList.add("hidden");
  warningEl.classList.remove("advice");
  return true;
}
