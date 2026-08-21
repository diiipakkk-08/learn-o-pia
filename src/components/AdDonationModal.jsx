import React, { useState, useEffect, useRef } from 'react';
import { Heart, Sparkles, X, ExternalLink, ShieldCheck, Play } from 'lucide-react';
import { useDatabase } from '../context/DatabaseContext';

function extractYoutubeVideoId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export default function AdDonationModal({ isOpen, onClose }) {
  const { adSettings, currentUser } = useDatabase();
  const skipDelay = adSettings?.skipDelaySeconds || 10;
  const [secondsRemaining, setSecondsRemaining] = useState(skipDelay);
  const [canSkip, setCanSkip] = useState(false);

  // Pause all background videos whenever modal is shown
  useEffect(() => {
    if (isOpen) {
      setSecondsRemaining(skipDelay);
      setCanSkip(false);

      // 1. Dispatch custom pause event for LearningPlayer
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('learnopia-pause-media'));

        // 2. Pause any background YouTube iframes directly via postMessage
        const iframes = document.querySelectorAll('iframe:not(.ad-modal-iframe)');
        iframes.forEach((iframe) => {
          try {
            iframe.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo' }), '*');
          } catch (e) {}
        });
      }

      const timer = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setCanSkip(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen, skipDelay]);

  if (!isOpen) return null;

  const ytVideoId = extractYoutubeVideoId(adSettings?.youtubeUrl);

  return (
    <div style={styles.overlay} className="animate-fade-in">
      <div style={styles.modal} className="glass-panel">
        
        {/* Top Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={styles.heartIconWrapper}>
              <Heart size={18} color="#ffffff" fill="#8b5cf6" />
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#c4b5fd', fontWeight: 700 }}>
                Learn-o-pia Community Sponsor & Ad
              </span>
              <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: '2px 0 0 0', fontWeight: 700 }}>
                {adSettings?.title || "Support Free & Open Education"}
              </h3>
            </div>
          </div>

          {canSkip && (
            <button
              onClick={onClose}
              style={styles.closeBtn}
              title="Close Ad"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Video or Message Body */}
        <div style={styles.body}>
          {ytVideoId ? (
            <div style={styles.videoContainer}>
              <iframe
                className="ad-modal-iframe"
                src={`https://www.youtube-nocookie.com/embed/${ytVideoId}?autoplay=1&rel=0&modestbranding=1`}
                title="Sponsor Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={styles.videoIframe}
              />
            </div>
          ) : null}

          <p style={styles.description}>
            {adSettings?.message || "Learn-o-pia is built by students, for students. Help us keep all degree curricula, attendance algorithms, and YouTube lecture sync servers fast, open, and free for everyone!"}
          </p>

          {/* 10 Credits Info Box */}
          <div style={styles.creditsBox}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a78bfa', fontWeight: 700, fontSize: '0.88rem' }}>
              <Sparkles size={16} color="#8b5cf6" /> 10 Platform Credits = 1,000 Ad-Free Hours
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: '1.4' }}>
              Every active user account gets 10 credits (= 100 hours each = 1,000 hours uninterrupted learning) without intrusive pop-ups!
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={styles.footer}>
          <a
            href={adSettings?.targetUrl || "https://github.com/diiipakkk-08/learn-o-pia"}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary"
            style={{
              padding: '10px 20px',
              fontSize: '0.88rem',
              fontWeight: 700,
              gap: 6,
              background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              color: '#ffffff'
            }}
          >
            <ExternalLink size={15} /> Support Community / Sponsor
          </a>

          <button
            onClick={canSkip ? onClose : undefined}
            className={`btn ${canSkip ? 'btn-secondary' : ''}`}
            disabled={!canSkip}
            style={{
              padding: '10px 18px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: canSkip ? 'pointer' : 'not-allowed',
              opacity: canSkip ? 1 : 0.6,
              background: canSkip ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
              color: canSkip ? '#ffffff' : 'var(--text-muted)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {canSkip ? (
              'Skip & Continue Learning ➔'
            ) : (
              `Skip in ${secondsRemaining}s...`
            )}
          </button>
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
    background: 'rgba(0, 0, 0, 0.82)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    padding: '20px'
  },
  modal: {
    width: '100%',
    maxWidth: '560px',
    background: 'linear-gradient(180deg, rgba(26, 16, 45, 0.96) 0%, rgba(13, 9, 23, 0.98) 100%)',
    border: '1px solid rgba(139, 92, 246, 0.35)',
    borderRadius: '20px',
    boxShadow: '0 25px 80px rgba(0,0,0,0.9), 0 0 40px rgba(139, 92, 246, 0.2)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left'
  },
  header: {
    padding: '20px 24px',
    borderBottom: '1px solid rgba(139, 92, 246, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  heartIconWrapper: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'rgba(139, 92, 246, 0.2)',
    border: '1px solid rgba(139, 92, 246, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    cursor: 'pointer'
  },
  body: {
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  videoContainer: {
    width: '100%',
    aspectRatio: '16/9',
    borderRadius: '12px',
    overflow: 'hidden',
    background: '#000000',
    border: '1px solid rgba(255,255,255,0.1)',
    marginBottom: '6px'
  },
  videoIframe: {
    width: '100%',
    height: '100%',
    border: 'none'
  },
  description: {
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    margin: 0
  },
  creditsBox: {
    background: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.25)',
    borderRadius: '12px',
    padding: '14px 16px'
  },
  footer: {
    padding: '16px 24px 20px 24px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '10px'
  }
};
