import React from 'react';
import { GraduationCap, BookOpen, Film, Shield, Code, Cpu, Award, CheckCircle, ExternalLink, Heart } from 'lucide-react';

export default function About({ setCurrentView }) {
  return (
    <div style={{
      maxWidth: '1100px',
      margin: '0 auto',
      padding: '30px 20px',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      gap: '32px'
    }} className="animate-fade-in">

      {/* Header Hero Banner */}
      <div className="glass-panel" style={{
        padding: '40px 30px',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
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
          fontSize: '2.4rem',
          fontWeight: 800,
          margin: 0,
          background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontFamily: 'var(--font-heading)'
        }}>
          About Learn-o-pia
        </h1>

        <p style={{
          fontSize: '1.05rem',
          color: 'var(--text-secondary, #9ca3af)',
          maxWidth: '720px',
          lineHeight: 1.6,
          margin: 0
        }}>
          Learn-o-pia is a next-generation, open-access university learning portal designed to empower engineering and science students with structured lecture playlists, verified notes, organizers, and past year question papers in a sleek, distraction-free environment.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '10px' }}>
          <button
            onClick={() => setCurrentView('learning')}
            className="btn btn-primary"
            style={{ padding: '10px 22px', fontSize: '0.9rem', borderRadius: '12px' }}
          >
            <BookOpen size={18} />
            Explore Courses
          </button>
        </div>
      </div>

      {/* Platform Core Pillars */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '10px', borderRadius: '12px', width: 'fit-content' }}>
            <Film size={24} color="#3b82f6" />
          </div>
          <h3 style={{ fontSize: '1.2rem', margin: 0, color: '#ffffff' }}>Distraction-Free Classroom</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            Enjoy pinned 16:9 HD video theatre playback with independent playlist queues. No ads, no YouTube algorithm distractions.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '24px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '10px', borderRadius: '12px', width: 'fit-content' }}>
            <BookOpen size={24} color="#10b981" />
          </div>
          <h3 style={{ fontSize: '1.2rem', margin: 0, color: '#ffffff' }}>Verified Study Materials</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            Access curated Syllabus PDFs, Organizers, Lecture Notes, and Formula Sheets uploaded by verified university educators.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '24px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '10px', borderRadius: '12px', width: 'fit-content' }}>
            <Shield size={24} color="#8b5cf6" />
          </div>
          <h3 style={{ fontSize: '1.2rem', margin: 0, color: '#ffffff' }}>Role-Based Ecosystem</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            Educators apply for verified Creator rights to publish custom courses, while Administrators manage permissions and quality.
          </p>
        </div>
      </div>

      {/* Developer & Architecture Spotlight */}
      <div className="glass-panel" style={{
        padding: '30px',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '10px', borderRadius: '12px' }}>
            <Code size={24} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', margin: 0, color: '#ffffff' }}>Developer Spotlight & Architecture</h2>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Built with modern web standards and React engineering</span>
          </div>
        </div>

        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
          Learn-o-pia was conceptualized and built to bridge the gap between video lecture playlists scattered across the web and university semester syllabi. It combines React 18, Vite, Supabase cloud sync, native YouTube iFrame API extractors, and Capacitor cross-platform mobile bindings.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          marginTop: '6px'
        }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>FRONTEND STACK</div>
            <div style={{ fontSize: '0.95rem', color: '#ffffff', fontWeight: 600, marginTop: '4px' }}>React 18 & Vanilla CSS</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700 }}>CLOUD & STORAGE</div>
            <div style={{ fontSize: '0.95rem', color: '#ffffff', fontWeight: 600, marginTop: '4px' }}>Supabase PostgreSQL & LocalStorage</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 700 }}>VIDEO INTEGRATION</div>
            <div style={{ fontSize: '0.95rem', color: '#ffffff', fontWeight: 600, marginTop: '4px' }}>Native YT iFrame API</div>
          </div>
        </div>
      </div>

    </div>
  );
}
