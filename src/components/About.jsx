import React, { useState } from 'react';
import {
  GraduationCap,
  Zap,
  ShieldCheck,
  Target,
  BookOpen,
  Layers,
  CheckCircle2,
  Flame,
  Heart,
  Compass,
  ArrowRight,
  BarChart3,
  MessageSquare,
  DollarSign,
  Award,
  Scale,
  Users
} from 'lucide-react';
import TermsModal from './TermsModal';

export default function About({ setCurrentView }) {
  const [showTermsModal, setShowTermsModal] = useState(false);

  return (
    <div style={{
      maxWidth: '1150px',
      margin: '0 auto',
      padding: '30px 20px 60px 20px',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      gap: '36px',
      fontFamily: 'var(--font-body, sans-serif)'
    }} className="animate-fade-in">

      {/* Header Banner */}
      <div className="glass-panel" style={{
        padding: '50px 30px',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.18) 0%, rgba(139, 92, 246, 0.18) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '18px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          padding: '14px',
          borderRadius: '20px',
          display: 'inline-flex',
          boxShadow: '0 10px 30px rgba(99, 102, 241, 0.4)'
        }}>
          <GraduationCap size={44} color="#ffffff" />
        </div>

        <h1 style={{
          fontSize: '2.8rem',
          fontWeight: 800,
          margin: 0,
          background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontFamily: 'var(--font-heading)'
        }}>
          Reimagining Higher Education & Academic Learning
        </h1>

        <p style={{
          fontSize: '1.15rem',
          color: 'var(--text-secondary, #9ca3af)',
          maxWidth: '820px',
          lineHeight: 1.6,
          margin: 0
        }}>
          Learn-o-pia is a professional, distraction-free educational sanctuary engineered for university students, educators, and lifelong learners. We combine structured lecture playback, attendance tracking, academic discussion streams, and creator monetization.
        </p>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '6px' }}>
          <button
            onClick={() => setCurrentView('learning')}
            className="btn btn-primary"
            style={{ padding: '12px 28px', fontSize: '0.95rem', borderRadius: '12px', gap: '8px' }}
          >
            <BookOpen size={18} /> Start Studying Now
          </button>
          <button
            onClick={() => setShowTermsModal(true)}
            className="btn btn-secondary"
            style={{ padding: '12px 24px', fontSize: '0.95rem', borderRadius: '12px', gap: '8px' }}
          >
            <Scale size={18} /> View Platform Policies
          </button>
        </div>
      </div>

      {/* WHY LEARN-O-PIA IS BETTER THAN YOUTUBE */}
      <div className="glass-panel" style={{
        padding: '36px 30px',
        borderRadius: '22px',
        border: '1px solid rgba(239, 68, 68, 0.25)',
        background: 'rgba(17, 18, 28, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        textAlign: 'left'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '12px', borderRadius: '14px' }}>
            <Zap size={28} color="#ef4444" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.6rem', margin: 0, color: '#ffffff', fontWeight: 800 }}>
              The Problem with Studying on Social Video Platforms
            </h2>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Why YouTube algorithm traps ruin student focus and academic progress
            </span>
          </div>
        </div>

        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
          YouTube is optimized for commercial engagement and maximum screen time — not structured academic mastery. When studying on YouTube, students are constantly interrupted by Shorts recommendations, gaming clips, popups, and unskippable ads. Within 15 minutes, focus decays and study momentum is lost.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '18px',
          marginTop: '6px'
        }}>
          <div style={{
            padding: '20px',
            borderRadius: '16px',
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontWeight: 700, color: '#ef4444', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ❌ Traditional Social Platforms
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <li>Addictive Shorts & reel recommendation traps</li>
              <li>Unskippable commercial ads breaking lecture focus</li>
              <li>Scattered videos with zero degree curriculum structure</li>
              <li>No attendance tracking or academic doubt discussions</li>
            </ul>
          </div>

          <div style={{
            padding: '20px',
            borderRadius: '16px',
            background: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontWeight: 700, color: '#10b981', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ✅ The Learn-o-pia Ecosystem
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <li>100% Distraction-Free Theatre Player Stage</li>
              <li>Smart Attendance Tracker with 75% minimum criteria alerts</li>
              <li>Hashtag Doubt Streams with code access & direct replies</li>
              <li>Verified Educator & Creator Course Monetization Engine</li>
            </ul>
          </div>
        </div>
      </div>

      {/* PLATFORM PILLARS & FEATURES GRID */}
      <div style={{ textAlign: 'left' }}>
        <h2 style={{ fontSize: '1.8rem', margin: '0 0 16px 0', color: '#ffffff', fontWeight: 800 }}>
          Four Pillars of the Learn-o-pia Platform
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px'
        }}>
          {/* Pillar 1 */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '10px', borderRadius: '12px', width: 'fit-content' }}>
              <BookOpen size={22} color="#6366f1" />
            </div>
            <h3 style={{ fontSize: '1.15rem', margin: 0, color: '#ffffff' }}>1. Distraction-Free Player</h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Pinned sticky video stage on the left with an auto-scrolling lecture queue on the right. Lecture progress is saved automatically.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '10px', borderRadius: '12px', width: 'fit-content' }}>
              <BarChart3 size={22} color="#10b981" />
            </div>
            <h3 style={{ fontSize: '1.15rem', margin: 0, color: '#ffffff' }}>2. Attendance Tracker</h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Log semester lecture attendance, monitor percentage status, and receive alerts if attendance falls below mandatory thresholds.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '10px', borderRadius: '12px', width: 'fit-content' }}>
              <MessageSquare size={22} color="#f59e0b" />
            </div>
            <h3 style={{ fontSize: '1.15rem', margin: 0, color: '#ffffff' }}>3. Academic Discussions</h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Public & private hashtag doubt threads with code access (`DS-9182`), nested message replies, and peer academic support.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'rgba(236, 72, 153, 0.15)', padding: '10px', borderRadius: '12px', width: 'fit-content' }}>
              <DollarSign size={22} color="#ec4899" />
            </div>
            <h3 style={{ fontSize: '1.15rem', margin: 0, color: '#ffffff' }}>4. Creator Monetization</h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Verified professors, educators, and creators can publish degree programs, share standalone study PDFs, and monetize courses.
            </p>
          </div>
        </div>
      </div>

      {/* USER DESIGNATIONS & VERIFICATION SYSTEM */}
      <div className="glass-panel" style={{
        padding: '32px',
        borderRadius: '22px',
        border: '1px solid rgba(139, 92, 246, 0.25)',
        textAlign: 'left'
      }}>
        <h3 style={{ fontSize: '1.4rem', margin: '0 0 8px 0', color: '#ffffff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Award size={22} color="var(--primary)" /> Academic Designation & Hierarchy System
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 20px 0' }}>
          To maintain high platform standards and trust, every user receives a verified academic designation prefix across headers, profiles, and discussion streams:
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <strong style={{ color: '#ffffff', display: 'block', fontSize: '0.86rem' }}>👑 Owner. Deepak Shaw</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Platform Administration & Control</span>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <strong style={{ color: '#ffffff', display: 'block', fontSize: '0.86rem' }}>👨‍🏫 Prof. Educator Name</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified University Professor</span>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <strong style={{ color: '#ffffff', display: 'block', fontSize: '0.86rem' }}>✨ Creator. Author Name</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified Content Creator</span>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <strong style={{ color: '#ffffff', display: 'block', fontSize: '0.86rem' }}>🎓 St. Student Name</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified University Student</span>
          </div>
        </div>
      </div>

      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
    </div>
  );
}
