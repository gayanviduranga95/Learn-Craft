import { useEffect, useRef, useState } from "react";
import GoogleConfigModal from "./GoogleConfigModal";
import {
  loadGsiScript,
  registerGsiCallback,
  renderGsiButton,
} from "../../services/googleIdentity";

export default function GoogleSignInButton({
  onSuccess,
  onError,
  loading = false,
  text = "continue_with",
}) {
  const gisContainerRef = useRef(null);
  const [gisReady, setGisReady] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Keep stable refs to callbacks so changing props don't trigger re-initialization
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    let isCancelled = false;

    if (!clientId) {
      setGisReady(false);
      return;
    }

    loadGsiScript()
      .then(() => {
        if (isCancelled || !gisContainerRef.current) return;

        // Register callback with the singleton GSI lifecycle manager
        // (google.accounts.id.initialize is called strictly once)
        registerGsiCallback(
          clientId,
          (credential) => {
            onSuccessRef.current?.(credential);
          },
          (errMsg) => {
            onErrorRef.current?.(errMsg);
          }
        );

        // Render official button without clickjacking-triggering CSS hacks
        const rendered = renderGsiButton(gisContainerRef.current, {
          text: text === "signup_with" ? "signup_with" : "continue_with",
          width: 380,
        });

        if (rendered && !isCancelled) {
          setGisReady(true);
        }
      })
      .catch((err) => {
        console.warn("Google Sign-In load error:", err.message);
        if (!isCancelled) {
          setGisReady(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [clientId, text]);

  function handleSelectDemo(account) {
    setShowConfigModal(false);
    const token = "test_google_token:" + JSON.stringify(account);
    onSuccessRef.current?.(token);
  }

  return (
    <div className="google-btn-container">
      {/* 1. Official Google Identity Services button container */}
      <div
        ref={gisContainerRef}
        className="google-gis-container"
        style={{ display: gisReady && !loading ? "flex" : "none" }}
      />

      {/* 2. Fallback / Loading LearnCraft social button */}
      {(!gisReady || loading) && (
        <button
          type="button"
          className="social-button"
          disabled={loading}
          onClick={() => setShowConfigModal(true)}
        >
          <span className="google-mark">G</span>
          <span>
            {loading
              ? "Signing in..."
              : text === "signup_with"
              ? "Sign up with Google"
              : "Continue with Google"}
          </span>
        </button>
      )}

      {/* 3. Demo / Config helper for testing without live Google credentials */}
      <button
        type="button"
        className="google-demo-link"
        onClick={() => setShowConfigModal(true)}
      >
        Google setup &amp; demo accounts
      </button>

      <GoogleConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onSelectDemoAccount={handleSelectDemo}
      />
    </div>
  );
}
