import { useEffect, useRef, useState } from "react";
import GoogleConfigModal from "./GoogleConfigModal";

export default function GoogleSignInButton({
  onSuccess,
  onError,
  loading = false,
  text = "continue_with",
}) {
  const gisContainerRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(() => Boolean(typeof window !== "undefined" && window.google?.accounts?.id));
  const [showConfigModal, setShowConfigModal] = useState(false);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (typeof window === "undefined" || window.google?.accounts?.id) {
      return;
    }

    const existingScript = document.getElementById("google-gsi-client");
    if (existingScript) {
      const handleLoad = () => setScriptLoaded(true);
      existingScript.addEventListener("load", handleLoad);
      return () => existingScript.removeEventListener("load", handleLoad);
    }

    const script = document.createElement("script");
    script.id = "google-gsi-client";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !gisContainerRef.current || !clientId) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response?.credential) {
            onSuccess(response.credential);
          } else if (onError) {
            onError("No credential returned by Google.");
          }
        },
        auto_select: false,
      });

      gisContainerRef.current.innerHTML = "";

      window.google.accounts.id.renderButton(gisContainerRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: text === "signup_with" ? "signup_with" : "continue_with",
        width: 380,
      });
    } catch (err) {
      console.warn("Google Sign-In initialization error:", err);
      if (onError) onError(err.message || "Could not initialize Google Sign-In.");
    }
  }, [scriptLoaded, clientId, onSuccess, onError, text]);

  function handleButtonClick() {
    if (!clientId) {
      setShowConfigModal(true);
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      setShowConfigModal(true);
    }
  }

  function handleSelectDemo(account) {
    setShowConfigModal(false);
    const token = "test_google_token:" + JSON.stringify(account);
    onSuccess(token);
  }

  return (
    <div className="google-btn-container">
      {/* 1. Exactly the original LearnCraft .social-button matching the Microsoft button */}
      <button
        type="button"
        className="social-button"
        disabled={loading}
        onClick={handleButtonClick}
      >
        <span className="google-mark">G</span>
        <span>{loading ? "Signing in..." : "Continue with Google"}</span>
      </button>

      {/* 2. Transparent Google GIS layer over the button for direct Google popup when clientId is present */}
      {clientId && scriptLoaded && (
        <div
          ref={gisContainerRef}
          className="google-gis-layer"
          title="Continue with Google"
        />
      )}

      <GoogleConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onSelectDemoAccount={handleSelectDemo}
      />
    </div>
  );
}
