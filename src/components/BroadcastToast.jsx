import React, { useState, useEffect, useRef } from 'react';
import { Megaphone, ExternalLink, X, BellRing, ArrowRight } from 'lucide-react';

// Play a pleasant, subtle notification chime via Web Audio API (zero audio file dependencies)
const playNotificationSound = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Chime Note 1: C5 (523.25Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Chime Note 2: G5 (783.99Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(783.99, now + 0.12);
    gain2.gain.setValueAtTime(0.1, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.65);
  } catch (err) {
    // Audio context may be restricted before user gesture
  }
};

export default function BroadcastToast() {
  const [activeToast, setActiveToast] = useState(null);
  const [progress, setProgress] = useState(100);
  const isPausedRef = useRef(false);

  useEffect(() => {
    const handleBroadcastEvent = (e) => {
      const ann = e.detail;
      if (!ann || !ann.title) return;

      setActiveToast(ann);
      setProgress(100);
      playNotificationSound();
    };

    window.addEventListener('learnopia_broadcast_received', handleBroadcastEvent);
    return () => window.removeEventListener('learnopia_broadcast_received', handleBroadcastEvent);
  }, []);

  // Timer countdown with pause on hover
  useEffect(() => {
    if (!activeToast) return;

    const totalDurationMs = 8000;
    const intervalMs = 50;
    const decrement = (intervalMs / totalDurationMs) * 100;

    const timer = setInterval(() => {
      if (isPausedRef.current) return;
      setProgress((prev) => {
        if (prev <= decrement) {
          clearInterval(timer);
          setActiveToast(null);
          return 0;
        }
        return prev - decrement;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [activeToast]);

  if (!activeToast) return null;

  const linkUrl = activeToast.link || activeToast.resourceUrl;

  return (
    <div
      role="alert"
      onMouseEnter={() => { isPausedRef.current = true; }}
      onMouseLeave={() => { isPausedRef.current = false; }}
      className="fixed top-4 right-4 sm:top-5 sm:right-6 z-[99999] max-w-sm sm:max-w-md w-[92%] sm:w-full rounded-xl border border-border-strong bg-surface text-text-primary p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto"
      style={{
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.08)'
      }}
    >
      {/* Top Header Tag & Close */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-mono-tabular font-bold uppercase tracking-wider text-accent-forest flex items-center gap-1.5">
            <Megaphone size={12} />
            <span>Campus Broadcast</span>
          </span>
          {activeToast.category && (
            <span className="text-[9px] font-mono-tabular px-1.5 py-0.2 rounded bg-subtle text-text-muted">
              {activeToast.category}
            </span>
          )}
        </div>

        <button
          onClick={() => setActiveToast(null)}
          className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          title="Dismiss notice"
          aria-label="Dismiss notice"
        >
          <X size={14} />
        </button>
      </div>

      {/* Main Announcement Content */}
      <div className="pt-2.5 space-y-1.5 text-left">
        <h4 className="text-sm font-bold text-text-primary leading-snug line-clamp-2">
          {activeToast.title}
        </h4>
        <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">
          {activeToast.message}
        </p>

        <div className="text-[11px] font-mono-tabular text-text-muted pt-0.5">
          Broadcast by <strong className="text-text-secondary">{activeToast.author || 'Academic Admin'}</strong>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 mt-2 flex items-center justify-between gap-2 border-t border-border-subtle flex-wrap">
        <button
          onClick={() => {
            setActiveToast(null);
            window.dispatchEvent(new CustomEvent('learnopia_open_announcements'));
          }}
          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-accent-ink text-text-on-dark hover:opacity-95 flex items-center gap-1.5 cursor-pointer transition-opacity shadow-xs"
        >
          <BellRing size={12} />
          <span>View All Notices</span>
        </button>

        {linkUrl && (
          <a
            href={linkUrl}
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-accent-forest/10 text-accent-forest hover:bg-accent-forest/20 flex items-center gap-1 transition-colors"
          >
            <span>{activeToast.resourceTitle || 'Open Attachment'}</span>
            <ExternalLink size={11} />
          </a>
        )}
      </div>

      {/* Remaining Time Progress Bar */}
      <div className="w-full bg-border-subtle/50 h-1 rounded-full overflow-hidden mt-3">
        <div
          className="h-full bg-accent-forest transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
