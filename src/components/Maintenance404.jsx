/**
 * Maintenance404.jsx
 * Displayed when the database or platform is undergoing scheduled maintenance.
 */

import React from 'react';
import { Wrench, RefreshCw } from 'lucide-react';

export default function Maintenance404({ onRefresh, onAdminClick }) {
  return (
    <div className="min-h-screen bg-canvas text-text-primary flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-lg rounded-2xl border border-border-subtle bg-surface p-8 sm:p-10 shadow-modal space-y-6">
        <div className="w-12 h-12 rounded-xl border border-border-strong bg-[#EFECE6] flex items-center justify-center mx-auto text-accent-amber">
          <Wrench size={24} />
        </div>

        <div className="space-y-2">
          <span className="font-editorial text-3xl sm:text-4xl tracking-tight block">
            Scheduled Maintenance
          </span>
          <p className="text-sm text-text-secondary max-w-md mx-auto leading-relaxed">
            The Learn-O-Pia database infrastructure is currently undergoing scheduled optimization. All student routines and course progress are securely preserved.
          </p>
        </div>

        <div className="p-3.5 rounded-lg border border-[#F5DCB7] bg-accent-amber-bg text-accent-amber text-xs font-mono-tabular">
          INFRASTRUCTURE UPGRADE IN PROGRESS • CHECK BACK MOMENTARILY
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onRefresh || (() => window.location.reload())}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark flex items-center justify-center gap-2 hover:opacity-95"
          >
            <RefreshCw size={14} />
            <span>Check Platform Status</span>
          </button>
          {onAdminClick && (
            <button
              onClick={onAdminClick}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-semibold border border-border-strong bg-surface hover:bg-surface-hover"
            >
              Staff Access
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
