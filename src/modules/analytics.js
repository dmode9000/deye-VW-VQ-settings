const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() || "";

function ensureDataLayer() {
  if (!window.dataLayer) {
    window.dataLayer = [];
  }
}

function setupGtagShim() {
  ensureDataLayer();

  if (typeof window.gtag !== "function") {
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
  }
}

function injectGaScript(measurementId) {
  if (document.querySelector('script[data-ga="gtag"]')) {
    return;
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  script.dataset.ga = "gtag";
  document.head.appendChild(script);
}

export function trackPageView() {
  if (typeof window.gtag !== "function" || !GA_MEASUREMENT_ID) return;

  window.gtag("event", "page_view", {
    page_title: document.title,
    page_location: window.location.href,
    page_path: `${window.location.pathname}${window.location.search}`,
  });
}

export function initAnalytics() {
  if (!GA_MEASUREMENT_ID) {
    return false;
  }

  setupGtagShim();
  injectGaScript(GA_MEASUREMENT_ID);

  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID, {
    send_page_view: false,
    anonymize_ip: true,
  });

  trackPageView();
  window.addEventListener("popstate", trackPageView);
  window.addEventListener("hashchange", trackPageView);

  return true;
}
