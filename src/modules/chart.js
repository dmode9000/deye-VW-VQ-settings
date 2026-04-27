import { CHART_COLORS, CHART_TEXT } from "./constants.js";

let renderQueue = Promise.resolve(false);

export function interpolate(x, voltageArray, valueArray) {
  if (x <= voltageArray[0]) return valueArray[0];
  if (x >= voltageArray[voltageArray.length - 1]) return valueArray[valueArray.length - 1];

  for (let i = 0; i < voltageArray.length - 1; i++) {
    if (x >= voltageArray[i] && x <= voltageArray[i + 1]) {
      if (voltageArray[i + 1] === voltageArray[i]) return valueArray[i];
      return (
        valueArray[i] +
        ((valueArray[i + 1] - valueArray[i]) / (voltageArray[i + 1] - voltageArray[i])) *
          (x - voltageArray[i])
      );
    }
  }

  return 0;
}

export function generateDensePoints(voltageArray, valueArray, vNom) {
  const xSet = new Set(voltageArray);
  const pad = 2;
  const minX = voltageArray[0] - pad;
  const maxX = voltageArray[voltageArray.length - 1] + pad;

  for (let x = minX; x <= maxX; x += 0.1) {
    xSet.add(parseFloat(x.toFixed(1)));
  }

  const sortedX = Array.from(xSet).sort((a, b) => a - b);
  const denseX = [];
  const denseY = [];
  const denseCustom = [];

  sortedX.forEach((x) => {
    denseX.push(x);
    denseY.push(interpolate(x, voltageArray, valueArray));
    denseCustom.push(((x * vNom) / 100).toFixed(1));
  });

  return { x: denseX, y: denseY, custom: denseCustom, minX, maxX };
}

function doRenderCharts({ appState, getLimitVoltage, getStartVoltage }) {
  if (!window.Plotly || !window.Plotly.newPlot || !window.Plotly.react) {
    return Promise.resolve(false);
  }

  const chartVWEl = document.getElementById("chartVW");
  const chartVQEl = document.getElementById("chartVQ");
  if (!chartVWEl || !chartVQEl) return Promise.resolve(false);

  const vNom = parseInt(document.getElementById("vNom")?.value, 10);
  const limitVoltage = getLimitVoltage();
  const limitPercent = (limitVoltage / vNom) * 100;
  const startVoltage = getStartVoltage();
  const startPercent = (startVoltage / vNom) * 100;

  const isLimitActive = appState.activeGuide === "limit";
  const isStartActive = appState.activeGuide === "start";

  const denseVW = generateDensePoints(appState.dataState.vw.v, appState.dataState.vw.p, vNom);
  const denseVQ = generateDensePoints(appState.dataState.vq.v, appState.dataState.vq.q, vNom);

  const maxP = Math.max(100, ...appState.dataState.vw.p);
  const yVW = [0, maxP + 10];

  const minQ = Math.min(...appState.dataState.vq.q);
  const maxQ = Math.max(...appState.dataState.vq.q);
  const padQ = Math.max(15, (maxQ - minQ) * 0.1);
  const yVQ = minQ === 0 && maxQ === 0 ? [-50, 50] : [minQ - padQ, maxQ + padQ];

  const lightLayout = (
    title,
    yTitle,
    yRange,
    tickValues,
    minX,
    maxX,
    annotations = [],
    shapes = [],
  ) => ({
    title: {
      text: title,
      font: { size: 15, color: CHART_COLORS.title, family: "Sora, sans-serif", weight: 600 },
      x: 0.02,
      xanchor: "left",
    },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "#fafbfd",
    margin: { t: 52, b: 72, l: 58, r: 28 },
    xaxis: {
      title: {
        text: CHART_TEXT.xAxisTitle,
        font: { color: CHART_COLORS.axisText, size: 11, family: "Fira Mono" },
      },
      tickvals: tickValues,
      ticktext: tickValues.map((p) => `${p}%<br><b>${((p * vNom) / 100).toFixed(1)}V</b>`),
      gridcolor: CHART_COLORS.grid,
      gridwidth: 1,
      zerolinecolor: CHART_COLORS.axisLine,
      tickfont: { color: CHART_COLORS.axisText, size: 10, family: "Fira Mono" },
      range: [minX, maxX],
      linecolor: CHART_COLORS.axisLine,
      linewidth: 1,
    },
    yaxis: {
      title: {
        text: yTitle,
        font: { color: CHART_COLORS.axisText, size: 11, family: "Fira Mono" },
      },
      range: yRange,
      gridcolor: CHART_COLORS.grid,
      gridwidth: 1,
      zeroline: true,
      zerolinewidth: 1.5,
      zerolinecolor: CHART_COLORS.zeroLine,
      tickfont: { color: CHART_COLORS.axisText, size: 10, family: "Fira Mono" },
      linecolor: CHART_COLORS.axisLine,
      linewidth: 1,
    },
    annotations,
    shapes,
    hovermode: "closest",
    autosize: true,
    hoverlabel: {
      bgcolor: CHART_COLORS.hoverBg,
      bordercolor: CHART_COLORS.hoverBorder,
      font: { color: CHART_COLORS.hoverText, size: 12, family: "Fira Mono" },
    },
  });

  const limitLine = {
    type: "line",
    xref: "x",
    yref: "paper",
    x0: limitPercent,
    x1: limitPercent,
    y0: 0,
    y1: 1,
    line: { color: CHART_COLORS.lineLimit, width: isLimitActive ? 2.5 : 1.5, dash: "dot" },
  };

  const startLine = {
    type: "line",
    xref: "x",
    yref: "paper",
    x0: startPercent,
    x1: startPercent,
    y0: 0,
    y1: 1,
    line: { color: CHART_COLORS.lineStart, width: isStartActive ? 2 : 1, dash: "dot" },
  };

  const annot = (x, text, color, active) => ({
    xref: "x",
    yref: "paper",
    x,
    y: 1.02,
    text,
    showarrow: false,
    xanchor: "center",
    yanchor: "bottom",
    font: { color, size: active ? 10 : 9, family: "Sora", weight: active ? 700 : 500 },
    bgcolor: CHART_COLORS.surfaceWhite92,
    bordercolor: color,
    borderpad: 8,
    borderwidth: 1,
  });

  const limitAnnot = annot(
    limitPercent,
    `${limitVoltage.toFixed(0)} В (Кінець)`,
    CHART_COLORS.lineLimit,
    isLimitActive,
  );
  const startAnnot = annot(
    startPercent,
    `${startVoltage.toFixed(0)} В (Початок)`,
    CHART_COLORS.lineStart,
    isStartActive,
  );

  const vqAnnots = [
    {
      xref: "paper",
      x: 0.03,
      yref: "paper",
      y: 0.97,
      text: CHART_TEXT.vqInjectLabel,
      showarrow: false,
      xanchor: "left",
      yanchor: "top",
      font: { color: CHART_COLORS.inject, size: 11, family: "Sora" },
      bgcolor: CHART_COLORS.surfaceWhite90,
      bordercolor: CHART_COLORS.inject,
      borderpad: 4,
      borderwidth: 1,
    },
    {
      xref: "paper",
      x: 0.03,
      yref: "paper",
      y: 0.05,
      text: CHART_TEXT.vqAbsorbLabel,
      showarrow: false,
      xanchor: "left",
      yanchor: "bottom",
      font: { color: CHART_COLORS.lineLimit, size: 11, family: "Sora" },
      bgcolor: CHART_COLORS.surfaceWhite90,
      bordercolor: CHART_COLORS.lineLimit,
      borderpad: 4,
      borderwidth: 1,
    },
  ];

  const tVWLine = {
    x: denseVW.x,
    y: denseVW.y,
    mode: "lines",
    line: { color: CHART_COLORS.lineVW, width: 2.5 },
    customdata: denseVW.custom,
    hovertemplate: "<b>%{x:.1f}% (%{customdata} В)</b><br>P: %{y:.1f}%<extra></extra>",
    showlegend: false,
    fill: "tozeroy",
    fillcolor: CHART_COLORS.fillVW,
  };

  const tVWNodes = {
    x: appState.dataState.vw.v,
    y: appState.dataState.vw.p,
    mode: "markers",
    marker: { color: CHART_COLORS.lineVW, size: 9, line: { color: "#fff", width: 2 } },
    hoverinfo: "skip",
    showlegend: false,
  };

  const tVWZero = {
    x: [appState.dataState.vw.v[appState.dataState.vw.v.length - 1]],
    y: [appState.dataState.vw.p[appState.dataState.vw.p.length - 1]],
    mode: "markers",
    marker: { color: CHART_COLORS.lineLimit, size: 11, line: { color: "#fff", width: 2 } },
    hoverinfo: "skip",
    showlegend: false,
  };

  const tVQLine = {
    x: denseVQ.x,
    y: denseVQ.y,
    mode: "lines",
    line: { color: CHART_COLORS.lineVQ, width: 2.5 },
    customdata: denseVQ.custom,
    hovertemplate: "<b>%{x:.1f}% (%{customdata} В)</b><br>Q: %{y:.1f}%<extra></extra>",
    showlegend: false,
  };

  const tVQNodes = {
    x: appState.dataState.vq.v,
    y: appState.dataState.vq.q,
    mode: "markers",
    marker: { color: CHART_COLORS.lineVQ, size: 9, line: { color: "#fff", width: 2 } },
    hoverinfo: "skip",
    showlegend: false,
  };

  const cfg = { responsive: true, displayModeBar: false };

  const vwLayout = lightLayout(
    CHART_TEXT.vwTitle,
    CHART_TEXT.vwYAxisTitle,
    yVW,
    appState.dataState.vw.v,
    denseVW.minX,
    denseVW.maxX,
    [limitAnnot, startAnnot],
    [limitLine, startLine],
  );

  const vqLayout = lightLayout(
    CHART_TEXT.vqTitle,
    CHART_TEXT.vqYAxisTitle,
    yVQ,
    appState.dataState.vq.v,
    denseVQ.minX,
    denseVQ.maxX,
    [...vqAnnots, limitAnnot, startAnnot],
    [limitLine, startLine],
  );

  const vwRender = Plotly.newPlot(chartVWEl, [tVWLine, tVWNodes, tVWZero], vwLayout, cfg);
  const vqRender = Plotly.newPlot(chartVQEl, [tVQLine, tVQNodes], vqLayout, cfg);

  return Promise.all([vwRender, vqRender])
    .then(() => {
      appState.chartsInitialized = true;
      Plotly.Plots.resize(chartVWEl);
      Plotly.Plots.resize(chartVQEl);
      return true;
    })
    .catch(() => false);
}

export function renderCharts(args) {
  renderQueue = renderQueue.catch(() => false).then(() => doRenderCharts(args));
  return renderQueue;
}
