import React from 'react';

/**
 * Washi Tape Strip
 * Translucent textured tape used to "tape" notes to desk or paper.
 */
export function WashiTape({ className = '', style = {}, color = 'rgba(235, 222, 190, 0.75)' }) {
  return (
    <div
      className={`absolute h-4 w-20 z-20 pointer-events-none select-none shadow-xs ${className}`}
      style={{
        background: color,
        backdropFilter: 'blur(2px)',
        borderLeft: '1px dashed rgba(0,0,0,0.15)',
        borderRight: '1px dashed rgba(0,0,0,0.15)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        ...style
      }}
    />
  );
}

/**
 * Academic Badge / Sticker
 * Tactile stamp badges resembling student stickers, notebook stamps, and campus seals.
 */
export function AcademicSticker({ type = 'verified', label, className = '', style = {} }) {
  if (type === 'verified') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-mono-tabular font-bold uppercase tracking-wider select-none shadow-xs transform hover:scale-105 transition-transform ${className}`}
        style={{
          background: '#FEF3C7',
          color: '#92400E',
          border: '1.5px dashed #D97706',
          boxShadow: '0 2px 6px rgba(180, 83, 9, 0.15)',
          ...style
        }}
      >
        <span>★</span>
        <span>{label || 'CAMPUS VERIFIED'}</span>
      </div>
    );
  }

  if (type === 'focus') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-mono-tabular font-bold uppercase tracking-wider select-none shadow-xs transform hover:scale-105 transition-transform ${className}`}
        style={{
          background: '#DCFCE7',
          color: '#166534',
          border: '1.5px solid #22C55E',
          boxShadow: '0 2px 6px rgba(22, 101, 52, 0.15)',
          ...style
        }}
      >
        <span>⚡</span>
        <span>{label || 'FOCUS MODE ACTIVE'}</span>
      </div>
    );
  }

  if (type === 'attendance') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-mono-tabular font-bold uppercase tracking-wider select-none shadow-xs transform hover:scale-105 transition-transform ${className}`}
        style={{
          background: '#E0E7FF',
          color: '#3730A3',
          border: '1.5px solid #6366F1',
          boxShadow: '0 2px 6px rgba(55, 48, 163, 0.15)',
          ...style
        }}
      >
        <span>✓</span>
        <span>{label || '75% ATTENDANCE SAFE'}</span>
      </div>
    );
  }

  if (type === 'stamp') {
    return (
      <div
        className={`inline-flex flex-col items-center justify-center p-2 rounded-xl text-center select-none shadow-xs ${className}`}
        style={{
          border: '2px dashed #B45309',
          color: '#B45309',
          background: 'rgba(254, 243, 199, 0.4)',
          transform: 'rotate(-4deg)',
          ...style
        }}
      >
        <div className="text-[9px] font-mono-tabular font-bold tracking-widest uppercase">MAKAUT • WBUT</div>
        <div className="text-xs font-black tracking-tight font-editorial">OFFICIAL STUDY NOTE</div>
        <div className="text-[8px] font-mono-tabular text-amber-800/80">BATCH 2026</div>
      </div>
    );
  }

  return null;
}

/**
 * Sticky Note Component
 * Colored memo note taped with washi tape at an angle.
 */
export function StickyNote({
  children,
  color = '#FEF9C3', // soft yellow
  tapeColor = 'rgba(235, 222, 190, 0.8)',
  rotate = -2,
  className = '',
  style = {}
}) {
  return (
    <div
      className={`relative p-4 sm:p-5 text-[#2C261E] rounded-xs select-none shadow-md ${className}`}
      style={{
        backgroundColor: color,
        transform: `rotate(${rotate}deg)`,
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.12), 0 8px 10px -6px rgba(0,0,0,0.08)',
        borderBottomRightRadius: '12px',
        ...style
      }}
    >
      <WashiTape
        color={tapeColor}
        className="-top-2 left-1/2 -translate-x-1/2"
        style={{ transform: `rotate(${-rotate * 0.8}deg)` }}
      />
      {children}
    </div>
  );
}

/**
 * Spiral Notebook Sheet
 * Creamy spiral notebook page with punch holes, metal rings, ruled lines, and red margin.
 */
export function SpiralNotebookSheet({
  children,
  className = '',
  style = {},
  showHoles = true,
  holeCount = 14,
  ruled = true,
  hasRedMargin = true
}) {
  const holes = Array.from({ length: holeCount });

  return (
    <div
      className={`relative bg-[#FAF7F0] text-[#2C261E] rounded-r-2xl overflow-hidden shadow-2xl ${className}`}
      style={{
        backgroundColor: '#FAF7F0',
        backgroundImage: ruled
          ? 'repeating-linear-gradient(to bottom, transparent, transparent 31px, rgba(175, 190, 205, 0.3) 32px)'
          : 'none',
        boxShadow: '0 25px 50px -12px rgba(44, 38, 28, 0.25), 0 0 0 1px rgba(60, 50, 35, 0.08)',
        ...style
      }}
    >
      {/* Left Perforated Spiral Spine */}
      {showHoles && (
        <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-14 bg-[#F2EDE2] border-r border-[#E0D8C8] flex flex-col justify-between py-6 px-2.5 z-10 select-none pointer-events-none">
          {/* Perforated tear line */}
          <div className="absolute right-0 top-0 bottom-0 w-[1px] border-r border-dashed border-[#B8AE9C]/60" />

          {holes.map((_, i) => (
            <div key={i} className="relative flex items-center justify-center my-auto">
              {/* Dark punched cutout hole */}
              <div
                className="w-3 sm:w-3.5 h-3 sm:h-3.5 rounded-full bg-[#332D26] shadow-inner"
                style={{
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.7), 0 1px 1px rgba(255,255,255,0.4)'
                }}
              />
              {/* Metallic Ring Loop Wire */}
              <div
                className="absolute -left-3 sm:-left-3.5 w-6 sm:w-7 h-3 rounded-full pointer-events-none"
                style={{
                  border: '2.5px solid #8A8275',
                  borderTopColor: '#C2BBB0',
                  borderBottomColor: '#5C5549',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Vertical Red Margin Rule */}
      {hasRedMargin && showHoles && (
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-red-400/40 pointer-events-none z-10"
          style={{ left: 'clamp(52px, 12%, 68px)' }}
        />
      )}

      {/* Main Page Content */}
      <div className={`relative z-10 h-full ${showHoles ? 'pl-16 sm:pl-20 pr-6 sm:pr-8 py-8' : 'p-6 sm:p-8'}`}>
        {children}
      </div>
    </div>
  );
}

/**
 * Legal Pad Sheet
 * Top-perforated yellow lined notepad with red header rule.
 */
export function LegalPadSheet({
  children,
  className = '',
  style = {},
  color = '#FFFDF0'
}) {
  return (
    <div
      className={`relative text-[#2C261E] rounded-b-xl overflow-hidden shadow-xl ${className}`}
      style={{
        backgroundColor: color,
        backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 27px, rgba(160, 180, 210, 0.3) 28px)',
        boxShadow: '0 20px 35px -10px rgba(44, 38, 28, 0.18), 0 0 0 1px rgba(60, 50, 35, 0.08)',
        ...style
      }}
    >
      {/* Top Header Binding Bar (Brown/Burgundy with punch holes) */}
      <div className="h-9 bg-[#78350F] text-[#FEF3C7] flex items-center justify-between px-4 text-[10px] font-mono-tabular font-bold tracking-widest uppercase border-b-2 border-red-500/50 select-none">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-black/40 border border-white/20" />
          <div className="w-2.5 h-2.5 rounded-full bg-black/40 border border-white/20" />
        </div>
        <span>LEGAL NOTEPAD • SEMESTER FORMULARY</span>
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-black/40 border border-white/20" />
          <div className="w-2.5 h-2.5 rounded-full bg-black/40 border border-white/20" />
        </div>
      </div>

      {/* Double Red Header Line */}
      <div className="h-[2px] bg-red-400/50 mb-1" />
      <div className="h-[1px] bg-red-400/30 mb-4" />

      {/* Content */}
      <div className="p-5 sm:p-7 relative z-10">
        {children}
      </div>
    </div>
  );
}

/**
 * Grid Graph Paper Sheet
 * Grid math / technical notes sheet with holes on the left.
 */
export function GridPaperSheet({
  children,
  className = '',
  style = {}
}) {
  return (
    <div
      className={`relative bg-[#FBF9F2] text-[#2C261E] rounded-xl overflow-hidden shadow-xl ${className}`}
      style={{
        backgroundColor: '#FBF9F2',
        backgroundImage: `
          linear-gradient(to right, rgba(180, 170, 150, 0.25) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(180, 170, 150, 0.25) 1px, transparent 1px)
        `,
        backgroundSize: '18px 18px',
        boxShadow: '0 20px 35px -10px rgba(44, 38, 28, 0.18), 0 0 0 1px rgba(60, 50, 35, 0.08)',
        ...style
      }}
    >
      {/* Top Tape */}
      <WashiTape className="-top-2 left-8" />
      <div className="p-6 relative z-10">
        {children}
      </div>
    </div>
  );
}
