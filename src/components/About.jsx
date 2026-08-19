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
  Users,
  Globe
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
          <Globe size={44} color="#ffffff" />
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
          Universal Curation for Everyone
        </h1>

        <p style={{
          fontSize: '1.15rem',
          color: 'var(--text-secondary, #9ca3af)',
          maxWidth: '840px',
          lineHeight: 1.6,
          margin: 0
        }}>
          Learn-o-pia is an open, community-driven platform created for everyone. Whether you want to master coding, personal growth, business, creative arts, or university subjects — anyone can curate video series, attached notes, and study resources into structured focus courses to share or sell globally.
        </p>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '6px' }}>
          <button
            onClick={() => setCurrentView('landing')}
            className="btn btn-secondary"
            style={{ padding: '12px 28px', fontSize: '0.95rem', borderRadius: '12px', gap: '8px' }}
          >
            <Globe size={18} /> Back to Landing Page
          </button>
          <button
            onClick={() => setCurrentView('learning')}
            className="btn btn-primary"
            style={{ padding: '12px 28px', fontSize: '0.95rem', borderRadius: '12px', gap: '8px' }}
          >
            <BookOpen size={18} /> Start Exploring Courses
          </button>
          <button
            onClick={() => setShowTermsModal(true)}
            className="btn btn-secondary"
            style={{ padding: '12px 24px', fontSize: '0.95rem', borderRadius: '12px', gap: '8px' }}
          >
            <Scale size={18} /> View Legal Terms Contract
          </button>
        </div>
      </div>

      {/* WHY LEARN-O-PIA MATTERS */}
      <div className="glass-panel" style={{
        padding: '36px 30px',
        borderRadius: '22px',
        border: '1px solid rgba(139, 92, 246, 0.25)',
        background: 'rgba(17, 18, 28, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        textAlign: 'left'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '12px', borderRadius: '14px' }}>
            <Zap size={28} color="var(--primary)" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.6rem', margin: 0, color: '#ffffff', fontWeight: 800 }}>
              The Problem with Studying on Social Media
            </h2>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Why social video algorithms ruin focus and how curation fixes it
            </span>
          </div>
        </div>

        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
          Social video platforms are built for viral entertainment and maximum screen time — not deep learning. When learning a skill or subject on social sites, learners are constantly distracted by Shorts rabbit holes, clickbait thumbnails, and popups. Learn-o-pia strips away the noise and provides a clean, focused theatre player stage.
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
              ❌ Cluttered Video Platforms
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <li>Addictive Shorts & reel recommendations</li>
              <li>Unskippable ads interrupting focus</li>
              <li>Scattered videos without logical course structure</li>
              <li>No built-in attendance or discussion threads</li>
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
              ✅ The Learn-o-pia Solution
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <li>Distraction-Free Theatre Player Stage</li>
              <li>Universal course curation across all skills & topics</li>
              <li>Hashtag Doubt Threads with code access (`DS-9182`)</li>
              <li>Freedom to share courses freely or monetize masterclasses</li>
            </ul>
          </div>
        </div>
      </div>

      {/* COMMUNITY MODEL & FUTURE VISION */}
      <div className="glass-panel" style={{
        padding: '32px',
        borderRadius: '22px',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        textAlign: 'left'
      }}>
        <h3 style={{ fontSize: '1.4rem', margin: '0 0 8px 0', color: '#ffffff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Heart size={22} color="#10b981" /> Community-Driven Vision & Business Model
        </h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
          Learn-o-pia is built around an open community model. We believe quality learning tools should be accessible to everyone worldwide without mandatory paywalls:
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          marginTop: '16px'
        }}>
          <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <strong style={{ color: '#10b981', display: 'block', fontSize: '0.9rem', marginBottom: 4 }}>🤝 Open Access</strong>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4, display: 'block' }}>Free access for learners worldwide across all public courses and study guides.</span>
          </div>

          <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <strong style={{ color: '#a78bfa', display: 'block', fontSize: '0.9rem', marginBottom: 4 }}>💖 Community Support</strong>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4, display: 'block' }}>Sustained by optional community donations and voluntary Supporter Passes.</span>
          </div>

          <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <strong style={{ color: '#f59e0b', display: 'block', fontSize: '0.9rem', marginBottom: 4 }}>💼 Creator Monetization</strong>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4, display: 'block' }}>Empowering course curators and creators to earn directly from paid masterclasses.</span>
          </div>
        </div>
      </div>

      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
    </div>
  );
}
