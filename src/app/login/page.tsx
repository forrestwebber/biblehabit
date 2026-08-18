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
  // Where to send the user after a successful sign-in/signup — defaults to
  // /dashboard, but callers like /pricing pass their own return path (e.g.
  // /pricing?intent=monthly) so a checkout click can resume after auth.
  const nextPath = searchParams.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"signup" | "signin">(initialMode);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

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
            // Close the in-app browser
            await Browser.close();

            // Extract tokens from URL hash or query params
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
                setMessage("Sign-in failed. Please try again.");
                setLoading(false);
              }
            } else {
              // No tokens in hash — may be a code-flow redirect; exchange code
              const code = params.get("code");
              if (code) {
                const { error } = await supabase.auth.exchangeCodeForSession(code);
                if (!error) {
                  window.location.href = "/dashboard";
                } else {
                  setIsError(true);
                  setMessage("Sign-in failed. Please try again.");
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

  const handleGoogle = async () => {
    setLoading(true);
    const isNative = typeof (window as any).Capacitor !== "undefined" && (window as any).Capacitor.isNativePlatform?.();

    if (isNative) {
      // Use custom URL scheme so the session lands in WKWebView, not SFSafariViewController
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "keycloak",
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
          // Deep link callback handled by appUrlOpen listener above
        } catch {
          window.location.href = data.url;
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "keycloak",
        options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}` },
      });
      if (error) {
        setIsError(true);
        setMessage(error.message);
      }
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!isValidEmail(email)) {
      setIsError(true);
      setMessage("Enter your email address above, then click Forgot password.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
    });
    setIsError(!!error);
    setMessage(error ? error.message : "Password reset email sent! Check your inbox.");
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
        // "User already registered" — try signing in instead
        if (error.message?.toLowerCase().includes("already registered")) {
          const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (signInError) {
            setIsError(true);
            setMessage(signInError.message);
          } else {
            window.location.href = nextPath;
          }
        } else {
          setIsError(true);
          setMessage(error.message);
        }
      } else if (data.session) {
        window.location.href = nextPath;
        return;
      } else {
        // Autoconfirm on — sign in immediately to get a session
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          setIsError(false);
          setMessage("Account created! Check your email to confirm, then sign in.");
        } else {
          window.location.href = nextPath;
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setIsError(true);
        setMessage(error.message);
      } else {
        window.location.href = nextPath;
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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#F7F2E8" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2.5">
            <span
              className="inline-block w-7 h-7 rounded-full"
              style={{
                background: "radial-gradient(circle at 50% 68%, #F2D793 0%, #C9962E 58%, #A97C1E 100%)",
                boxShadow: "0 0 0 4px rgba(201,150,46,0.14)",
              }}
            />
            <span className="text-2xl font-semibold" style={{ fontFamily: "'Lora', serif", color: "#221C14", letterSpacing: "-0.01em" }}>BibleHabit</span>
          </a>
          <p className="mt-2" style={{ color: "#5C5142" }}>
            {mode === "signup" ? "Start your daily reading journey — free forever" : "Welcome back"}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-xl p-1 mb-6" style={{ background: "#F2E9D6" }}>
          <button
            onClick={() => setMode("signup")}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition"
            style={mode === "signup" ? { background: "#FFFDF8", color: "#221C14", boxShadow: "0 2px 8px rgba(34,28,20,0.08)" } : { color: "#8A7F6E" }}
          >
            Create Account
          </button>
          <button
            onClick={() => setMode("signin")}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition"
            style={mode === "signin" ? { background: "#FFFDF8", color: "#221C14", boxShadow: "0 2px 8px rgba(34,28,20,0.08)" } : { color: "#8A7F6E" }}
          >
            Sign In
          </button>
        </div>

        <div className="rounded-2xl p-8" style={{ background: "#FFFDF8", border: "1px solid rgba(34,28,20,0.08)", boxShadow: "0 16px 40px -24px rgba(34,28,20,0.3)" }}>
          <div className="space-y-3">
            {/* Google sign-in removed 2026-08-18: AUTH_GOOGLE_ID/SECRET were never
                migrated to the current Supabase project (sjpvmvullpzimcgmhhxk), so
                the button only ever rendered as a disabled "coming soon" stub. App
                Review flagged that as a broken login option (2.1a) and, because it
                was still visibly offered as a third-party login, also required
                Sign in with Apple (4.8) as an equivalent. Email/password is the
                only auth method now, which needs neither. Re-add Google only once
                real OAuth credentials are configured end to end AND Sign in with
                Apple ships alongside it. See handleGoogle() below, left intact and
                unused for that future re-wire. */}

            {/* Email field with inline validation */}
            <div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                onKeyDown={(e) => e.key === "Enter" && handleEmail()}
                className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9962E]"
                style={{ border: `1px solid ${emailInvalid ? "#f87171" : "rgba(34,28,20,0.14)"}`, color: "#221C14", background: "#FFFDF8" }}
              />
              {emailInvalid && (
                <p className="text-xs text-red-500 mt-1 ml-1">Enter a valid email address</p>
              )}
            </div>

            {/* Password field with show/hide toggle */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder={mode === "signup" ? "Create a password" : "Password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEmail()}
                className="w-full px-4 py-3 pr-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9962E]"
                style={{ border: "1px solid rgba(34,28,20,0.14)", color: "#221C14", background: "#FFFDF8" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition"
                style={{ color: "#8A7F6E" }}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  /* Eye-off icon */
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7 0-1.26.54-2.44 1.44-3.39M6.34 6.34A8.955 8.955 0 0112 5c5 0 9 4 9 7 0 1.26-.54 2.44-1.44 3.39M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                  </svg>
                ) : (
                  /* Eye icon */
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {mode === "signin" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm transition"
                  style={{ color: "#8A6A1E" }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Password strength requirements (signup only) */}
            {mode === "signup" && password.length > 0 && (
              <div className="rounded-lg p-3 space-y-1.5" style={{ background: "#F2E9D6" }}>
                {[
                  { met: strength.length, label: "At least 8 characters" },
                  { met: strength.upper, label: "One uppercase letter" },
                  { met: strength.lower, label: "One lowercase letter" },
                  { met: strength.numberOrSymbol, label: "One number or symbol" },
                ].map(({ met, label }) => (
                  <div key={label} className="flex items-center gap-2 text-xs">
                    <span style={{ color: met ? "#7A8B6F" : "#B0A48C" }}>
                      {met ? "✓" : "·"}
                    </span>
                    <span style={{ color: met ? "#5A7A4E" : "#8A7F6E" }}>{label}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleEmail}
              disabled={submitDisabled}
              className="w-full py-3 px-4 rounded-lg transition font-semibold disabled:opacity-50"
              style={{ background: "#221C14", color: "#F7F2E8" }}
            >
              {loading ? "..." : mode === "signup" ? "Create Free Account →" : "Sign In →"}
            </button>

            {/* Error/success banner */}
            {message && (
              isError ? (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-full">
                  <span className="text-red-500 font-bold text-base leading-none">✕</span>
                  <span>{message}</span>
                </div>
              ) : (
                <p className="text-sm text-center p-3 rounded-lg" style={{ color: "#5A7A4E", background: "#F0F4EC" }}>{message}</p>
              )
            )}
          </div>

          {mode === "signup" && (
            <p className="text-xs text-center mt-4" style={{ color: "#8A7F6E" }}>Free to start · No credit card required</p>
          )}
        </div>

        <p className="text-center text-sm mt-6" style={{ color: "#8A7F6E" }}>
          {mode === "signup" ? (
            <>Already have an account?{" "}<button onClick={() => setMode("signin")} className="font-medium transition" style={{ color: "#8A6A1E" }}>Sign in</button></>
          ) : (
            <>New to BibleHabit?{" "}<button onClick={() => setMode("signup")} className="font-medium transition" style={{ color: "#8A6A1E" }}>Create a free account</button></>
          )}
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "#F7F2E8" }}><div style={{ color: "#8A7F6E" }}>Loading...</div></div>}>
      <LoginContent />
    </Suspense>
  );
}
