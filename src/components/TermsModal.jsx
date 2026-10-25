import React, { useState } from 'react';
import { Scale, X } from 'lucide-react';

export const COMPREHENSIVE_LEGAL_TERMS_TEXT = `
================================================================================
          LEARN-O-PIA PLATFORM TERMS OF SERVICE & USER AGREEMENT
================================================================================
Last Updated & Effective Date: August 17, 2026

PLEASE READ THIS LEGAL AGREEMENT CAREFULLY BEFORE USING THE LEARN-O-PIA PLATFORM.
BY ACCESSING, REGISTERING, CURATING, OR USING ANY PART OF THIS WEBSITE 
AND SERVICES, YOU AGREE TO BE BOUND BY ALL TERMS AND CONDITIONS BELOW.

--------------------------------------------------------------------------------
1. ACCEPTANCE OF TERMS & ELIGIBILITY
--------------------------------------------------------------------------------
1.1 Binding Contract: This Terms of Service Agreement ("Agreement") forms a legally 
binding contract between you ("User", "Curator", "Learner") and Learn-o-pia ("Platform", 
"Operator", "We", "Us").
1.2 Age Requirement: You must be at least 13 years of age (or the minimum legal age 
in your jurisdiction) to create an account. Users under 18 must have parental or legal 
guardian consent.

--------------------------------------------------------------------------------
2. UNIVERSAL COURSE CURATION & THIRD-PARTY CONTENT SAFE HARBOR (DMCA)
--------------------------------------------------------------------------------
2.1 Curation & Embed Engine: Learn-o-pia allows users to curate, organize, and structure 
video playlists, documents, and learning resources from third-party platforms (including 
YouTube, Google Drive, public web sources, and user uploads) across any subject matter.
2.2 Non-Affiliation: Learn-o-pia is an independent curation tool and is not affiliated 
with, endorsed by, or sponsored by YouTube, Google, or third-party content creators unless 
explicitly stated.
2.3 DMCA & Copyright Safe Harbor: All third-party video content remains embedded from 
their original host servers. Content owners retain full copyright. If you believe any 
curated link or upload infringes your copyright, submit a notice to legal@learnopia.edu.

--------------------------------------------------------------------------------
3. LIMITATION OF LIABILITY & ABSOLUTE DISCLAIMER
--------------------------------------------------------------------------------
3.1 "AS IS" AND "AS AVAILABLE" DISCLAIMER: THE PLATFORM, SERVICES, CURATED COURSES, 
AND MATERIALS ARE PROVIDED STRICTLY ON AN "AS IS" BASIS WITHOUT WARRANTIES OF ANY KIND.
3.2 TOTAL DAMAGE CAP: MAXIMUM AGGREGATE LIABILITY FOR ANY CLAIMS SHALL NOT EXCEED $50 USD.
`;

export default function TermsModal({ isOpen, onClose, onAccept, requireAcceptance = false }) {
  const [activeTab, setActiveTab] = useState('summary');
  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !requireAcceptance) onClose?.();
      }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-12 p-4 overflow-y-auto bg-black/60 animate-fade-in"
    >
      <div className="w-full max-w-2xl mb-8 rounded-xl border border-border-subtle bg-surface p-6 shadow-modal flex flex-col max-h-[88vh] text-text-primary">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg border border-border-strong bg-[#EFECE6] flex items-center justify-center text-text-primary">
              <Scale size={18} />
            </div>
            <div>
              <span className="font-editorial text-2xl tracking-tight block leading-none">
                Terms of Service & Code
              </span>
              <span className="text-[10px] text-text-muted font-mono-tabular uppercase mt-0.5 block">
                LEARN-O-PIA ACADEMIC & LEGAL AGREEMENT
              </span>
            </div>
          </div>
          {!requireAcceptance && (
            <button
              onClick={onClose}
              className="p-1 rounded text-text-muted hover:text-text-primary"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Tab switch */}
        <div className="flex gap-2 pt-3 pb-1 border-b border-border-subtle text-xs">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'summary' ? 'bg-accent-ink text-text-on-dark' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab('full')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'full' ? 'bg-accent-ink text-text-on-dark' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Full Legal Agreement
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs text-text-secondary leading-relaxed">
          {activeTab === 'summary' ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg border border-border-subtle bg-canvas space-y-1">
                <h4 className="font-bold text-text-primary text-xs">1. Distraction-Free Embed Engine</h4>
                <p>
                  Learn-O-Pia embeds public educational videos from YouTube without monetizing original content owners' videos or removing their branding.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-border-subtle bg-canvas space-y-1">
                <h4 className="font-bold text-text-primary text-xs">2. Academic Attendance Buffer Calculation</h4>
                <p>
                  The attendance calculator is an academic forecasting utility. Official college records and attendance eligibility remain governed exclusively by your academic institution.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-border-subtle bg-canvas space-y-1">
                <h4 className="font-bold text-text-primary text-xs">3. Student Privacy & Security</h4>
                <p>
                  We store student progress, timetable routines, and notes securely using encrypted Supabase databases. We never sell student data to third parties.
                </p>
              </div>
            </div>
          ) : (
            <pre className="p-4 rounded-lg border border-border-subtle bg-canvas font-mono-tabular text-[11px] whitespace-pre-wrap leading-relaxed text-text-primary">
              {COMPREHENSIVE_LEGAL_TERMS_TEXT}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
          <span className="text-[11px] text-text-muted font-mono-tabular">
            EFFECTIVE: AUGUST 2026
          </span>
          {requireAcceptance ? (
            <button
              onClick={() => {
                if (onAccept) onAccept();
                onClose();
              }}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark hover:opacity-95"
            >
              I Accept the Terms & Agreement
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold border border-border-strong bg-surface hover:bg-surface-hover"
            >
              Close Agreement
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
