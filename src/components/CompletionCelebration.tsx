"use client";
import { useEffect, useState } from "react";
import type { LevelInfo } from "@/lib/xp-store";

interface Props {
  dayNumber: number;
  chaptersCount: number;
  xpEarned: number;
  streak: number;
  levelInfo: LevelInfo;
  onDismiss: () => void;
}

const CONFETTI_COLORS = [
  "#f59e0b", "#f97316", "#10b981", "#6366f1", "#ec4899",
  "#3b82f6", "#eab308", "#8b5cf6", "#22c55e", "#ef4444",
];

interface Particle {
  id: number;
  x: number;
  color: string;
  size: number;
  duration: number;
  delay: number;
  rotation: number;
}

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 6 + Math.random() * 6,
    duration: 1.8 + Math.random() * 1.4,
    delay: Math.random() * 0.8,
    rotation: Math.random() * 360,
  }));
}

export default function CompletionCelebration({
  dayNumber, chaptersCount, xpEarned, streak, levelInfo, onDismiss,
}: Props) {
  const [particles] = useState<Particle[]>(() => generateParticles(32));
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Tiny delay so CSS transitions fire
    requestAnimationFrame(() => setVisible(true));
  }, []);

  function handleDismiss() {
    setVisible(false);
    setTimeout(onDismiss, 200);
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-200 ${
        visible ? "bg-black/65 backdrop-blur-sm" : "bg-black/0"
      }`}
      onClick={handleDismiss}
    >
      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute top-0 rounded-sm animate-confetti"
            style={{
              left: `${p.x}%`,
              width: p.size,
              height: p.size * 0.6,
              background: p.color,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              transform: `rotate(${p.rotation}deg)`,
            }}
          />
        ))}
      </div>

      {/* Card */}
      <div
        className={`relative mx-4 w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ${
          visible ? "scale-100 opacity-100 translate-y-0" : "scale-90 opacity-0 translate-y-8"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top gradient strip */}
        <div className="h-2 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400" />

        <div className="p-8 text-center">
          {/* Checkmark */}
          <div className="animate-check-pop inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-200 mb-5">
            <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12">
              <path
                d="M5 13l4 4L19 7"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-extrabold text-slate-900 mb-1">
            Day {dayNumber} Complete!
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            {chaptersCount === 1 ? "1 chapter" : `${chaptersCount} chapters`} read today
          </p>

          {/* XP earned */}
          <div className="animate-xp-pop inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 mb-5">
            <span className="text-2xl">⚡</span>
            <div className="text-left">
              <p className="text-amber-700 text-xs font-semibold uppercase tracking-wider">Scripture Points</p>
              <p className="text-amber-900 text-xl font-extrabold">+{xpEarned} XP</p>
            </div>
          </div>

          {/* Streak + Level row */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {/* Streak */}
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-3">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="text-xl animate-flame-pulse inline-block">🔥</span>
                <span className="text-2xl font-extrabold text-orange-600">{streak}</span>
              </div>
              <p className="text-xs text-orange-500 font-medium">day streak</p>
            </div>
            {/* Level */}
            <div className="bg-violet-50 border border-violet-100 rounded-2xl p-3">
              <p className="text-xl mb-1">{levelInfo.emoji}</p>
              <p className="text-sm font-extrabold text-violet-800">{levelInfo.title}</p>
              <p className="text-xs text-violet-500">Level {levelInfo.level}</p>
            </div>
          </div>

          {/* Level progress bar */}
          {!levelInfo.isMax && (
            <div className="mb-6">
              <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                <span>{levelInfo.currentXP} XP</span>
                <span>{levelInfo.nextXP} XP → {levelInfo.level < 6 ? "" : "Max"}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 transition-all duration-1000"
                  style={{ width: `${levelInfo.progressPct}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1.5">{levelInfo.nextXP - levelInfo.currentXP} XP to next level</p>
            </div>
          )}

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            className="w-full bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white font-bold py-4 rounded-2xl text-lg transition-all active:scale-95 shadow-lg shadow-violet-200"
          >
            Awesome! 🎉
          </button>
        </div>
      </div>
    </div>
  );
}
