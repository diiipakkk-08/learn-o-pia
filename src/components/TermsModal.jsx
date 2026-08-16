import React, { useState } from 'react';
import { ShieldCheck, FileText, Lock, Scale, Download, CheckCircle2, AlertTriangle } from 'lucide-react';

export const COMPREHENSIVE_LEGAL_TERMS_TEXT = `
================================================================================
          LEARN-O-PIA PLATFORM TERMS OF SERVICE & USER AGREEMENT
================================================================================
Last Updated & Effective Date: August 17, 2026

PLEASE READ THIS LEGAL AGREEMENT CAREFULLY BEFORE USING THE LEARN-O-PIA PLATFORM.
BY ACCESSING, REGISTERING, CURATING, PURCHASING, OR USING ANY PART OF THIS WEBSITE 
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
YouTube, Google Drive, public web sources, and user uploads) across any subject matter 
(including software development, self-improvement, business, sciences, creative arts, 
and general knowledge).
2.2 Non-Affiliation: Learn-o-pia is an independent curation tool and is not affiliated 
with, endorsed by, or sponsored by YouTube, Google, or third-party content creators unless 
explicitly stated.
2.3 DMCA & Copyright Safe Harbor: All third-party video content remains embedded from 
their original host servers. Content owners retain full copyright. If you believe any 
curated link or upload infringes your copyright, submit a takedown notice to 
legal@learnopia.edu, and the content will be removed immediately.

--------------------------------------------------------------------------------
3. LIMITATION OF LIABILITY & ABSOLUTE DISCLAIMER (LAWSUIT PROTECTION)
--------------------------------------------------------------------------------
3.1 "AS IS" AND "AS AVAILABLE" DISCLAIMER: THE PLATFORM, SERVICES, CURATED COURSES, 
AND MATERIALS ARE PROVIDED STRICTLY ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT 
WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF 
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR ACCURACY.
3.2 ABSOLUTE LIMITATION OF LIABILITY: TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO 
EVENT SHALL THE OPERATOR, FOUNDERS, OWNERS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY 
DIRECT, INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, PUNITIVE, OR EXEMPLARY DAMAGES 
(INCLUDING LOSS OF PROFITS, DATA, GOODWILL, OR ACADEMIC/FINANCIAL OUTCOMES) ARISING OUT 
OF OR IN CONNECTION WITH YOUR USE OF THE PLATFORM.
3.3 MAXIMUM DAMAGES CAP: THE TOTAL AGGREGATE LIABILITY OF THE PLATFORM FOR ANY CLAIMS 
SHALL NOT EXCEED THE GREATER OF $50 USD OR THE TOTAL AMOUNT PAID BY YOU TO THE PLATFORM 
IN THE PAST 6 MONTHS.

--------------------------------------------------------------------------------
4. COMMUNITY-DRIVEN MODEL, MONETIZATION, DONATIONS & ADVERTISING
--------------------------------------------------------------------------------
4.1 Community-Driven Access: Learn-o-pia operates as an open community-driven platform. 
Core features remain accessible to all learners.
4.2 Voluntary Donations & Supporter Pass: Users may choose to support platform servers 
and maintenance via voluntary community donations or optional ad-free Supporter Passes. 
Donations are non-refundable unless required by law.
4.3 Course Selling & Creator Revenue: Users who curate premium courses or original 
learning materials may offer paid access. Curators are solely responsible for accurately 
describing their courses and fulfilling learning support. Learn-o-pia reserves the right 
to retain platform processing fees.
4.4 Advertising & Optional Opt-Out: The platform may display third-party advertisements or 
sponsored community links. Users may opt for Supporter Passes to remove ads.

--------------------------------------------------------------------------------
5. USER CONDUCT & ACCOUNT TERMINATION
--------------------------------------------------------------------------------
5.1 Prohibited Activities: Users shall not engage in harassment, spam, malware 
distribution, unauthorized commercial scraping, fraudulent course sales, or hate speech.
5.2 Operator Termination Rights: We reserve the absolute right to suspend, terminate, or 
delete any user account or curated course at our sole discretion, without prior notice, 
for violations of this Agreement.

--------------------------------------------------------------------------------
6. GOVERNING LAW & BINDING ARBITRATION
--------------------------------------------------------------------------------
6.1 Governing Law: This Agreement shall be governed by and construed in accordance with 
the laws of the applicable jurisdiction, without regard to conflict of law principles.
6.2 Mandatory Binding Arbitration: Any dispute, claim, or controversy arising out of 
or relating to this Agreement shall be settled by binding individual arbitration rather 
than in court. YOU WAIVE ANY RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT OR 
CLASS-WIDE ARBITRATION.

================================================================================
`;

export default function TermsModal({ isOpen, onClose, onAccept, showAcceptButton = false }) {
  const [activeTab, setActiveTab] = useState('summary');

  if (!isOpen) return null;

  const handleDownloadDoc = () => {
    const element = document.createElement('a');
    const file = new Blob([COMPREHENSIVE_LEGAL_TERMS_TEXT], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = 'Learn-o-pia_Platform_Terms_of_Service_Legal_Contract.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div style={styles.overlay} className="animate-fade-in">
      <div style={styles.modal} className="glass-panel">
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={styles.iconCircle}>
              <Scale size={20} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', margin: 0, color: '#ffffff' }}>Platform Terms of Service & Legal Contract</h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Universal Curation • Community Model • Liability Protection</span>
            </div>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        {/* Tab Navigation & Download Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn ${activeTab === 'summary' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setActiveTab('summary')}
              style={{ fontSize: '0.78rem', padding: '4px 12px' }}
            >
              Key Summary
            </button>
            <button
              className={`btn ${activeTab === 'full' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setActiveTab('full')}
              style={{ fontSize: '0.78rem', padding: '4px 12px' }}
            >
              Full Legal Contract Document
            </button>
          </div>

          <button onClick={handleDownloadDoc} className="btn btn-secondary btn-sm" style={{ gap: '6px', fontSize: '0.78rem', padding: '4px 12px' }}>
            <Download size={13} /> Save Legal File (.txt)
          </button>
        </div>

        <div style={styles.body}>
          {activeTab === 'summary' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={styles.summaryBox}>
                <h4 style={styles.sectionTitle}><ShieldCheck size={16} color="var(--primary)" /> 1. Universal Curation & Freedom of Topics</h4>
                <p style={styles.text}>Learn-o-pia is an open, universal curation platform for everyone. Anyone can structure YouTube playlists, notes, and resources into courses covering coding, self-development, business, creative arts, or personal skills.</p>
              </div>

              <div style={styles.summaryBox}>
                <h4 style={styles.sectionTitle}><Lock size={16} color="#34d399" /> 2. Share or Sell Your Courses</h4>
                <p style={styles.text}>Curators can share their organized learning paths freely with the community or offer paid access to monetize their curation work and custom study guides.</p>
              </div>

              <div style={styles.summaryBox}>
                <h4 style={styles.sectionTitle}><AlertTriangle size={16} color="#f59e0b" /> 3. Absolute Limitation of Liability (Legal Protection)</h4>
                <p style={styles.text}>To the maximum extent permitted by law, Learn-o-pia and its operators are fully protected against legal claims. The platform is provided "AS IS" without guarantees of specific outcomes.</p>
              </div>

              <div style={styles.summaryBox}>
                <h4 style={styles.sectionTitle}><FileText size={16} color="#a78bfa" /> 4. Community Model, Donations & Optional Ads</h4>
                <p style={styles.text}>Learn-o-pia is community-driven. Platform upkeep is sustained through optional community donations, ad-free Supporter Passes, and non-intrusive ads.</p>
              </div>
            </div>
          ) : (
            <pre style={{
              background: 'rgba(0,0,0,0.4)',
              padding: '16px',
              borderRadius: '10px',
              color: '#d1d5db',
              fontSize: '0.78rem',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              margin: 0,
              lineHeight: '1.5',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              {COMPREHENSIVE_LEGAL_TERMS_TEXT}
            </pre>
          )}
        </div>

        <div style={styles.footer}>
          {showAcceptButton ? (
            <button
              onClick={() => {
                if (onAccept) onAccept();
                onClose();
              }}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px' }}
            >
              I Accept & Agree to Terms of Service
            </button>
          ) : (
            <button onClick={onClose} className="btn btn-secondary" style={{ padding: '8px 20px' }}>
              Close Agreement
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '20px'
  },
  modal: {
    width: '100%',
    maxWidth: '680px',
    maxHeight: '88vh',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    borderRadius: '20px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
    textAlign: 'left'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '12px'
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: '12px',
    background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '1.4rem',
    cursor: 'pointer'
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 0',
    display: 'flex',
    flexDirection: 'column'
  },
  summaryBox: {
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px'
  },
  sectionTitle: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: '#ffffff',
    margin: '0 0 6px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  text: {
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    margin: 0
  },
  footer: {
    paddingTop: '14px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    justifyContent: 'flex-end'
  }
};
