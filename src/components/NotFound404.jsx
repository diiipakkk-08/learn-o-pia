/**
 * NotFound404.jsx
 * High-craft branded academic 404 page for Learn-O-Pia.
 */

import React from 'react';
import { ArrowLeft, BookOpen, GraduationCap, ShoppingBag, Compass, Search } from 'lucide-react';

export default function NotFound404({ setCurrentView }) {
  const navigate = (view) => {
    if (setCurrentView) {
      setCurrentView(view);
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-[85vh] bg-canvas text-text-primary flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-border-subtle bg-surface p-8 sm:p-10 shadow-modal space-y-6 relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-accent-forest/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-accent-amber/5 rounded-full blur-2xl pointer-events-none" />

        {/* Status Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border-subtle bg-canvas text-[11px] font-mono-tabular font-bold uppercase tracking-wider text-text-muted">
          <Compass size={13} className="text-accent-forest" />
          <span>404 • UNRESOLVED ACADEMIC ROUTE</span>
        </div>

        {/* Hero 404 Display */}
        <div className="space-y-2">
          <div className="font-editorial text-7xl sm:text-8xl font-bold tracking-tighter text-text-primary leading-none select-none">
            404
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-editorial text-text-primary">
            Resource or Page Not Located
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-sm mx-auto">
            The lecture stream, semester folder, or workspace link you requested is unavailable or may have been reorganized.
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="pt-2">
          <button
            onClick={() => navigate('my-learning')}
            className="w-full py-3 px-5 rounded-xl text-xs sm:text-sm font-semibold bg-accent-ink text-text-on-dark flex items-center justify-center gap-2.5 hover:opacity-95 shadow-sm transition-opacity cursor-pointer"
          >
            <ArrowLeft size={15} />
            <span>Return to Academic Dashboard</span>
          </button>
        </div>

        {/* Quick Portal Links */}
        <div className="pt-4 border-t border-border-subtle">
          <div className="text-[11px] font-mono-tabular uppercase tracking-wider text-text-muted mb-3">
            Quick Jump to Workspaces
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => navigate('learning')}
              className="p-2.5 rounded-lg border border-border-subtle bg-canvas hover:bg-surface-hover text-left flex flex-col items-center sm:items-start gap-1 transition-colors cursor-pointer group"
            >
              <BookOpen size={16} className="text-accent-forest group-hover:scale-105 transition-transform" />
              <span className="text-xs font-semibold text-text-primary">Courses</span>
              <span className="text-[10px] text-text-muted hidden sm:inline">All Playlists</span>
            </button>

            <button
              onClick={() => navigate('academics')}
              className="p-2.5 rounded-lg border border-border-subtle bg-canvas hover:bg-surface-hover text-left flex flex-col items-center sm:items-start gap-1 transition-colors cursor-pointer group"
            >
              <GraduationCap size={16} className="text-accent-ink group-hover:scale-105 transition-transform" />
              <span className="text-xs font-semibold text-text-primary">Academics</span>
              <span className="text-[10px] text-text-muted hidden sm:inline">Notes & PYQs</span>
            </button>

            <button
              onClick={() => navigate('marketplace')}
              className="p-2.5 rounded-lg border border-border-subtle bg-canvas hover:bg-surface-hover text-left flex flex-col items-center sm:items-start gap-1 transition-colors cursor-pointer group"
            >
              <ShoppingBag size={16} className="text-accent-amber group-hover:scale-105 transition-transform" />
              <span className="text-xs font-semibold text-text-primary">Marketplace</span>
              <span className="text-[10px] text-text-muted hidden sm:inline">Student Gear</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
