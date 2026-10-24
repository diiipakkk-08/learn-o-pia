import React, { useState } from 'react';
import {
  Play,
  ArrowRight,
  BookOpen,
  Calendar,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Plus,
  Minus,
  Check,
  Sun,
  Moon
} from 'lucide-react';

export default function LandingPage({
  setCurrentView,
  onEnterApp,
  onOpenAuth,
  onBrowseCourses,
  cinemaMode = false,
  onToggleTheme
}) {
  const [activePreviewTab, setActivePreviewTab] = useState('player'); // 'player' | 'attendance' | 'vault'
  const [previewAttendance, setPreviewAttendance] = useState({ attended: 18, total: 22 });
  const [demoChecked, setDemoChecked] = useState([true, true, false, false]);

  const enterApp = () => {
    if (onEnterApp) onEnterApp();
    else if (setCurrentView) setCurrentView('my-learning');
  };

  const openAuth = () => {
    if (onOpenAuth) onOpenAuth();
    else if (setCurrentView) setCurrentView('auth');
  };

  const browseCourses = () => {
    if (onBrowseCourses) onBrowseCourses();
    else if (setCurrentView) setCurrentView('learning');
  };

  const handlePreviewPlus = () => {
    setPreviewAttendance(prev => ({ attended: prev.attended + 1, total: prev.total + 1 }));
  };

  const handlePreviewMinus = () => {
    setPreviewAttendance(prev => ({ attended: prev.attended, total: prev.total + 1 }));
  };

  const previewRatio = previewAttendance.attended / previewAttendance.total;
  const previewPct = (previewRatio * 100).toFixed(1);
  const previewCanMiss = Math.floor((previewAttendance.attended - 0.75 * previewAttendance.total) / 0.75);
  const previewNeedAttend = Math.max(1, Math.ceil((0.75 * previewAttendance.total - previewAttendance.attended) / 0.25));

  return (
    <div className="min-h-screen bg-canvas text-text-primary selection:bg-surface-hover">
      {/* 1. Minimal Editorial Navbar */}
      <header className="sticky top-0 z-40 px-4 sm:px-8 h-16 flex items-center justify-between border-b border-border-subtle bg-canvas/90 backdrop-blur-md">
        <div className="flex items-center gap-8">
          <button onClick={enterApp} className="text-left group focus:outline-none">
            <span className="font-editorial text-3xl tracking-tight block leading-none">
              Learn-O-Pia
            </span>
          </button>
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-text-secondary">
            <button onClick={browseCourses} className="hover:text-text-primary transition-colors">
              Course Library
            </button>
            <button onClick={() => setActivePreviewTab('attendance')} className="hover:text-text-primary transition-colors">
              Attendance Math
            </button>
            <button onClick={() => setActivePreviewTab('vault')} className="hover:text-text-primary transition-colors">
              Study Vault
            </button>
            <button onClick={() => { if (setCurrentView) setCurrentView('about'); }} className="hover:text-text-primary transition-colors">
              Mission & Pledge
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Light / Dark Mode Toggle on Landing Page */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover text-text-primary transition-colors flex items-center justify-center cursor-pointer shadow-xs"
              title={cinemaMode ? 'Switch to Light Mode' : 'Switch to Dim Mode'}
              aria-label="Toggle theme mode"
            >
              {cinemaMode ? <Sun size={15} className="text-[#E2A04B]" /> : <Moon size={15} className="text-text-secondary" />}
            </button>
          )}

          {/* Prominent Sign In Button */}
          <button
            onClick={openAuth}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark transition-all hover:opacity-95 active:scale-[0.98] shadow-xs cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* 2. Editorial Hero Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-8 pt-14 pb-10 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border border-border-strong bg-subtle text-text-secondary">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-forest" />
          <span>100% Free Academic Workspace • Web & Android</span>
        </div>

        <h1 className="font-editorial text-4xl sm:text-6xl lg:text-7xl leading-[1.06] tracking-tight max-w-4xl mx-auto">
          Turn chaotic YouTube playlists into a quiet, structured study desk.
        </h1>

        <p className="text-base sm:text-lg max-w-2xl mx-auto text-text-secondary leading-relaxed">
          Watch university lectures without algorithmic distraction, capture timestamped notes,
          and track your college attendance with predictive buffer math—zero fluff, zero ads.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          <button
            onClick={enterApp}
            className="px-6 py-3 rounded-lg text-sm font-semibold bg-accent-ink text-text-on-dark inline-flex items-center gap-2 shadow-sm transition-all hover:opacity-95 active:scale-[0.98]"
          >
            <span>Start Learning Now</span>
            <ArrowRight size={16} />
          </button>
          <button
            onClick={browseCourses}
            className="px-5 py-3 rounded-lg text-sm font-semibold border border-border-strong bg-surface hover:bg-surface-hover text-text-primary transition-colors"
          >
            Explore Catalog
          </button>
        </div>
      </section>

      {/* 3. Interactive Product Preview Frame */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 pb-20">
        <div className="rounded-xl border border-border-subtle bg-surface shadow-modal overflow-hidden">
          {/* Simulated Browser Chrome / Tab Switcher */}
          <div className="px-4 py-3 bg-subtle border-b border-border-subtle flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-border-strong" />
              <div className="w-3 h-3 rounded-full bg-border-strong" />
              <div className="w-3 h-3 rounded-full bg-border-strong" />
              <span className="ml-2 text-xs font-mono-tabular text-text-muted hidden sm:inline">
                https://learn-o-pia.workspace/studio
              </span>
            </div>

            {/* Interactive Mode Pills */}
            <div className="flex items-center gap-1 bg-surface-hover p-1 rounded-lg">
              <button
                onClick={() => setActivePreviewTab('player')}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  activePreviewTab === 'player'
                    ? 'bg-surface text-text-primary shadow-sm font-semibold'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Course Player
              </button>
              <button
                onClick={() => setActivePreviewTab('attendance')}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  activePreviewTab === 'attendance'
                    ? 'bg-surface text-text-primary shadow-sm font-semibold'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Smart Attendance
              </button>
              <button
                onClick={() => setActivePreviewTab('vault')}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  activePreviewTab === 'vault'
                    ? 'bg-surface text-text-primary shadow-sm font-semibold'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Resource Vault
              </button>
            </div>
          </div>

          {/* Interactive Screen 1: Course Player */}
          {activePreviewTab === 'player' && (
            <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start bg-canvas">
              <div className="lg:col-span-8 space-y-3">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-[#141413] border border-border-subtle group">
                  <img
                    src="https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=1200&q=80"
                    alt="Course Preview"
                    className="w-full h-full object-cover opacity-85"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="w-16 h-16 rounded-full bg-surface/90 text-text-primary flex items-center justify-center shadow-lg">
                      <Play size={24} fill="#141413" className="ml-1" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 px-3 py-1 rounded bg-black/75 text-white text-xs font-mono-tabular">
                    [14:22] Balanced AVL Tree Rotations
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-text-secondary pt-1">
                  <span>Data Structures & Algorithms • Lecture 4 of 24</span>
                  <span className="font-mono-tabular text-accent-forest font-semibold">65% COMPLETED</span>
                </div>
              </div>

              {/* Player Dock Preview */}
              <div className="lg:col-span-4 rounded-lg border border-border-subtle bg-surface p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-secondary font-mono-tabular">
                    Course Syllabus
                  </span>
                  <span className="text-xs font-mono-tabular text-text-muted">6/6 Modules</span>
                </div>

                <div className="space-y-2 text-xs">
                  {[
                    'Asymptotic Time & Space Complexity',
                    'Dynamic Memory & Pointer Arithmetic',
                    'Linked Lists & Double-ended Queues',
                    'Balanced Binary Search Trees & AVL',
                    'Priority Queues & Heap Sort',
                    'Graph Traversals: BFS & Dijkstra'
                  ].map((title, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        const next = [...demoChecked];
                        next[idx] = !next[idx];
                        setDemoChecked(next);
                      }}
                      className={`p-2.5 rounded border flex items-center gap-2.5 cursor-pointer transition-colors ${
                        demoChecked[idx]
                          ? 'border-border-subtle bg-[#FAF8F5] text-text-muted line-through'
                          : 'border-border-strong bg-surface text-text-primary font-medium'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                          demoChecked[idx]
                            ? 'bg-accent-forest border-accent-forest text-white'
                            : 'border-border-strong bg-surface'
                        }`}
                      >
                        {demoChecked[idx] && <Check size={11} strokeWidth={3} />}
                      </div>
                      <span className="truncate">{idx + 1}. {title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Interactive Screen 2: Attendance Math */}
          {activePreviewTab === 'attendance' && (
            <div className="p-6 sm:p-8 bg-canvas space-y-6">
              <div className="max-w-xl mx-auto rounded-xl border border-border-subtle bg-surface p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold">Interactive Attendance Sandbox</h3>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Target rule: <strong className="font-mono-tabular">75.0% Minimum</strong>
                    </p>
                  </div>
                  <span className="font-mono-tabular text-2xl font-bold">
                    {previewPct}%
                  </span>
                </div>

                {/* Status Pill */}
                <div
                  className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-between ${
                    previewRatio >= 0.75
                      ? 'bg-accent-forest-bg border-[#C2DEC9] text-accent-forest'
                      : 'bg-accent-amber-bg border-[#F5DCB7] text-accent-amber'
                  }`}
                >
                  <span>
                    {previewRatio >= 0.75
                      ? `SAFE ZONE: You can safely miss ${previewCanMiss} classes.`
                      : `ATTENDANCE SHORTAGE: Must attend next ${previewNeedAttend} in a row.`}
                  </span>
                  <span className="font-mono-tabular font-bold">
                    {previewAttendance.attended} / {previewAttendance.total}
                  </span>
                </div>

                {/* Tactile Adjusters */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handlePreviewPlus}
                    className="flex-1 py-2.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    <Plus size={14} />
                    <span>Mark Present (+1)</span>
                  </button>
                  <button
                    onClick={handlePreviewMinus}
                    className="flex-1 py-2.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    <Minus size={14} />
                    <span>Mark Absent (Skip)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Screen 3: Resource Vault */}
          {activePreviewTab === 'vault' && (
            <div className="p-6 sm:p-8 bg-canvas">
              <div className="rounded-xl border border-border-subtle bg-surface overflow-hidden">
                <div className="px-4 py-3 border-b border-border-subtle bg-[#FAF8F5] flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-secondary font-mono-tabular">
                    Semester V Academic Vault
                  </span>
                  <span className="text-xs text-text-muted font-mono-tabular">6 Documents Available</span>
                </div>
                <div className="divide-y divide-border-subtle text-xs">
                  {[
                    { name: 'Data Structures Complete Algorithm Cheat Sheet', type: 'PDF', size: '2.4 MB', author: 'Prof. Bari' },
                    { name: 'DBMS Relational Algebra & Normalization Solved PYQ', type: 'PDF', size: '1.8 MB', author: 'CMU Circle' },
                    { name: 'Operating Systems Deadlock Banker Algorithm Notes', type: 'DOC', size: '4.1 MB', author: 'Neso Academy' },
                    { name: 'Computer Networks TCP/IP Subnetting Reference Card', type: 'MD', size: '640 KB', author: 'Student Circle' },
                  ].map((res, i) => (
                    <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-surface-hover">
                      <div className="flex items-center gap-3">
                        <span className="font-mono-tabular px-1.5 py-0.5 rounded text-[10px] font-bold border border-border-strong bg-subtle">
                          {res.type}
                        </span>
                        <div>
                          <div className="font-semibold text-text-primary">{res.name}</div>
                          <div className="text-[11px] text-text-muted">{res.author} • {res.size}</div>
                        </div>
                      </div>
                      <button
                        onClick={enterApp}
                        className="px-3 py-1.5 rounded border border-border-subtle bg-surface hover:bg-surface-hover font-semibold text-xs"
                      >
                        Open Vault
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. Three-Pillar Bento Grid */}
      <section className="max-w-5xl mx-auto px-4 sm:px-8 pb-24 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="font-editorial text-3xl sm:text-4xl">
            Engineered for high-focus university study.
          </h2>
          <p className="text-sm text-text-secondary max-w-lg mx-auto">
            Traditional social media destroys concentration. Learn-O-Pia strips away recommendation algorithms.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl border border-border-subtle bg-surface space-y-3">
            <div className="w-10 h-10 rounded-lg bg-subtle flex items-center justify-center text-text-primary">
              <Play size={18} />
            </div>
            <h3 className="text-base font-bold">Distraction-Free Video IDE</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              No recommended clickbait sidebars, no distracting comments. Just structured playlists with syllabus progress tracking and auto-timestamped notes.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border-subtle bg-surface space-y-3">
            <div className="w-10 h-10 rounded-lg bg-subtle flex items-center justify-center text-accent-forest">
              <Calendar size={18} />
            </div>
            <h3 className="text-base font-bold">Predictive Attendance Ledger</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Calculates exactly how many classes you can afford to skip without dropping below your college requirement, or how many consecutive classes you must attend to recover.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border-subtle bg-surface space-y-3">
            <div className="w-10 h-10 rounded-lg bg-subtle flex items-center justify-center text-text-primary">
              <ShieldCheck size={18} />
            </div>
            <h3 className="text-base font-bold">Community-Backed & Free</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              No paywalls or predatory subscriptions. Maintained collaboratively by students and supported transparently by optional community pledges and sponsorships.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Minimal Footer */}
      <footer className="border-t border-border-subtle py-8 px-4 text-center text-xs text-text-muted space-y-2">
        <div className="font-editorial text-xl text-text-primary">Learn-O-Pia</div>
        <p>A quiet, distraction-free study studio for college students worldwide.</p>
        <p className="font-mono-tabular text-[11px] text-[#A8A59E]">
          Free and Open Platform • Built with Craft
        </p>
      </footer>
    </div>
  );
}
