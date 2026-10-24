import React from 'react';
import { Heart } from 'lucide-react';
import { useDatabase } from '../context/DatabaseContext';

export default function AdProgressBar({ onTriggerAd, onOpenModal, cinemaMode = false, isPlayerView = false }) {
  const { serverGoal } = useDatabase();
  const trigger = onOpenModal || onTriggerAd;

  const current = serverGoal?.currentAmount || 420;
  const goal = serverGoal?.goalAmount || 500;
  const pct = Math.min(100, Math.round((current / goal) * 100));

  return (
    <div
      onClick={trigger}
      className="p-3 mx-2 my-2 rounded-lg border cursor-pointer transition-all hover:opacity-90 group select-none"
      style={{
        backgroundColor: cinemaMode && isPlayerView ? '#222220' : '#FAF8F5',
        borderColor: cinemaMode && isPlayerView ? '#2E2E2B' : '#E4E0D8'
      }}
      title="Click to learn about how Learn-O-Pia stays 100% free"
    >
      <div className="flex items-center justify-between text-xs mb-1.5">
        <div className="flex items-center gap-1.5 font-semibold text-[11px] text-text-primary">
          <Heart size={13} className="text-accent-forest" />
          <span>Server Free Pledge</span>
        </div>
        <span className="font-mono-tabular font-bold text-[11px] text-accent-forest">
          {pct}% Funded
        </span>
      </div>

      {/* Progress Track */}
      <div className="w-full h-1.5 rounded-full overflow-hidden bg-[#E6E2DA]">
        <div
          className="h-full rounded-full transition-all duration-500 bg-accent-forest"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[10px] text-text-muted mt-1 font-mono-tabular">
        <span>${current} / ${goal}</span>
        <span className="group-hover:underline text-text-secondary">Community Backed</span>
      </div>
    </div>
  );
}
