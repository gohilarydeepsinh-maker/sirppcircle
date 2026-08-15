/**
 * Median (Web-to-App) environment helpers.
 *
 * Google refuses OAuth inside embedded WebViews (it answers with
 * "invalid request" / "disallowed_useragent"), so inside the Median Android
 * app we must hand the sign-in off to the system browser and come back to the
 * app through the https callback URL (Android App Links / custom scheme).
 */

type MedianBridge = {
  window?: { open?: (opts: { url: string; target?: string }) => void };
  externalbrowser?: { open?: (url: string) => void };
};

function bridge(): MedianBridge | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as Record<string, MedianBridge | undefined>;
  return w["median"] ?? w["gonative"];
}

/** True when the page is running inside the Median Android/iOS app container. */
export function isMedianApp(): boolean {
  if (typeof window === "undefined") return false;
  if (bridge()) return true;
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes("median") || ua.includes("gonative");
}

/** True for any embedded WebView where Google blocks OAuth. */
export function isEmbeddedWebView(): boolean {
  if (typeof window === "undefined") return false;
  if (isMedianApp()) return true;
  const ua = navigator.userAgent;
  // Android WebViews advertise "; wv" and lack a real Chrome shell.
  if (/Android/.test(ua) && /; wv\)/.test(ua)) return true;
  // iOS in-app browsers: no Safari token.
  return /iPhone|iPad|iPod/.test(ua) && !/Safari/.test(ua);
}

/** Open a URL in the device's real browser (Chrome / Custom Tab), not the WebView. */
export function openInSystemBrowser(url: string) {
  const api = bridge();
  try {
    if (api?.externalbrowser?.open) {
      api.externalbrowser.open(url);
      return;
    }
    if (api?.window?.open) {
      api.window.open({ url, target: "external" });
      return;
    }
  } catch (error) {
    console.warn("[median] bridge open failed", error);
  }
  // Median also accepts its command URLs, and plain browsers just open a tab.
  try {
    if (isMedianApp()) {
      window.location.href = `median://window/open?url=${encodeURIComponent(url)}&target=external`;
      return;
    }
  } catch (error) {
    console.warn("[median] command url failed", error);
  }
  window.open(url, "_blank", "noopener");
}
