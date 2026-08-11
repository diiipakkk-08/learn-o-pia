import React from 'react';
import { GraduationCap, Home, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function NotFound404({ setCurrentView }) {
  return (
    <div style={{
      minHeight: '80vh',
      width: '100%',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      boxSizing: 'border-box',
      textAlign: 'center',
      fontFamily: 'var(--font-body, sans-serif)'
    }}>
      <div style={{
        maxWidth: '520px',
        width: '100%',
        padding: '40px 30px',
        background: 'rgba(17, 18, 28, 0.75)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '24px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px'
      }} className="animate-fade-in glass-panel">
        
        {/* Brand Logo Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            padding: '8px',
            borderRadius: '12px',
            display: 'flex'
          }}>
            <GraduationCap size={24} color="#ffffff" />
          </div>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
            Learn-o-pia
          </span>
        </div>

        {/* 404 Glowing Badge */}
        <div style={{ position: 'relative' }}>
          <span style={{
            fontSize: '5.5rem',
            fontWeight: 900,
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1,
            letterSpacing: '-0.04em'
          }}>
            404
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h2 style={{ fontSize: '1.5rem', color: '#ffffff', margin: 0, fontWeight: 700 }}>
            Page Not Found
          </h2>
          <p style={{ color: 'var(--text-secondary, #9ca3af)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
            The requested page or course material could not be found or has been moved.
          </p>
        </div>

        {/* Return Button */}
        <button
          onClick={() => {
            if (setCurrentView) setCurrentView('learning');
            else window.location.href = '/';
          }}
          className="btn btn-primary"
          style={{
            padding: '12px 24px',
            fontSize: '0.9rem',
            borderRadius: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '10px',
            cursor: 'pointer'
          }}
        >
          <Home size={18} />
          Return to Learning Dashboard
        </button>
      </div>
    </div>
  );
}
