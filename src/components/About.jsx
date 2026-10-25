import React, { useState, useMemo } from 'react';
import {
  Target,
  BookOpen,
  Heart,
  Scale,
  ArrowLeft,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers,
  ChevronDown,
  Sparkles,
  Shield,
  HelpCircle,
  ExternalLink,
  Lock,
  Globe
} from 'lucide-react';
import TermsModal from './TermsModal';
import { calculateAttendanceMetrics } from '../utils/attendanceMath';

/**
 * About.jsx
 * Interactive Academic Studio & Manifesto for Learnopia:
 * - Focus comparison simulator (Algorithmic distraction vs Academic desk)
 * - Interactive attendance safety calculator sandbox
 * - Platform architecture explorer
 * - Frequently Asked Questions (FAQ) interactive accordion
 * - Educational transparency and open pledge
 */
export default function About({ setCurrentView }) {
  const [showTermsModal, setShowTermsModal] = useState(false);

  // 1. Focus Comparison Mode ('learnopia' | 'youtube')
  const [comparisonMode, setComparisonMode] = useState('learnopia');

  // 2. Interactive Calculator State
  const [calcAttended, setCalcAttended] = useState(32);
  const [calcTotal, setCalcTotal] = useState(40);
  const [calcTargetPct, setCalcTargetPct] = useState(75);

  const calcMetrics = useMemo(() => {
    const targetRatio = calcTargetPct / 100;
    return calculateAttendanceMetrics(calcAttended, calcTotal, targetRatio);
  }, [calcAttended, calcTotal, calcTargetPct]);

  // 3. Architecture Deep Dive Active Tab
  const [activeArchTab, setActiveArchTab] = useState('player');

  // 4. FAQ Accordion State (Set of open item indices)
  const [openFaqIndices, setOpenFaqIndices] = useState(new Set([0]));

  const toggleFaq = (idx) => {
    setOpenFaqIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const faqItems = [
    {
      q: 'Is Learnopia truly 100% free for all students and faculties?',
      a: 'Yes, permanently. Learnopia was founded with a foundational pledge: zero paywalls, no premium gated video tiers, and no subscriptions. University education should be quiet, dignified, and accessible to every student regardless of financial background.'
    },
    {
      q: 'How does the predictive attendance calculator prevent debarment?',
      a: 'Most university systems simply tell you your current percentage. Learnopia runs real-time mathematical margin projection: if you are at or above your threshold (e.g., 75%), it calculates exactly how many future classes you can safely miss without dropping below the line. If you are in shortage, it tells you the exact number of consecutive classes you must attend to recover.'
    },
    {
      q: 'Can I add courses or notes directly into root folders without subfolders?',
      a: 'Absolutely. Learnopia features 4 core root folders: Academic, Document, Important Links, and Personal. In Personal, items are strictly organized as a flat, direct list without unnecessary subfolder clutter. In Academic, Document, and Links, you can either save items directly to the root folder or categorize them into single-level semester subfolders.'
    },
    {
      q: 'How are YouTube lecture videos played without distractions?',
      a: 'Learnopia embeds verified university and academic playlists via an optimized, privacy-conscious YouTube sandbox (youtube-nocookie.com). Recommendations, algorithmic autoplay queues, sidebar clickbait, and comment debates are stripped away, keeping only your syllabus curriculum and study notes.'
    },
    {
      q: 'Where is student data stored, and is my timetable private?',
      a: 'All personal study folders, attendance logs, and routines are backed up securely to Supabase PostgreSQL with strict Row Level Security (RLS). You can also set any folder or uploaded study resource to Private mode, ensuring only you have access.'
    }
  ];

  return (
    <div className="w-full max-w-5xl 2xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-fade-in text-text-primary">
      {/* Return Button */}
      <button
        onClick={() => setCurrentView && setCurrentView('my-learning')}
        className="text-xs font-semibold text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition-colors cursor-pointer"
      >
        <ArrowLeft size={14} />
        <span>Return to Workspace</span>
      </button>

      {/* Hero Header */}
      <div className="rounded-2xl border border-border-subtle bg-surface p-8 sm:p-12 text-center space-y-4 shadow-sm relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono-tabular font-semibold border border-border-strong bg-subtle text-text-primary">
          <span className="w-2 h-2 rounded-full bg-accent-forest animate-pulse" />
          <span>100% FREE ACADEMIC DESK & OPERATING SYSTEM</span>
        </div>

        <h1 className="font-editorial text-3xl sm:text-5xl lg:text-6xl tracking-tight max-w-3xl mx-auto leading-tight font-bold">
          Built to make university learning quiet, structured, and completely free.
        </h1>

        <p className="text-sm sm:text-base text-text-secondary max-w-2xl mx-auto leading-relaxed">
          Learnopia transforms chaotic, algorithm-driven video playlists into focused lecture desks with syllabus progression, predictive attendance tracking, and peer study resources.
        </p>
      </div>

      {/* =================================================================
          INTERACTIVE MODULE 1: FOCUS SIMULATOR (YouTube Chaos vs Learnopia)
      ================================================================= */}
      <div className="rounded-2xl border border-border-subtle bg-surface p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-editorial">
              Interactive Focus Comparison
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Toggle between standard video streaming and Learnopia's quiet academic study desk.
            </p>
          </div>

          <div className="flex rounded-lg bg-canvas border border-border-strong p-1 shadow-2xs shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setComparisonMode('youtube')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                comparisonMode === 'youtube'
                  ? 'bg-red-500/10 text-red-600 border border-red-500/20 font-bold'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Standard YouTube
            </button>
            <button
              onClick={() => setComparisonMode('learnopia')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                comparisonMode === 'learnopia'
                  ? 'bg-accent-ink text-text-on-dark font-bold shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Learnopia Workspace
            </button>
          </div>
        </div>

        {comparisonMode === 'youtube' ? (
          <div className="p-6 rounded-xl border border-red-500/30 bg-red-500/5 space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-wider font-mono-tabular">
              <AlertTriangle size={15} />
              <span>The Algorithmic Retention Trap</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-lg bg-surface border border-border-subtle space-y-1.5">
                <div className="font-bold text-text-primary">Clickbait Sidebars</div>
                <div className="text-text-secondary leading-relaxed">
                  Recommended entertainment videos constantly distract students from complex engineering lectures.
                </div>
              </div>
              <div className="p-4 rounded-lg bg-surface border border-border-subtle space-y-1.5">
                <div className="font-bold text-text-primary">Comment Debates & Ads</div>
                <div className="text-text-secondary leading-relaxed">
                  Frequent pre-roll and mid-roll interruptions break cognitive flow and deep lecture comprehension.
                </div>
              </div>
              <div className="p-4 rounded-lg bg-surface border border-border-subtle space-y-1.5">
                <div className="font-bold text-text-primary">Zero Curriculum Context</div>
                <div className="text-text-secondary leading-relaxed">
                  No syllabus tracking, semester note links, or attendance margin calculations to keep you on schedule.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-xl border border-accent-forest/30 bg-accent-forest/5 space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 text-accent-forest font-bold text-xs uppercase tracking-wider font-mono-tabular">
              <CheckCircle2 size={15} />
              <span>The Quiet Academic Workspace</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-lg bg-surface border border-border-subtle space-y-1.5">
                <div className="font-bold text-text-primary">Distraction-Free 16:9 Canvas</div>
                <div className="text-text-secondary leading-relaxed">
                  Zero recommendation algorithm, zero comments, and zero sidebar distractions. Only your lecture.
                </div>
              </div>
              <div className="p-4 rounded-lg bg-surface border border-border-subtle space-y-1.5">
                <div className="font-bold text-text-primary">Synchronized Syllabus Dock</div>
                <div className="text-text-secondary leading-relaxed">
                  Module-by-module lecture tracking with instant formula sheets, university PYQs, and code notes.
                </div>
              </div>
              <div className="p-4 rounded-lg bg-surface border border-border-subtle space-y-1.5">
                <div className="font-bold text-text-primary">Predictive Attendance Safety</div>
                <div className="text-text-secondary leading-relaxed">
                  Never risk exam debarment. Know exactly when you can safely rest or when you must attend.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =================================================================
          INTERACTIVE MODULE 2: ATTENDANCE SAFETY SANDBOX
      ================================================================= */}
      <div className="rounded-2xl border border-border-subtle bg-surface p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="border-b border-border-subtle pb-4">
          <div className="flex items-center gap-2 text-xs font-mono-tabular text-accent-forest uppercase font-bold tracking-wider mb-1">
            <Target size={14} />
            <span>Interactive Safe-Bunk Simulator</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold font-editorial">
            Test Your University Attendance Margin
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Adjust the sliders below to see how Learnopia's predictive algorithm safeguards your semester.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Controls */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-text-secondary">Classes Attended:</span>
                <span className="font-mono-tabular font-bold text-text-primary">{calcAttended} sessions</span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.max(calcTotal, 1)}
                value={calcAttended}
                onChange={(e) => setCalcAttended(parseInt(e.target.value) || 0)}
                className="w-full accent-accent-ink cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-text-secondary">Total Classes Conducted:</span>
                <span className="font-mono-tabular font-bold text-text-primary">{calcTotal} sessions</span>
              </div>
              <input
                type="range"
                min="5"
                max="80"
                value={calcTotal}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 5;
                  setCalcTotal(val);
                  if (calcAttended > val) setCalcAttended(val);
                }}
                className="w-full accent-accent-ink cursor-pointer"
              />
            </div>

            <div>
              <span className="block text-xs font-semibold text-text-secondary mb-2">
                College Minimum Requirement:
              </span>
              <div className="flex items-center gap-2">
                {[65, 75, 80, 85].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setCalcTargetPct(pct)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono-tabular transition-all cursor-pointer ${
                      calcTargetPct === pct
                        ? 'border-accent-ink bg-accent-ink text-text-on-dark font-bold shadow-xs'
                        : 'border-border-subtle bg-canvas hover:bg-surface-hover text-text-secondary'
                    }`}
                  >
                    {pct}% Minimum
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Live Computation Card */}
          <div className="lg:col-span-5 rounded-xl border border-border-strong bg-subtle p-5 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-tabular text-text-muted uppercase tracking-wider font-semibold">
                Projected Score
              </span>
              <span className="text-2xl sm:text-3xl font-mono-tabular font-extrabold text-text-primary">
                {calcMetrics.percentage}%
              </span>
            </div>

            <div
              className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-between ${
                calcMetrics.isSafe
                  ? 'bg-accent-forest-bg border-[#C2DEC9] text-accent-forest'
                  : 'bg-accent-amber-bg border-[#F5DCB7] text-accent-amber'
              }`}
            >
              <span>
                {calcMetrics.isSafe
                  ? `SAFE ZONE: You can safely miss ${calcMetrics.canMiss} classes.`
                  : `SHORTAGE: Attend next ${calcMetrics.mustAttend} classes in a row.`}
              </span>
            </div>

            <p className="text-[11px] text-text-muted leading-relaxed font-mono-tabular">
              {calcMetrics.isSafe
                ? `Current buffer allows skipping without falling below the ${calcTargetPct}% threshold.`
                : `Must attend consecutive lectures to restore status back to ${calcTargetPct}%.`}
            </p>
          </div>
        </div>
      </div>

      {/* =================================================================
          MODULE 3: SYSTEM ARCHITECTURE INSPECTOR
      ================================================================= */}
      <div className="rounded-2xl border border-border-subtle bg-surface p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="border-b border-border-subtle pb-4">
          <div className="flex items-center gap-2 text-xs font-mono-tabular text-accent-forest uppercase font-bold tracking-wider mb-1">
            <Layers size={14} />
            <span>Architecture & Subsystems</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold font-editorial">
            How Learnopia is Engineered
          </h2>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'player', label: 'Distraction-Free Video IDE' },
            { id: 'folders', label: '4-Root Workspace Vault' },
            { id: 'attendance', label: 'Continuous Ledger Engine' },
            { id: 'marketplace', label: 'Campus Resource Exchange' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveArchTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                activeArchTab === tab.id
                  ? 'bg-accent-ink text-text-on-dark border-accent-ink shadow-xs'
                  : 'border-border-subtle bg-canvas hover:bg-surface-hover text-text-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Panels */}
        <div className="p-5 rounded-xl border border-border-subtle bg-canvas space-y-3">
          {activeArchTab === 'player' && (
            <div className="space-y-2 animate-fade-in text-xs sm:text-sm">
              <h3 className="font-bold text-text-primary text-base">Privacy-Preserving YouTube Streamer</h3>
              <p className="text-text-secondary leading-relaxed">
                Connects through <code>youtube-nocookie.com</code> with modest branding and stripped recommendations. Video progress and last-played timestamps sync locally and to user profiles so you can resume on any device.
              </p>
            </div>
          )}

          {activeArchTab === 'folders' && (
            <div className="space-y-2 animate-fade-in text-xs sm:text-sm">
              <h3 className="font-bold text-text-primary text-base">Strict Depth-Controlled File Hierarchy</h3>
              <p className="text-text-secondary leading-relaxed">
                Organized into 4 core roots: <strong>Academic</strong>, <strong>Document</strong>, <strong>Important Links</strong>, and <strong>Personal</strong>. Personal is strictly flat for rapid study notes. Other folders enforce a maximum 1-level depth to prevent nested file chaos.
              </p>
            </div>
          )}

          {activeArchTab === 'attendance' && (
            <div className="space-y-2 animate-fade-in text-xs sm:text-sm">
              <h3 className="font-bold text-text-primary text-base">Mathematical Margin Engine</h3>
              <p className="text-text-secondary leading-relaxed">
                Integrates daily lecture logs (attended, absent, bunked, mass-bunked, and cancelled) with academic routines. Automatically computes safe bunk allowances and required recovery streaks using exact integer projections.
              </p>
            </div>
          )}

          {activeArchTab === 'marketplace' && (
            <div className="space-y-2 animate-fade-in text-xs sm:text-sm">
              <h3 className="font-bold text-text-primary text-base">Decentralized Student Study Marketplace</h3>
              <p className="text-text-secondary leading-relaxed">
                Facilitates peer-to-peer exchange of lab hardware, drawing boards, semester guides, and textbooks. Students can create and manage listings with WhatsApp and email verification.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* =================================================================
          MODULE 4: INTERACTIVE FAQ ACCORDION
      ================================================================= */}
      <div className="rounded-2xl border border-border-subtle bg-surface p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="border-b border-border-subtle pb-4">
          <div className="flex items-center gap-2 text-xs font-mono-tabular text-accent-forest uppercase font-bold tracking-wider mb-1">
            <HelpCircle size={14} />
            <span>Student Questions & Answers</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold font-editorial">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, idx) => {
            const isOpen = openFaqIndices.has(idx);
            return (
              <div
                key={idx}
                className="rounded-xl border border-border-subtle bg-canvas overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 cursor-pointer hover:bg-surface-hover/50 transition-colors"
                >
                  <span className="font-bold text-xs sm:text-sm text-text-primary">
                    {item.q}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-text-muted transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-text-primary' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-text-secondary leading-relaxed border-t border-border-subtle/50 animate-fade-in">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Community & Legal Policy Bar */}
      <div className="p-6 rounded-xl border border-border-subtle bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold">Academic Terms & Educational Integrity Code</h4>
          <p className="text-xs text-text-secondary mt-0.5">
            Learn about how student data is handled and our commitment to educational integrity.
          </p>
        </div>
        <button
          onClick={() => setShowTermsModal(true)}
          className="px-4 py-2 rounded-lg text-xs font-semibold border border-border-strong bg-surface hover:bg-surface-hover shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
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
