/**
 * NotFound404.jsx
 * Displayed when an accessed lecture series, study note, or resource route is missing.
 */

import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function NotFound404({ setCurrentView }) {
  return (
    <div className="min-h-screen bg-canvas text-text-primary flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-surface p-8 shadow-modal space-y-6">
        <div className="font-editorial text-7xl font-bold tracking-tight text-text-primary">
          404
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-bold font-editorial">
            Study Resource Not Found
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            The lecture series, document, or section you were trying to access does not exist or may have been relocated.
          </p>
        </div>

        <button
          onClick={() => setCurrentView ? setCurrentView('my-learning') : (window.location.href = '/')}
          className="w-full py-2.5 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark flex items-center justify-center gap-2 hover:opacity-95"
        >
          <ArrowLeft size={14} />
          <span>Return to Dashboard</span>
        </button>
      </div>
    </div>
  );
}
