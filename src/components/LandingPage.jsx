import React from 'react';
import { GraduationCap, BookOpen, Play, CheckCircle, Shield, Award, LogIn, UserPlus, FileText, ArrowRight, Code, Sparkles, ExternalLink } from 'lucide-react';
import { useDatabase } from '../context/DatabaseContext';

export default function LandingPage({ setCurrentView, onOpenAuth }) {
  const { courses, currentUser } = useDatabase();

  const handleCourseClick = () => {
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      else setCurrentView('auth');
    } else {
      setCurrentView('learning');
    }
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      backgroundColor: '#0a0b10',
      color: '#ffffff',
      fontFamily: 'var(--font-body, sans-serif)',
      backgroundImage: `
        radial-gradient(at 15% 15%, rgba(99, 102, 241, 0.15) 0px, transparent 45%),
        radial-gradient(at 85% 85%, rgba(139, 92, 246, 0.12) 0px, transparent 45%)
      `
    }} className="animate-fade-in">

      {/* TOP NAVIGATION BAR FOR LANDING PAGE */}
      <header style={{
        padding: '16px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(10, 11, 16, 0.85)'
      }}>
        {/* Brand Logo */}
        <div
          onClick={() => setCurrentView('landing')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            padding: '8px',
            borderRadius: '12px',
            display: 'flex'
          }}>
            <GraduationCap size={22} color="#ffffff" />
          </div>
          <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
            Learn-o-pia
          </span>
        </div>

        {/* Nav Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            onClick={() => setCurrentView('learning')}
            style={styles.navLink}
          >
            Learning Workspace
          </button>
          <button
            onClick={() => setCurrentView('about')}
            style={styles.navLink}
          >
            About
          </button>
          <button
            onClick={() => setCurrentView('results-404')}
            style={styles.navLink}
          >
            Results
          </button>
          <button
            onClick={() => setCurrentView('attendance-404')}
            style={styles.navLink}
          >
            Attendance
          </button>
          <button
            onClick={() => setCurrentView('discussions-404')}
            style={styles.navLink}
          >
            Discussions
          </button>
        </nav>

        {/* Auth CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {!currentUser ? (
            <>
              <button
                onClick={() => setCurrentView('auth')}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.85rem', borderRadius: '10px' }}
              >
                <LogIn size={15} />
                Log In
              </button>
              <button
                onClick={() => setCurrentView('auth')}
                className="btn btn-primary"
                style={{ padding: '8px 18px', fontSize: '0.85rem', borderRadius: '10px' }}
              >
                <UserPlus size={15} />
                Get Started
              </button>
            </>
          ) : (
            <button
              onClick={() => setCurrentView('learning')}
              className="btn btn-primary"
              style={{ padding: '8px 18px', fontSize: '0.85rem', borderRadius: '10px' }}
            >
              Go to Workspace
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </header>

      {/* HERO SECTION */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '80px 20px 60px 20px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '30px',
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          color: '#a855f7',
          fontSize: '0.85rem',
          fontWeight: 600
        }}>
          <Sparkles size={16} />
          <span>Open-Access University Learning Portal</span>
        </div>

        <h1 style={{
          fontSize: '3.2rem',
          fontWeight: 800,
          lineHeight: 1.15,
          maxWidth: '900px',
          margin: 0,
          background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #8b5cf6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontFamily: 'var(--font-heading)'
        }}>
          Master University Engineering & Science Curricula
        </h1>

        <p style={{
          fontSize: '1.15rem',
          color: 'var(--text-secondary, #9ca3af)',
          maxWidth: '720px',
          lineHeight: 1.6,
          margin: 0
        }}>
          Curated video lecture playlists, verified Syllabus PDFs, past organizers, and reference notes — organized by semester and department in a distraction-free theatre player.
        </p>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '10px' }}>
          <button
            onClick={handleCourseClick}
            className="btn btn-primary"
            style={{
              padding: '14px 32px',
              fontSize: '1rem',
              fontWeight: 700,
              borderRadius: '14px',
              boxShadow: '0 10px 30px rgba(99, 102, 241, 0.4)'
            }}
          >
            🚀 Get Started Free
          </button>
          <button
            onClick={() => setCurrentView('learning')}
            className="btn btn-secondary"
            style={{
              padding: '14px 28px',
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: '14px',
              borderColor: 'rgba(255, 255, 255, 0.15)'
            }}
          >
            <BookOpen size={18} />
            Browse Courses
          </button>
        </div>
      </section>

      {/* FEATURE CARDS */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px'
      }}>
        <div className="glass-panel" style={styles.featureCard}>
          <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '12px', borderRadius: '14px', width: 'fit-content' }}>
            <Play size={26} color="#6366f1" />
          </div>
          <h3 style={{ fontSize: '1.25rem', margin: 0, color: '#ffffff' }}>Distraction-Free Theatre Stage</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Pinned sticky video stage on the left with an auto-scrolling lecture queue on the right. Pure learning without video recommendations or ads.
          </p>
        </div>

        <div className="glass-panel" style={styles.featureCard}>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '12px', borderRadius: '14px', width: 'fit-content' }}>
            <FileText size={26} color="#10b981" />
          </div>
          <h3 style={{ fontSize: '1.25rem', margin: 0, color: '#ffffff' }}>Verified Study Notes & PDFs</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Instant access to Syllabus PDFs, Organizers, Lecture Notes, and Formula Sheets uploaded by professors and top educators.
          </p>
        </div>

        <div className="glass-panel" style={styles.featureCard}>
          <div style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '12px', borderRadius: '14px', width: 'fit-content' }}>
            <Shield size={26} color="#8b5cf6" />
          </div>
          <h3 style={{ fontSize: '1.25rem', margin: 0, color: '#ffffff' }}>Educator Creator Studio</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Professors and creators can import 100% of YouTube playlist lecture series with one click and structure degree programs.
          </p>
        </div>
      </section>

      {/* FEATURED DEGREE COURSES PREVIEW */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '60px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '30px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
            Available Degree Programs & Curricula
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '6px' }}>
            Select your department and access semester-wise lecture playlists.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
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
                border: '1px solid rgba(255, 255, 255, 0.08)'
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

      {/* FOOTER */}
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
        <p style={{ margin: 0 }}>© 2026 Learn-o-pia. Built for students and university educators.</p>
      </footer>

    </div>
  );
}

const styles = {
  navLink: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary, #9ca3af)',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'color 0.2s ease'
  },
  featureCard: {
    padding: '28px',
    borderRadius: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    border: '1px solid rgba(255, 255, 255, 0.08)'
  }
};
