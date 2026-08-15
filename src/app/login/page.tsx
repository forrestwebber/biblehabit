"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function checkPasswordStrength(pw: string) {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    numberOrSymbol: /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pw),
  };
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function LoginContent() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signin" ? "signin" : "signup";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"signup" | "signin">(initialMode);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [isNativeApp, setIsNativeApp] = useState(false);

  const strength = checkPasswordStrength(password);
  const allStrengthMet = strength.length && strength.upper && strength.lower && strength.numberOrSymbol;
  const emailInvalid = emailTouched && email.length > 0 && !isValidEmail(email);

  // Handle deep link callback on native (biblehabit://auth/callback#access_token=...&refresh_token=...)
  useEffect(() => {
    let cleanupFn: (() => void) | undefined;

    const setupAppUrlListener = async () => {
      const isNative = typeof (window as any).Capacitor !== "undefined" && (window as any).Capacitor.isNativePlatform?.();
      if (!isNative) return;

      try {
        const { App } = await import("@capacitor/app");
        const { Browser } = await import("@capacitor/browser");

        const listener = await App.addListener("appUrlOpen", async (event: { url: string }) => {
          const url = event.url;
          if (url.startsWith("biblehabit://")) {
            await Browser.close();
            const hashPart = url.split("#")[1] || url.split("?")[1] || "";
            const params = new URLSearchParams(hashPart);
            const access_token = params.get("access_token");
            const refresh_token = params.get("refresh_token");

            if (access_token && refresh_token) {
              const { error } = await supabase.auth.setSession({ access_token, refresh_token });
              if (!error) {
                window.location.href = "/dashboard";
              } else {
                setIsError(true);
                setMessage("Sign-in didn't go through. Please try again.");
                setLoading(false);
              }
            } else {
              const code = params.get("code");
              if (code) {
                const { error } = await supabase.auth.exchangeCodeForSession(code);
                if (!error) {
                  window.location.href = "/dashboard";
                } else {
                  setIsError(true);
                  setMessage("Sign-in didn't go through. Please try again.");
                  setLoading(false);
                }
              }
            }
          }
        });

        cleanupFn = () => listener.remove();
      } catch (e) {
        console.error("App URL listener setup failed:", e);
      }
    };

    setupAppUrlListener();
    return () => { cleanupFn?.(); };
  }, []);

  useEffect(() => {
    const cap = (window as any).Capacitor;
    setIsNativeApp(!!cap?.isNativePlatform?.());
  }, []);

  const handleGoogle = async () => {
    setLoading(true);
    const isNative = typeof (window as any).Capacitor !== "undefined" && (window as any).Capacitor.isNativePlatform?.();

    if (isNative) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `biblehabit://auth/callback`,
          skipBrowserRedirect: true,
        },
      });
      if (error) {
        setIsError(true);
        setMessage(error.message);
        setLoading(false);
        return;
      }
      if (data.url) {
        try {
          const { Browser } = await import("@capacitor/browser");
          await Browser.open({ url: data.url, presentationStyle: "popover" });
        } catch {
          window.location.href = data.url;
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
      });
      if (error) {
        setIsError(true);
        setMessage(error.message);
      }
    }
    setLoading(false);
  };

  // Guideline 4.8: Sign in with Apple, offered alongside Google in the iOS app.
  // Native ASAuthorization via the SignInWithApple Capacitor plugin; the raw nonce
  // goes to Supabase, its SHA-256 goes to Apple.
  const handleApple = async () => {
    setLoading(true);
    setMessage("");
    setIsError(false);
    try {
      const plugin = (window as any).Capacitor?.Plugins?.SignInWithApple;
      if (!plugin) throw new Error("Apple Sign-In is unavailable on this device.");
      const rawNonce = crypto.randomUUID();
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(rawNonce));
      const hashedNonce = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
      const result = await plugin.authorize({
        clientId: "co.biblehabit.app",
        scopes: "email name",
        nonce: hashedNonce,
      });
      const idToken = result?.response?.identityToken;
      if (!idToken) throw new Error("cancelled");
      const { error } = await supabase.auth.signInWithIdToken({ provider: "apple", token: idToken, nonce: rawNonce });
      if (error) throw error;
      window.location.href = "/dashboard";
      return;
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (!/cancell?ed|1001/i.test(msg)) {
        setIsError(true);
        setMessage(msg === "Apple Sign-In is unavailable on this device." ? msg : "Apple sign-in didn't go through. Please try again.");
      }
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!isValidEmail(email)) {
      setIsError(true);
      setMessage("Enter your email address above, then choose Forgot password.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
    });
    setIsError(!!error);
    setMessage(error ? error.message : "Password reset email sent. Check your inbox.");
    setLoading(false);
  };

  const handleEmail = async () => {
    setEmailTouched(true);
    if (!isValidEmail(email)) return;
    if (mode === "signup" && !allStrengthMet) return;
    setLoading(true);
    setMessage("");
    setIsError(false);
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        if (error.message?.toLowerCase().includes("already registered")) {
          const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (signInError) {
            setIsError(true);
            setMessage(signInError.message);
          } else {
            window.location.href = "/dashboard";
          }
        } else {
          setIsError(true);
          setMessage(error.message);
        }
      } else if (data.session) {
        window.location.href = "/dashboard";
        return;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          setIsError(false);
          setMessage("Account created. Check your email to confirm, then sign in.");
        } else {
          window.location.href = "/dashboard";
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setIsError(true);
        setMessage(error.message);
      } else {
        window.location.href = "/dashboard";
      }
    }
    setLoading(false);
  };

  const submitDisabled =
    loading ||
    !email ||
    !password ||
    (mode === "signup" && !allStrengthMet) ||
    emailInvalid;

  return (
    <div className="bh-app relative flex flex-col" style={{ minHeight: "calc(100vh - var(--bh-banner-h, 0px))" }}>
      {/* Dawn wash — rises from the bottom edge, behind everything */}
      <div className="bh-dawn pointer-events-none absolute inset-x-0 bottom-0" style={{ height: "60%" }} />

      <div className="relative flex-1 flex flex-col justify-center mx-auto w-full max-w-md" style={{ padding: "54px 24px 8px" }}>
        <div className="flex flex-col" style={{ gap: 26 }}>
          {/* Brand moment */}
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-mark.svg" alt="BibleHabit" width={52} height={52} />
          </div>

          <div>
            <h1 className="bh-serif" style={{ fontWeight: 500, fontSize: 40, lineHeight: 1.15, color: "var(--text-body)" }}>
              Pick up right where you are.
            </h1>
            <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--text-secondary)", marginTop: 12 }}>
              You&apos;ve been reading a while. BibleHabit just keeps the place, and quietly works out the pace.
            </p>
          </div>

          <div className="flex flex-col" style={{ gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                Email
              </label>
              <input
                type="email"
                className="bh-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                onKeyDown={(e) => e.key === "Enter" && handleEmail()}
                style={emailInvalid ? { borderColor: "var(--clay-500)" } : undefined}
              />
              {emailInvalid && (
                <p style={{ fontSize: 13, color: "var(--clay-500)", marginTop: 4 }}>Enter a valid email address</p>
              )}
            </div>

            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="bh-input"
                  placeholder={mode === "signup" ? "Create a password" : "Your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEmail()}
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-muted)" }}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13.875 18.825A10.05 10.05 0 0 1 12 19c-5 0-9-4-9-7 0-1.26.54-2.44 1.44-3.39M6.34 6.34A8.955 8.955 0 0 1 12 5c5 0 9 4 9 7 0 1.26-.54 2.44-1.44 3.39M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" /><path d="M3 3l18 18" /></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            {mode === "signin" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  style={{ fontSize: 13, color: "var(--text-accent)", fontWeight: 500 }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            {mode === "signup" && password.length > 0 && !allStrengthMet && (
              <div className="bh-sunk" style={{ padding: "10px 14px" }}>
                {[
                  { met: strength.length, label: "At least 8 characters" },
                  { met: strength.upper, label: "One uppercase letter" },
                  { met: strength.lower, label: "One lowercase letter" },
                  { met: strength.numberOrSymbol, label: "One number or symbol" },
                ].map(({ met, label }) => (
                  <div key={label} className="flex items-center" style={{ gap: 8, fontSize: 13, lineHeight: 1.6, color: met ? "var(--sage-700)" : "var(--text-muted)" }}>
                    <span>{met ? "✓" : "·"}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            )}

            <p style={{ fontSize: 13, lineHeight: 1.4, color: "var(--text-muted)" }}>
              We send one note a day at the time you choose — never a catch-up.
            </p>

            {message && (
              <div
                className="bh-fade"
                style={{
                  fontSize: 14,
                  lineHeight: 1.5,
                  borderRadius: 10,
                  padding: "10px 14px",
                  background: isError ? "var(--clay-100)" : "var(--sage-100)",
                  color: isError ? "var(--clay-500)" : "var(--sage-700)",
                }}
              >
                {message}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer CTA block — clear of the home indicator */}
      <div className="relative mx-auto w-full max-w-md" style={{ padding: "14px 24px calc(env(safe-area-inset-bottom, 0px) + 20px)" }}>
        <button onClick={handleEmail} disabled={submitDisabled} className="bh-btn bh-btn-primary">
          {loading ? "One moment…" : mode === "signup" ? "Get started" : "Sign in"}
        </button>
        {isNativeApp && (
          <button
            onClick={handleApple}
            disabled={loading}
            className="bh-btn"
            style={{ marginTop: 4, background: "#000", color: "#fff", border: "1px solid #000" }}
          >
            &#63743; Continue with Apple
          </button>
        )}
        <button onClick={handleGoogle} disabled={loading} className="bh-btn bh-btn-quiet" style={{ marginTop: 4 }}>
          Continue with Google
        </button>
        <button
          onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setMessage(""); }}
          className="bh-btn bh-btn-quiet"
        >
          {mode === "signup" ? "Sign in" : "New here? Get started"}
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="bh-app flex items-center justify-center" style={{ minHeight: "100vh", color: "var(--text-muted)" }}>Loading…</div>}>
      <LoginContent />
    </Suspense>
  );
}
