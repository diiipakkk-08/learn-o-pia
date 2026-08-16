import React from 'react';
import { ShieldCheck, FileText, CheckCircle2, Lock, Sparkles, Scale } from 'lucide-react';

export default function TermsModal({ isOpen, onClose, onAccept, showAcceptButton = false }) {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay} className="animate-fade-in">
      <div style={styles.modal} className="glass-panel">
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={styles.iconCircle}>
              <Scale size={20} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', margin: 0, color: '#ffffff' }}>Terms of Service & Platform Policies</h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Effective Date: August 2026 • Learn-o-pia Platform</span>
            </div>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        <div style={styles.body}>
          <section style={styles.section}>
            <h4 style={styles.sectionTitle}>
              <ShieldCheck size={16} color="var(--primary)" /> 1. Platform Purpose & Usage
            </h4>
            <p style={styles.text}>
              Learn-o-pia is a distraction-free academic environment designed to facilitate structured university learning, attendance management, academic discussions, and verified educational content creation. Users agree to utilize the platform strictly for educational and self-improvement purposes.
            </p>
          </section>

          <section style={styles.section}>
            <h4 style={styles.sectionTitle}>
              <Lock size={16} color="#34d399" /> 2. Content Monetization & Verification
            </h4>
            <p style={styles.text}>
              Verified Educators, Professors, and Creators have the authority to publish, manage, and monetize academic courses and open study materials. All uploaded media must comply with intellectual property rights and university copyright guidelines.
            </p>
          </section>

          <section style={styles.section}>
            <h4 style={styles.sectionTitle}>
              <FileText size={16} color="#f59e0b" /> 3. Discussion & Community Standards
            </h4>
            <p style={styles.text}>
              Public and private discussion streams are moderated to maintain high academic standards. Harassment, spam, commercial solicitation, or unauthorized distribution of private exam papers is strictly prohibited and subject to immediate account termination.
            </p>
          </section>

          <section style={styles.section}>
            <h4 style={styles.sectionTitle}>
              <Sparkles size={16} color="#a78bfa" /> 4. Data Privacy & Communication Preferences
            </h4>
            <p style={styles.text}>
              We respect your privacy. User data is handled with end-to-end encryption standards. Optional marketing preferences allow users to opt-in or opt-out of email course announcements and platform news at any time via Account Settings.
            </p>
          </section>
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
              I Agree & Accept Terms of Service
            </button>
          ) : (
            <button onClick={onClose} className="btn btn-secondary" style={{ padding: '8px 20px' }}>
              Close Document
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
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '20px'
  },
  modal: {
    width: '100%',
    maxWidth: '620px',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    borderRadius: '20px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
    textAlign: 'left'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(255,255,255,0.08)'
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
    flexDirection: 'column',
    gap: '18px'
  },
  section: {
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px'
  },
  sectionTitle: {
    fontSize: '0.92rem',
    fontWeight: 700,
    color: '#ffffff',
    margin: '0 0 8px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  text: {
    fontSize: '0.83rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    margin: 0
  },
  footer: {
    paddingTop: '16px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    justifyContent: 'flex-end'
  }
};
