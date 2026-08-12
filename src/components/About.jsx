import React from 'react';
import { GraduationCap, Zap, ShieldCheck, Target, BookOpen, Layers, CheckCircle2, Flame, Heart, Compass, ArrowRight } from 'lucide-react';

export default function About({ setCurrentView }) {
  return (
    <div style={{
      maxWidth: '1100px',
      margin: '0 auto',
      padding: '30px 20px',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      gap: '32px',
      fontFamily: 'var(--font-body, sans-serif)'
    }} className="animate-fade-in">

      {/* Header Banner */}
      <div className="glass-panel" style={{
        padding: '46px 30px',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
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
          fontSize: '2.5rem',
          fontWeight: 800,
          margin: 0,
          background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontFamily: 'var(--font-heading)'
        }}>
          Why Learn-o-pia Exists
        </h1>

        <p style={{
          fontSize: '1.1rem',
          color: 'var(--text-secondary, #9ca3af)',
          maxWidth: '780px',
          lineHeight: 1.6,
          margin: 0
        }}>
          A distraction-free sanctuary built for students and lifelong learners who want to master real knowledge without algorithm traps, endless Shorts, or ad interruptions.
        </p>

        <button
          onClick={() => setCurrentView('learning')}
          className="btn btn-primary"
          style={{ padding: '12px 28px', fontSize: '0.95rem', borderRadius: '12px', marginTop: '6px' }}
        >
          <BookOpen size={18} />
          Start Studying Now
        </button>
      </div>

      {/* WHY LEARN-O-PIA IS BETTER THAN YOUTUBE */}
      <div className="glass-panel" style={{
        padding: '36px 30px',
        borderRadius: '22px',
        border: '1px solid rgba(239, 68, 68, 0.25)',
        background: 'rgba(17, 18, 28, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '12px', borderRadius: '14px' }}>
            <Zap size={28} color="#ef4444" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.6rem', margin: 0, color: '#ffffff', fontWeight: 800 }}>
              The Problem with Studying on YouTube
            </h2>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Why social video platforms ruin student productivity
            </span>
          </div>
        </div>

        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
          YouTube is designed for entertainment and maximum screen time — not deep education. When you try to watch a lecture on YouTube, you are constantly bombarded with algorithmically personalized Shorts, gaming clips, news popups, clickbait thumbnails, and unskippable ads. Within 15 minutes, most students lose focus and drift away from their syllabus.
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
              ❌ YouTube Distractions
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <li>Addictive Shorts & reel recommendations</li>
              <li>Irrelevant video sidebars & gaming popups</li>
              <li>Unskippable ads breaking lecture train of thought</li>
              <li>Scattered videos with no organized syllabus structure</li>
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
              <li>100% Distraction-Free Theatre Stage</li>
              <li>Zero ads, zero Shorts, zero algorithm sidebars</li>
              <li>Sequential lecture queue with auto-scroll to stage</li>
              <li>Direct attachment of verified Syllabus PDFs & Notes</li>
            </ul>
          </div>
        </div>
      </div>

      {/* BUILT FOR EVERY PARTICULAR LEARNER */}
      <div className="glass-panel" style={{
        padding: '36px 30px',
        borderRadius: '22px',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '12px', borderRadius: '14px' }}>
            <Compass size={28} color="#8b5cf6" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.6rem', margin: 0, color: '#ffffff', fontWeight: 800 }}>
              Built for Every Particular Learner
            </h2>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Beyond engineering — empowering all disciplines and skills
            </span>
          </div>
        </div>

        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
          While Learn-o-pia began with foundational engineering and technology curricula, our platform is engineered for <strong>every learner</strong> regardless of field or goal. Whether you are studying university sciences, humanities, business economics, competitive entrance exams, creative arts, or acquiring new practical skills — Learn-o-pia provides the structured environment you need to succeed.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px'
        }}>
          <div className="glass-panel" style={{ padding: '18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h4 style={{ fontSize: '1.05rem', margin: '0 0 6px 0', color: '#ffffff' }}>🎓 University Degree Students</h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Semester-wise lecture series aligned with university syllabi, organizers, and past exam papers.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h4 style={{ fontSize: '1.05rem', margin: '0 0 6px 0', color: '#ffffff' }}>📚 Competitive Exam Aspirants</h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Focused topic-by-topic playlists to master entrance examinations without losing study momentum.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h4 style={{ fontSize: '1.05rem', margin: '0 0 6px 0', color: '#ffffff' }}>💡 Skill Builders & Lifelong Learners</h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Curated masterclasses in technology, economics, creative arts, and personal development.
            </p>
          </div>
        </div>
      </div>

      {/* CORE VALUES */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px'
      }}>
        <div className="glass-panel" style={{ padding: '26px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Target size={26} color="#6366f1" />
          <h3 style={{ fontSize: '1.2rem', margin: 0, color: '#ffffff' }}>Focused Attention</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            Every UI element is engineered to keep your attention on the video lecture and attached notes.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '26px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <ShieldCheck size={26} color="#10b981" />
          <h3 style={{ fontSize: '1.2rem', margin: 0, color: '#ffffff' }}>Educator Verified Content</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            Courses and playlists are published and organized by verified university professors and creators.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '26px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Layers size={26} color="#8b5cf6" />
          <h3 style={{ fontSize: '1.2rem', margin: 0, color: '#ffffff' }}>Structured Learning Paths</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            From semester subject lists to PDF lecture notes, everything is organized in logical sequence.
          </p>
        </div>
      </div>

    </div>
  );
}
