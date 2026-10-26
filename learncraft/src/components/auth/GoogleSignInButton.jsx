import { useRef, useState } from "react";
import { loadGsiScript, registerGsiCallback } from "../../services/googleIdentity";

export default function GoogleSignInButton({
  onSuccess,
  onError,
  loading = false,
  text = "continue_with",
}) {
  const [signingIn, setSigningIn] = useState(false);

  const clientId = (() => {
    const raw = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    return typeof raw === "string" ? raw.trim().replace(/^["']|["']$/g, "") : "";
  })();

  // Stable refs — re-renders never re-register GSI
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  async function handleClick() {
    if (loading || signingIn) return;

    if (!clientId) {
      onErrorRef.current?.("Google Client ID is not configured.");
      return;
    }

    setSigningIn(true);
    try {
      await loadGsiScript();

      registerGsiCallback(
        clientId,
        (credential) => {
          setSigningIn(false);
          onSuccessRef.current?.(credential);
        },
        (errMsg) => {
          setSigningIn(false);
          onErrorRef.current?.(errMsg || "Google sign-in failed.");
        }
      );

      // Render an off-screen GSI button and click it to satisfy the
      // user-gesture requirement for popup auth.
      const tempDiv = document.createElement("div");
      tempDiv.style.cssText =
        "position:fixed;top:-9999px;left:-9999px;width:200px;height:44px;overflow:hidden;";
      document.body.appendChild(tempDiv);

      window.google.accounts.id.renderButton(tempDiv, {
        type: "standard",
        size: "large",
        text: text === "signup_with" ? "signup_with" : "continue_with",
        width: 200,
      });

      const gsiBtn =
        tempDiv.querySelector("div[role=button]") ||
        tempDiv.querySelector("button");

      if (gsiBtn) {
        gsiBtn.click();
      } else {
        setSigningIn(false);
        onErrorRef.current?.(
          "Sign-in popup was blocked. Please allow popups for this site and try again."
        );
      }

      setTimeout(() => {
        if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
      }, 3000);
    } catch (err) {
      setSigningIn(false);
      onErrorRef.current?.(err.message || "Failed to load Google Sign-In.");
    }
  }

  const label =
    loading || signingIn
      ? "Signing in..."
      : text === "signup_with"
      ? "Sign up with Google"
      : "Continue with Google";

  return (
    <div className="google-btn-container">
      {/* Custom-styled button — identical to Microsoft social-button */}
      <button
        type="button"
        className="social-button"
        disabled={loading || signingIn}
        onClick={handleClick}
        aria-label={label}
      >
        {/* Official Google coloured G logo (SVG) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
          width="20"
          height="20"
          aria-hidden="true"
          style={{ flexShrink: 0 }}
        >
          <path
            fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
          />
          <path
            fill="#FBBC05"
            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
          />
          <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
          />
        </svg>
        <span>{label}</span>
      </button>
    </div>
  );
}
