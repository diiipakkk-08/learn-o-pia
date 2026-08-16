import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  BookOpen,
  Play,
  CheckCircle,
  Shield,
  Award,
  LogIn,
  UserPlus,
  FileText,
  ArrowRight,
  Code,
  Sparkles,
  ExternalLink,
  MessageSquare,
  DollarSign,
  TrendingUp,
  BarChart3,
  Scale,
  Zap,
  Users
} from 'lucide-react';
import { useDatabase } from '../context/DatabaseContext';
import TermsModal from './TermsModal';

export default function LandingPage({ setCurrentView, onOpenAuth }) {
  const { courses, currentUser } = useDatabase();
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Mouse Parallax 3D Effect State
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    setMousePos({ x: clientX, y: clientY });

    const rx = ((clientY / innerHeight) - 0.5) * -12;
    const ry = ((clientX / innerWidth) - 0.5) * 12;
    setTilt({ rx, ry });
  };

  const handleCourseClick = () => {
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      else setCurrentView('auth');
    } else {
      setCurrentView('learning');
    }
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      style={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#07080d',
        color: '#ffffff',
        fontFamily: 'var(--font-body, sans-serif)',
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: `
          radial-gradient(800px at ${mousePos.x}px ${mousePos.y}px, rgba(139, 92, 246, 0.18), transparent 70%),
          radial-gradient(at 15% 15%, rgba(99, 102, 241, 0.12) 0px, transparent 45%),
          radial-gradient(at 85% 85%, rgba(236, 72, 153, 0.1) 0px, transparent 45%)
        `
      }}
      className="animate-fade-in"
    >
      {/* ── HERO SECTION WITH 3D GLASS TILT ── */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '70px 20px 40px 20px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px'
      }}>
        {/* Animated Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 18px',
          borderRadius: '30px',
          background: 'rgba(139, 92, 246, 0.12)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          color: '#a78bfa',
          fontSize: '0.85rem',
          fontWeight: 700,
          letterSpacing: '0.04em'
        }}>
          <Sparkles size={16} color="#a78bfa" />
          <span>Next-Gen Distraction-Free Learning & Academic Monetization</span>
        </div>

        {/* 3D Main Headline */}
        <div style={{
          transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transition: 'transform 0.1s ease-out'
        }}>
          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: 800,
            lineHeight: 1.12,
            maxWidth: '960px',
            margin: '0 auto',
            background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 40%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: 'var(--font-heading)'
          }}>
            Master Real Knowledge. Zero Distractions. Pure Focus.
          </h1>
        </div>

        <p style={{
          fontSize: '1.15rem',
          color: 'var(--text-secondary, #9ca3af)',
          maxWidth: '820px',
          lineHeight: 1.6,
          margin: 0
        }}>
          Learn-o-pia eliminates YouTube recommendation traps and algorithm noise. Stream structured lectures, track semester attendance, join hashtag doubt streams, or publish and monetize your own university courses!
        </p>

        {/* Dual Call To Actions */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '12px' }}>
          <button
            onClick={handleCourseClick}
            className="btn btn-primary"
            style={{
              padding: '16px 36px',
              fontSize: '1.05rem',
              fontWeight: 700,
              borderRadius: '16px',
              boxShadow: '0 10px 30px rgba(139, 92, 246, 0.4)',
              gap: '10px'
            }}
          >
            🚀 Get Started Free <ArrowRight size={18} />
          </button>

          <button
            onClick={() => setCurrentView('learning')}
            className="btn btn-secondary"
            style={{
              padding: '16px 30px',
              fontSize: '1.05rem',
              fontWeight: 600,
              borderRadius: '16px',
              borderColor: 'rgba(255, 255, 255, 0.15)',
              gap: '10px'
            }}
          >
            <BookOpen size={18} /> Explore Curricula
          </button>
        </div>

        {/* Dynamic Statistics Counter Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '20px',
          width: '100%',
          maxWidth: '900px',
          marginTop: '30px',
          padding: '20px 24px',
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>15,000+</div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Lectures Streamed</span>
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399' }}>98.4%</div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Focus Retention Rate</span>
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#a78bfa' }}>100%</div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Distraction-Free Verified</span>
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b' }}>4.9 / 5.0</div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Educator & Student Rating</span>
          </div>
        </div>
      </section>

      {/* ── CORE PLATFORM PILLARS GRID ── */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '50px 20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
        gap: '24px'
      }}>
        {/* Card 1: Distraction Free Player */}
        <div className="glass-panel" style={styles.featureCard}>
          <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '12px', borderRadius: '14px', width: 'fit-content' }}>
            <Play size={26} color="#6366f1" />
          </div>
          <h3 style={{ fontSize: '1.2rem', margin: 0, color: '#ffffff' }}>Distraction-Free Theatre Player</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Pinned lecture video stage with auto-scrolling queues. Zero recommended sidebar distractions, zero Shorts, and zero unskippable commercial ads.
          </p>
        </div>

        {/* Card 2: Attendance Tracker */}
        <div className="glass-panel" style={styles.featureCard}>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '12px', borderRadius: '14px', width: 'fit-content' }}>
            <BarChart3 size={26} color="#10b981" />
          </div>
          <h3 style={{ fontSize: '1.2rem', margin: 0, color: '#ffffff' }}>Smart Attendance & Progress Tracker</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Semester-wise attendance logging with minimum 75% criteria alerts, lecture progress persistence, and automated subject performance analytics.
          </p>
        </div>

        {/* Card 3: Discussion & Doubts Threads */}
        <div className="glass-panel" style={styles.featureCard}>
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '12px', borderRadius: '14px', width: 'fit-content' }}>
            <MessageSquare size={26} color="#f59e0b" />
          </div>
          <h3 style={{ fontSize: '1.2rem', margin: 0, color: '#ffffff' }}>Hashtag Doubts & Thread Streams</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Public and private discussion threads with code access (`DS-9182`), nested replies, and peer problem-solving without cluttered spam.
          </p>
        </div>

        {/* Card 4: Creator Monetization */}
        <div className="glass-panel" style={styles.featureCard}>
          <div style={{ background: 'rgba(236, 72, 153, 0.15)', padding: '12px', borderRadius: '14px', width: 'fit-content' }}>
            <DollarSign size={26} color="#ec4899" />
          </div>
          <h3 style={{ fontSize: '1.2rem', margin: 0, color: '#ffffff' }}>Course Creation & Monetization Engine</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Verified educators, professors, and creators can publish degree curricula, share standalone study PDFs, and monetize their expertise.
          </p>
        </div>
      </section>

      {/* ── FEATURED DEGREE COURSES PREVIEW ── */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px 60px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '30px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
            Featured Degree Programs & Open Curricula
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '6px' }}>
            Select your department and access semester-wise lecture playlists instantly.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          {courses.slice(0, 4).map(course => (
            <div
              key={course.id}
              className="glass-panel"
              style={{
                padding: '24px',
                borderRadius: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                textAlign: 'left'
              }}
            >
              <div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#8b5cf6',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {course.department || 'Degree Program'}
                </span>
                <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: '8px 0 6px 0', fontWeight: 700 }}>
                  {course.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  {course.description || 'Comprehensive university degree curriculum with semester lecture series.'}
                </p>
              </div>

              <button
                onClick={handleCourseClick}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '0.85rem',
                  borderRadius: '10px',
                  borderColor: 'rgba(139, 92, 246, 0.4)',
                  color: '#ffffff'
                }}
              >
                Enroll & Start Studying
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER WITH TERMS & POLICIES ── */}
      <footer style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '40px 20px',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
          <GraduationCap size={20} color="#8b5cf6" />
          <span style={{ fontWeight: 700, color: '#ffffff' }}>Learn-o-pia</span>
          <span>— Open-Access University Learning Portal</span>
        </div>

        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', margin: '14px 0' }}>
          <button
            onClick={() => setShowTermsModal(true)}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.82rem', textDecoration: 'underline' }}
          >
            Terms of Service & Platform Policies
          </button>
          <button
            onClick={() => setCurrentView('about')}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.82rem' }}
          >
            About Learn-o-pia
          </button>
        </div>

        <p style={{ margin: 0 }}>© 2026 Learn-o-pia. Built for university students, educators, and creators worldwide.</p>
      </footer>

      {/* Terms & Conditions Modal */}
      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
    </div>
  );
}

const styles = {
  featureCard: {
    padding: '26px',
    borderRadius: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    textAlign: 'left'
  }
};
