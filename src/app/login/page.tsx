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

  const strength = checkPasswordStrength(password);
  const allStrengthMet = strength.length && strength.upper && strength.lower && strength.numberOrSymbol;
  const emailInvalid = emailTouched && email.length > 0 && !isValidEmail(email);

  const handleGoogle = async () => {
    setLoading(true);
    const isNative = typeof (window as any).Capacitor !== "undefined" && (window as any).Capacitor.isNativePlatform?.();

    if (isNative) {
      // On iOS/Android: use in-app browser (SFSafariViewController) to avoid bouncing to Safari
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "keycloak",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
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
          // Listen for the callback — when SFSafariViewController navigates back to biblehabit.co,
          // Supabase will have set the session via the auth/callback route.
          Browser.addListener("browserFinished", () => {
            supabase.auth.getSession().then(({ data: { session } }) => {
              if (session) window.location.href = "/dashboard";
            });
          });
        } catch {
          // Fallback if Browser plugin unavailable
          window.location.href = data.url;
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "keycloak",
        options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
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
        // Autoconfirm on — sign in immediately to get a session
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          setIsError(false);
          setMessage("Account created! Check your email to confirm, then sign in.");
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="text-3xl font-bold text-slate-900">BibleHabit</a>
          <p className="text-slate-500 mt-2">
            {mode === "signup" ? "Start your daily reading journey — free forever" : "Welcome back"}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${mode === "signup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Create Account
          </button>
          <button
            onClick={() => setMode("signin")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${mode === "signin" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Sign In
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-violet-100 p-8">
          <div className="space-y-3">
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-3 px-4 rounded-lg hover:bg-slate-800 transition font-medium disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
              <div className="relative flex justify-center text-xs"><span className="bg-white px-4 text-slate-400">or with email</span></div>
            </div>

            {/* Email field with inline validation */}
            <div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                onKeyDown={(e) => e.key === "Enter" && handleEmail()}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-800 ${emailInvalid ? "border-red-400" : "border-slate-200"}`}
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
                className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
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
                  className="text-sm text-violet-600 hover:text-violet-800"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Password strength requirements (signup only) */}
            {mode === "signup" && password.length > 0 && (
              <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
                {[
                  { met: strength.length, label: "At least 8 characters" },
                  { met: strength.upper, label: "One uppercase letter" },
                  { met: strength.lower, label: "One lowercase letter" },
                  { met: strength.numberOrSymbol, label: "One number or symbol" },
                ].map(({ met, label }) => (
                  <div key={label} className="flex items-center gap-2 text-xs">
                    <span className={met ? "text-green-500" : "text-slate-400"}>
                      {met ? "✓" : "·"}
                    </span>
                    <span className={met ? "text-green-600" : "text-slate-400"}>{label}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleEmail}
              disabled={submitDisabled}
              className="w-full bg-violet-700 text-white py-3 px-4 rounded-lg hover:bg-violet-800 transition font-semibold disabled:opacity-50"
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
                <p className="text-sm text-center text-green-600 bg-green-50 p-3 rounded-lg">{message}</p>
              )
            )}
          </div>

          {mode === "signup" && (
            <p className="text-xs text-slate-400 text-center mt-4">Free forever · No credit card required</p>
          )}
        </div>

        <p className="text-center text-sm text-slate-400 mt-6">
          {mode === "signup" ? (
            <>Already have an account?{" "}<button onClick={() => setMode("signin")} className="text-violet-600 hover:text-violet-800 font-medium">Sign in</button></>
          ) : (
            <>New to BibleHabit?{" "}<button onClick={() => setMode("signup")} className="text-violet-600 hover:text-violet-800 font-medium">Create a free account</button></>
          )}
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-slate-400">Loading...</div></div>}>
      <LoginContent />
    </Suspense>
  );
}
