"use client";
import { useEffect, useState } from "react";
import { X, Flame, CloudUpload } from "lucide-react";

interface SignUpGateProps {
  /** Current streak count to display */
  streak?: number;
  /** Callback when user dismisses without signing in */
  onDismiss: () => void;
}

export default function SignUpGate({ streak = 0, onDismiss }: SignUpGateProps) {
  const [visible, setVisible] = useState(false);

  // Animate in on mount
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 200);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-violet-100 transition-all duration-200 ${
          visible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center">
            <CloudUpload className="h-7 w-7 text-violet-600" />
          </div>
        </div>

        {/* Streak badge */}
        {streak > 0 && (
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-full px-4 py-1.5 text-sm font-semibold">
              <Flame className="h-4 w-4" />
              {streak}-day streak &mdash; don&apos;t lose it!
            </span>
          </div>
        )}

        {/* Headline */}
        <h2 className="text-xl font-bold text-slate-900 text-center mb-2">
          Save Your Progress
        </h2>

        {/* Copy */}
        <p className="text-slate-500 text-sm text-center mb-6 leading-relaxed">
          Your reading streak and history are saved locally. Sign in to sync
          across devices and never lose your progress.
        </p>

        {/* CTAs */}
        <div className="space-y-3">
          <a
            href="/login?mode=signup"
            className="flex items-center justify-center gap-2 w-full bg-violet-700 hover:bg-violet-800 text-white font-semibold py-3 rounded-xl transition"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign In with Google
          </a>

          <button
            onClick={handleDismiss}
            className="w-full text-slate-500 hover:text-slate-700 text-sm py-2 transition"
          >
            Continue Without Saving
          </button>
        </div>
      </div>
    </div>
  );
}
