import React from 'react';
import { Wrench, ShieldAlert, RefreshCw, Lock, GraduationCap } from 'lucide-react';

export default function Maintenance404({ onRefresh, onAdminClick }) {
  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#0a0b10',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      boxSizing: 'border-box',
      textAlign: 'center',
      backgroundImage: `
        radial-gradient(at 20% 20%, rgba(139, 92, 246, 0.15) 0px, transparent 50%),
        radial-gradient(at 80% 80%, rgba(239, 68, 68, 0.12) 0px, transparent 50%)
      `,
      fontFamily: 'var(--font-body, sans-serif)'
    }}>
      <div style={{
        maxWidth: '560px',
        width: '100%',
        padding: '40px 30px',
        background: 'rgba(17, 18, 28, 0.75)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '24px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px'
      }} className="animate-fade-in">
        
        {/* Brand Logo Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
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

        {/* 404 Animated Badge */}
        <div style={{ position: 'relative' }}>
          <span style={{
            fontSize: '5.5rem',
            fontWeight: 900,
            background: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 50%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1,
            letterSpacing: '-0.04em'
          }}>
            404
          </span>
          <div style={{
            position: 'absolute',
            top: '-10px',
            right: '-16px',
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            padding: '6px',
            borderRadius: '50%',
            display: 'flex'
          }}>
            <Wrench size={20} color="#ef4444" />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h1 style={{ fontSize: '1.6rem', color: '#ffffff', margin: 0, fontWeight: 700 }}>
            Website Under Construction
          </h1>
          <p style={{ color: 'var(--text-secondary, #9ca3af)', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>
            Learn-o-pia is currently undergoing scheduled platform upgrades & maintenance. Our team is enhancing features to serve you better.
          </p>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '0.82rem',
          color: '#f59e0b',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <ShieldAlert size={16} color="#f59e0b" flexShrink={0} />
          <span>Access is temporarily restricted for learners and creators.</span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '10px', width: '100%' }}>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
            style={{
              padding: '10px 20px',
              fontSize: '0.88rem',
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <RefreshCw size={16} />
            Refresh & Check Status
          </button>

          {onAdminClick && (
            <button
              onClick={onAdminClick}
              className="btn btn-secondary"
              style={{
                padding: '10px 18px',
                fontSize: '0.85rem',
                borderRadius: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                borderColor: 'rgba(255,255,255,0.1)'
              }}
            >
              <Lock size={15} />
              Admin Access
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
