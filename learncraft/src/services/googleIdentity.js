/**
 * LearnCraft Google Identity Services (GIS) Lifecycle Manager
 *
 * Solves:
 * 1. Script duplication: Loads the Google Identity Services script exactly once.
 * 2. Multiple initialization warning: Calls `window.google.accounts.id.initialize()`
 *    EXACTLY ONCE for the application lifecycle per client_id.
 * 3. Dynamic callback dispatch: Maintains a stable listener ref so switching
 *    between Login and Register or re-rendering never re-initializes GIS.
 * 4. Popup & Clickjacking: Renders official Google buttons cleanly without CSS
 *    opacity hacks or transform scaling that cause Google security rejections.
 */

let scriptPromise = null;
let isInitialized = false;
let initializedClientId = null;
let activeCallback = null;
let activeErrorCallback = null;

/**
 * Loads the Google Identity Services client script (https://accounts.google.com/gsi/client)
 * exactly once. Returns a cached promise.
 */
export function loadGsiScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window is not available"));
  }

  // If already available on window, resolve immediately
  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google.accounts.id);
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    // Check if script tag already exists in DOM
    const existing = document.getElementById("google-gsi-client");
    if (existing) {
      if (window.google?.accounts?.id) {
        resolve(window.google.accounts.id);
        return;
      }
      existing.addEventListener("load", () => {
        if (window.google?.accounts?.id) {
          resolve(window.google.accounts.id);
        } else {
          reject(new Error("Google Identity Services not initialized on window"));
        }
      });
      existing.addEventListener("error", () => {
        scriptPromise = null;
        reject(new Error("Failed to load Google Identity Services script"));
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "google-gsi-client";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        resolve(window.google.accounts.id);
      } else {
        reject(new Error("Google Identity Services not initialized on window"));
      }
    };
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Failed to load Google Identity Services script"));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Ensures `google.accounts.id.initialize()` is called strictly once for the given clientId.
 * Updates the active callback without triggering multiple initialization warnings.
 */
export function registerGsiCallback(clientId, onCredential, onError) {
  activeCallback = onCredential;
  activeErrorCallback = onError;

  if (!clientId || typeof window === "undefined" || !window.google?.accounts?.id) {
    return false;
  }

  // If already initialized for this exact client ID, do NOT call initialize() again!
  if (isInitialized && initializedClientId === clientId) {
    return true;
  }

  try {
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response?.credential) {
          if (typeof activeCallback === "function") {
            activeCallback(response.credential);
          }
        } else {
          if (typeof activeErrorCallback === "function") {
            activeErrorCallback("No credential returned by Google.");
          }
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
      itp_support: true,
    });

    isInitialized = true;
    initializedClientId = clientId;
    return true;
  } catch (err) {
    console.warn("GSI initialization error:", err);
    if (typeof activeErrorCallback === "function") {
      activeErrorCallback(err.message || "Failed to initialize Google Sign-In");
    }
    return false;
  }
}

/**
 * Renders the official Google button inside the target container.
 */
export function renderGsiButton(container, options = {}) {
  if (!container || typeof window === "undefined" || !window.google?.accounts?.id) {
    return false;
  }

  container.innerHTML = "";

  try {
    window.google.accounts.id.renderButton(container, {
      type: "standard",
      theme: "outline",
      size: "large",
      shape: "pill",
      text: options.text === "signup_with" ? "signup_with" : "continue_with",
      logo_alignment: "left",
      width: options.width || 380,
    });
    return true;
  } catch (err) {
    console.warn("GSI renderButton error:", err);
    return false;
  }
}

/**
 * Checks if GSI has been initialized.
 */
export function isGsiInitialized() {
  return isInitialized;
}
