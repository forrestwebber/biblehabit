"use client";
import { useState, useEffect } from "react";

export default function AppStoreBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("ios-banner-dismissed");
    // Only show on iOS Safari (not desktop, not Android, not Capacitor in-app)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isCapacitor = typeof (window as any).Capacitor !== "undefined" && (window as any).Capacitor.isNativePlatform?.();
    if (isIOS && !isCapacitor && !dismissed) setVisible(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem("ios-banner-dismissed", "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="w-full bg-violet-700 text-white px-4 py-2.5 flex items-center justify-between gap-3 z-50">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0 w-9 h-9 bg-white rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-violet-700" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight">BibleHabit for iPhone</p>
          <p className="text-xs text-violet-200 leading-tight">Read on the go — now in beta</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <a
          href="https://testflight.apple.com/join/fx8k8Dnk"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white text-violet-700 text-xs font-bold px-3 py-1.5 rounded-full hover:bg-violet-50 transition"
        >
          Join Beta
        </a>
        <button onClick={dismiss} className="text-violet-200 hover:text-white transition p-1" aria-label="Dismiss">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
