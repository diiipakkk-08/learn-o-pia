import React, { useState } from 'react';
import {
  Target,
  BookOpen,
  Heart,
  Scale,
  ArrowLeft
} from 'lucide-react';
import TermsModal from './TermsModal';

/**
 * About Page Component
 * Describes the philosophy and features of Learn-O-Pia:
 * 1. Focus-driven video player (distraction-free YouTube).
 * 2. Predictive Attendance and safe-bunk calculation.
 * 3. 100% Free educational ethos.
 */
export default function About({ setCurrentView }) {
  const [showTermsModal, setShowTermsModal] = useState(false);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in text-text-primary">
      {/* Return Button */}
      <button
        onClick={() => setCurrentView && setCurrentView('my-learning')}
        className="text-xs font-semibold text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition-colors cursor-pointer"
      >
        <ArrowLeft size={14} />
        <span>Return to Workspace</span>
      </button>

      {/* Hero Header */}
      <div className="rounded-2xl border border-border-subtle bg-surface p-8 sm:p-12 text-center space-y-4 shadow-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono-tabular font-medium border border-border-strong bg-[#EFECE6] text-text-secondary">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-forest" />
          <span>100% FREE ACADEMIC DESK</span>
        </div>

        <h1 className="font-editorial text-4xl sm:text-5xl tracking-tight max-w-2xl mx-auto">
          Built to make college learning quiet, structured, and completely free.
        </h1>

        <p className="text-sm sm:text-base text-text-secondary max-w-xl mx-auto leading-relaxed">
          Learnopia is an open educational workspace engineered by students, for students. We turn chaotic YouTube playlists into quiet lecture desks with syllabus tracking and predictive attendance calculation.
        </p>
      </div>

      {/* 3 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl border border-border-subtle bg-surface space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-[#EFECE6] flex items-center justify-center text-text-primary">
            <BookOpen size={20} />
          </div>
          <h3 className="text-base font-bold">Zero Algorithmic Chaos</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            YouTube's recommendation algorithm is designed for entertainment retention, not academic focus. Learnopia removes clickbait sidebars and comment sections.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-border-subtle bg-surface space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-[#EFECE6] flex items-center justify-center text-accent-forest">
            <Target size={20} />
          </div>
          <h3 className="text-base font-bold">Predictive Bunk Calculator</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Know exactly how many lectures you can safely skip without dropping below your college's minimum required attendance threshold (75% or 80%).
          </p>
        </div>

        <div className="p-6 rounded-xl border border-border-subtle bg-surface space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-[#EFECE6] flex items-center justify-center text-text-primary">
            <Heart size={20} />
          </div>
          <h3 className="text-base font-bold">Free Forever Pledge</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            No paywalls, hidden tier upgrades, or locked lecture tracks. Maintained transparently with optional community server donations.
          </p>
        </div>
      </div>

      {/* Community & Legal Policy Bar */}
      <div className="p-6 rounded-xl border border-border-subtle bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold">Academic Terms & Transparency Code</h4>
          <p className="text-xs text-text-secondary mt-0.5">
            Learn about how student data is handled and our commitment to educational integrity.
          </p>
        </div>
        <button
          onClick={() => setShowTermsModal(true)}
          className="px-4 py-2 rounded-lg text-xs font-semibold border border-border-strong bg-surface hover:bg-surface-hover shrink-0 flex items-center gap-1.5 cursor-pointer"
        >
          <Scale size={14} />
          <span>View Terms of Service</span>
        </button>
      </div>

      {showTermsModal && (
        <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
      )}
    </div>
  );
}
