import React, { useState, useEffect } from 'react';
import { useDatabase } from '../context/DatabaseContext';

export default function AdProgressBar({ onTriggerAd }) {
  const { adSettings, currentUser } = useDatabase();
  
  // Interval in seconds
  const intervalSeconds = (adSettings?.intervalMinutes || 15) * 60;
  const isEnabled = adSettings?.enabled !== false;
  const userCredits = currentUser?.credits || 0;

  const [timeLeft, setTimeLeft] = useState(intervalSeconds);

  useEffect(() => {
    setTimeLeft(intervalSeconds);
  }, [intervalSeconds]);

  useEffect(() => {
    if (!currentUser || !isEnabled || userCredits > 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (onTriggerAd) onTriggerAd();
          return intervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentUser, isEnabled, userCredits, intervalSeconds, onTriggerAd]);

  // NEVER render if user is not logged in, ads are turned off by admin, or user has credits
  if (!currentUser || !isEnabled || userCredits > 0) {
    return null;
  }

  const progressPercent = Math.max(0, Math.min(100, (timeLeft / intervalSeconds) * 100));

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        height: '3px',
        background: 'rgba(139, 92, 246, 0.25)', // Light purple base track
        zIndex: 999999, // Above everything including navigation bar
        pointerEvents: 'none'
      }}
      title={`Community Support reminder in ${Math.ceil(timeLeft / 60)}m`}
    >
      {/* Deep Vibrant Purple Shrinking Progress Line */}
      <div
        style={{
          height: '100%',
          width: `${progressPercent}%`,
          background: 'linear-gradient(90deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%)',
          boxShadow: '0 0 10px rgba(168, 85, 247, 0.9), 0 0 4px #c084fc',
          transition: 'width 1s linear'
        }}
      />
    </div>
  );
}
