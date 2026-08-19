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
  Users,
  Heart,
  Globe
} from 'lucide-react';
import { useDatabase } from '../context/DatabaseContext';
import TermsModal from './TermsModal';

export default function LandingPage({ setCurrentView, onOpenAuth }) {
  const { courses, currentUser } = useDatabase();
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      {/* ── HERO SECTION WITH 3D TILT ── */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: isMobile ? '36px 16px 24px 16px' : '70px 20px 40px 20px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: isMobile ? '16px' : '24px'
      }}>
        {/* Community Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: isMobile ? '4px 12px' : '6px 18px',
          borderRadius: '30px',
          background: 'rgba(139, 92, 246, 0.12)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          color: '#a78bfa',
          fontSize: isMobile ? '0.75rem' : '0.85rem',
          fontWeight: 700,
          letterSpacing: '0.04em'
        }}>
          <Sparkles size={isMobile ? 14 : 16} color="#a78bfa" />
          <span>Universal Community Curation & Focus Learning</span>
        </div>

        {/* 3D Main Headline */}
        <div style={{
          transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transition: 'transform 0.1s ease-out'
        }}>
          <h1 style={{
            fontSize: isMobile ? '1.8rem' : '3.5rem',
            fontWeight: 800,
            lineHeight: 1.18,
            maxWidth: '960px',
            margin: '0 auto',
            background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 40%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: 'var(--font-heading)'
          }}>
            Curate Any Video Series into Focus Courses. Share or Sell to Anyone.
          </h1>
        </div>

        <p style={{
          fontSize: isMobile ? '0.92rem' : '1.15rem',
          color: 'var(--text-secondary, #9ca3af)',
          maxWidth: '840px',
          lineHeight: 1.6,
          margin: 0
        }}>
          Learn-o-pia is an open, community-driven platform for everyone. Structure YouTube video series, guides, and study materials into clean focus courses across coding, self-development, business, science, creative arts, or academic tracks — then share freely or monetize your courses!
        </p>

        {/* Dual Call To Actions */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' }}>
          <button
            onClick={handleCourseClick}
            className="btn btn-primary"
            style={{
              padding: isMobile ? '12px 20px' : '16px 36px',
              fontSize: isMobile ? '0.9rem' : '1.05rem',
              fontWeight: 700,
              borderRadius: '14px',
              boxShadow: '0 10px 30px rgba(139, 92, 246, 0.4)',
              gap: '8px'
            }}
          >
            🚀 Explore Open Courses <ArrowRight size={16} />
          </button>

          <button
            onClick={() => setCurrentView('studio')}
            className="btn btn-secondary"
            style={{
              padding: isMobile ? '12px 20px' : '16px 30px',
              fontSize: isMobile ? '0.9rem' : '1.05rem',
              fontWeight: 600,
              borderRadius: '14px',
              borderColor: 'rgba(255, 255, 255, 0.15)',
              gap: '8px'
            }}
          >
            <Sparkles size={16} color="#a78bfa" /> Curate & Sell a Course
          </button>
        </div>

        {/* Community Statistics Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: isMobile ? '12px' : '20px',
          width: '100%',
          maxWidth: '900px',
          marginTop: isMobile ? '16px' : '30px',
          padding: isMobile ? '14px 16px' : '20px 24px',
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div>
            <div style={{ fontSize: isMobile ? '1.2rem' : '1.6rem', fontWeight: 800, color: '#ffffff' }}>100% Free</div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Community Open Access</span>
          </div>
          <div>
            <div style={{ fontSize: isMobile ? '1.2rem' : '1.6rem', fontWeight: 800, color: '#34d399' }}>Zero Ads</div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Pure Focus Theatre Player</span>
          </div>
          <div>
            <div style={{ fontSize: isMobile ? '1.2rem' : '1.6rem', fontWeight: 800, color: '#a78bfa' }}>Any Subject</div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Coding & Academics</span>
          </div>
          <div>
            <div style={{ fontSize: isMobile ? '1.2rem' : '1.6rem', fontWeight: 800, color: '#f59e0b' }}>Share & Sell</div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Curator Revenue Engine</span>
          </div>
        </div>
      </section>

      {/* ── PLATFORM PILLARS GRID ── */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: isMobile ? '24px 16px' : '50px 20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: isMobile ? '16px' : '24px'
      }}>
        {/* Card 1: Universal Curation */}
        <div className="glass-panel" style={styles.featureCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '10px', borderRadius: '12px', flexShrink: 0 }}>
              <Globe size={22} color="#6366f1" />
            </div>
            <h3 style={{ fontSize: '1.05rem', margin: 0, color: '#ffffff' }}>Universal Curation for Everyone</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Organize YouTube video series, PDF guides, and links into structured courses. Perfect for software engineering, self-development, business, or creative hobbies.
          </p>
        </div>

        {/* Card 2: Distraction Free Player */}
        <div className="glass-panel" style={styles.featureCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '10px', borderRadius: '12px', flexShrink: 0 }}>
              <Play size={22} color="#10b981" />
            </div>
            <h3 style={{ fontSize: '1.05rem', margin: 0, color: '#ffffff' }}>Distraction-Free Focus Stage</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Watch curated courses without YouTube recommendations, Shorts rabbit holes, or popups breaking your concentration.
          </p>
        </div>

        {/* Card 3: Community Discussions */}
        <div className="glass-panel" style={styles.featureCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '10px', borderRadius: '12px', flexShrink: 0 }}>
              <MessageSquare size={22} color="#f59e0b" />
            </div>
            <h3 style={{ fontSize: '1.05rem', margin: 0, color: '#ffffff' }}>Community Threads & Code Joiner</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Join public or private discussion streams (`DS-9182`), ask questions, reply directly to peers, and build learning communities.
          </p>
        </div>

        {/* Card 4: Creator Monetization & Donations */}
        <div className="glass-panel" style={styles.featureCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(236, 72, 153, 0.15)', padding: '10px', borderRadius: '12px', flexShrink: 0 }}>
              <DollarSign size={22} color="#ec4899" />
            </div>
            <h3 style={{ fontSize: '1.05rem', margin: 0, color: '#ffffff' }}>Share Freely or Monetize Courses</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Share your curated learning paths freely with the community or offer paid access to monetize custom masterclasses and study notes.
          </p>
        </div>
      </section>

      {/* ── FEATURED COURSES & LEARNING PATHS ── */}
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
            Explore Community Curated Courses
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '6px' }}>
            From programming and technology to personal growth and science.
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
                  {course.department || 'Curated Learning Path'}
                </span>
                <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: '8px 0 6px 0', fontWeight: 700 }}>
                  {course.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  {course.description || 'Curated video series with attached resources and organized playlists.'}
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
                Start Learning Now
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER WITH TERMS & LEGAL CONTRACT ── */}
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
          <span>— Open Community Curation Platform</span>
        </div>

        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', margin: '14px 0' }}>
          <button
            onClick={() => setShowTermsModal(true)}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.82rem', textDecoration: 'underline' }}
          >
            Platform Terms of Service & Legal Contract
          </button>
          <button
            onClick={() => setCurrentView('about')}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.82rem' }}
          >
            About Learn-o-pia
          </button>
        </div>

        <p style={{ margin: 0 }}>© 2026 Learn-o-pia. Built for global learners, curators, and creators.</p>
      </footer>

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
