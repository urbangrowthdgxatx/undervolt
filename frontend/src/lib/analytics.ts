declare global {
  interface Window {
    gtag?: (...args: [string, string, Record<string, unknown>?]) => void;
  }
}

export function trackEvent(action: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, params);
  }
}
