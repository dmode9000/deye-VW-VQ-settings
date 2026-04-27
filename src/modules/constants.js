export const LIMIT_DEFAULTS = {
  limitVoltage: 250,
  startVoltage: 245,
};

export const STATUS_MESSAGES = {
  default: "Базові криві активні",
  start: "Змінено початок · Перерахуйте",
  limit: "Змінено поріг · Перерахуйте",
  pending: "Параметри змінено · Перерахуйте",
  manual: "Точки змінено вручну",
  applied: "✓ Криві застосовано",
};

export const VALIDATION_MESSAGES = {
  startMustBeLessThanLimit: "Початок має бути меншим за Кінець обмеження.",
  narrowInterval: "Малий інтервал - крива може бути занадто різкою.",
};

export const CHART_TEXT = {
  xAxisTitle: "Напруга АС мережі (% від номіналу та Вольти)",
  vwTitle: "Крива Volt-Watt  V(W)",
  vwYAxisTitle: "Активна потужність експорту P (%)",
  vqTitle: "Крива Volt-VAr  V(Q)",
  vqYAxisTitle: "Реактивна потужність Q (%)",
  vqInjectLabel: "<b>↑ Ін'єкція (сприяє підвищенню напруги)</b>",
  vqAbsorbLabel: "<b>↓ Абсорбція (сприяє зниженню напруги)</b>",
};

export const CHART_COLORS = {
  title: "#0d1b2a",
  axisText: "#8ca3b8",
  grid: "#eef2f8",
  axisLine: "#dde5ef",
  zeroLine: "#c3d0de",
  hoverBg: "#0d1b2a",
  hoverBorder: "#005f8e",
  hoverText: "#ffffff",
  lineLimit: "#e03e3e",
  lineStart: "#8ca3b8",
  lineVW: "#d97706",
  fillVW: "rgba(217,119,6,0.07)",
  lineVQ: "#0891b2",
  inject: "#059669",
  surfaceWhite92: "rgba(255,255,255,0.92)",
  surfaceWhite90: "rgba(255,255,255,0.9)",
};
