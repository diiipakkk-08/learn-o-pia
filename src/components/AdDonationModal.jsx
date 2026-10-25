import React, { useState, useEffect } from 'react';
import { Heart, X, ExternalLink, ShieldCheck } from 'lucide-react';
import { useDatabase } from '../context/DatabaseContext';

function extractYoutubeVideoId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export default function AdDonationModal({ isOpen, onClose }) {
  const { adSettings } = useDatabase();
  const skipDelay = adSettings?.skipDelaySeconds || 10;
  const [secondsRemaining, setSecondsRemaining] = useState(skipDelay);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSecondsRemaining(skipDelay);
      setCanSkip(false);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('learnopia-pause-media'));
        const iframes = document.querySelectorAll('iframe:not(.ad-modal-iframe)');
        iframes.forEach((iframe) => {
          try {
            iframe.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo' }), '*');
          } catch {}
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
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && canSkip) onClose?.();
      }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-12 p-4 overflow-y-auto bg-black/60 animate-fade-in"
    >
      <div className="w-full max-w-lg mb-8 rounded-xl border border-border-subtle bg-surface p-6 shadow-modal space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <Heart size={18} className="text-accent-forest" />
            <div>
              <span className="font-editorial text-2xl tracking-tight block leading-none">
                Community Server Support
              </span>
              <span className="text-[10px] text-text-muted font-mono-tabular uppercase mt-0.5 block">
                KEEPING LEARN-O-PIA 100% FREE FOR STUDENTS
              </span>
            </div>
          </div>
          {canSkip && (
            <button
              onClick={onClose}
              className="p-1 rounded text-text-muted hover:text-text-primary"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Video / Info Container */}
        {ytVideoId ? (
          <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-border-subtle">
            <iframe
              className="w-full h-full border-none ad-modal-iframe"
              src={`https://www.youtube-nocookie.com/embed/${ytVideoId}?autoplay=1&mute=0&controls=1&modestbranding=1`}
              title="Community Sponsor"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="p-6 rounded-lg border border-border-subtle bg-canvas space-y-3 text-center">
            <ShieldCheck size={32} className="text-accent-forest mx-auto" />
            <h3 className="text-sm font-bold">100% Community Supported</h3>
            <p className="text-xs text-text-secondary leading-relaxed max-w-sm mx-auto">
              Learn-O-Pia has zero investor backing and zero subscription paywalls. Viewing our educational partner sponsors funds the database infrastructure.
            </p>
          </div>
        )}

        {/* Sponsor Banner & Link */}
        {adSettings?.bannerLink && (
          <a
            href={adSettings.bannerLink}
            target="_blank"
            rel="noreferrer"
            className="p-3 rounded-lg border border-border-strong bg-canvas flex items-center justify-between hover:bg-surface-hover text-xs font-semibold text-text-primary group"
          >
            <span>Learn More About Our Educational Partner &rarr;</span>
            <ExternalLink size={14} className="text-text-muted group-hover:text-text-primary" />
          </a>
        )}

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-between">
          <div className="text-xs font-mono-tabular text-text-muted">
            {canSkip ? (
              <span className="text-accent-forest font-semibold">Thank you for supporting the platform!</span>
            ) : (
              <span>Skip becomes available in {secondsRemaining}s</span>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={!canSkip}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              canSkip
                ? 'bg-accent-ink text-text-on-dark hover:opacity-95'
                : 'bg-[#E6E2DA] text-text-muted cursor-not-allowed opacity-60'
            }`}
          >
            {canSkip ? 'Continue to Workspace' : `Skip in ${secondsRemaining}s`}
          </button>
        </div>
      </div>
    </div>
  );
}
