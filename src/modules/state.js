export const dataStateByVnom = {
  220: {
    vw: { v: [110.0, 111.6, 112.9, 113.7], p: [100, 80, 45, 0] },
    vq: { v: [95.5, 100.1, 108.2, 113.6], q: [44, 0, 0, -44], lock_in: 20.9, lock_out: 5.2 },
  },
  230: {
    vw: { v: [105.2, 106.7, 108.0, 108.8], p: [100, 80, 45, 0] },
    vq: { v: [91.3, 95.7, 103.5, 108.7], q: [44, 0, 0, -44], lock_in: 20, lock_out: 5 },
  },
  240: {
    vw: { v: [100.8, 102.3, 103.5, 104.3], p: [100, 80, 45, 0] },
    vq: { v: [87.5, 91.7, 99.2, 104.2], q: [44, 0, 0, -44], lock_in: 19.2, lock_out: 4.8 },
  },
};

export function cloneStateForVnom(vNom) {
  return JSON.parse(JSON.stringify(dataStateByVnom[vNom]));
}

export const appState = {
  dataState: cloneStateForVnom(230),
  activeGuide: null,
  toastTimer: null,
  chartsInitialized: false,
  layoutRerenderTimer: null,
};
