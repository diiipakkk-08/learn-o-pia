import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import {
  Play,
  Check,
  ArrowLeft,
  Sun,
  Moon,
  FileText,
  Clock,
  Download,
  Share2,
  Bookmark,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles,
  ChevronLeft,
  Copy,
  Plus
} from 'lucide-react';

export default function LearningPlayer({
  playlistId,
  activeVideoIndex = 0,
  setActiveVideoIndex,
  setCurrentView,
  cinemaMode = false,
  setCinemaMode,
  isSidebarCollapsed = false
}) {
  const {
    subjects,
    courses,
    updateLastPlayed,
    currentUser,
    savedResourceIds,
    toggleSaveResource
  } = useDatabase();

  const [activeRightTab, setActiveRightTab] = useState('syllabus'); // 'syllabus' | 'notes' | 'resources'
  const [internalVideoIndex, setInternalVideoIndex] = useState(activeVideoIndex || 0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [notesList, setNotesList] = useState(() => {
    try {
      const saved = localStorage.getItem(`learnopia_notes_${playlistId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [newNoteText, setNewNoteText] = useState('');

  const currentIndex = setActiveVideoIndex !== undefined ? activeVideoIndex : internalVideoIndex;
  const updateIndex = (idx) => {
    if (setActiveVideoIndex) setActiveVideoIndex(idx);
    setInternalVideoIndex(idx);
  };

  // Locate the playlist and subject
  const { foundPlaylist, foundSubject, foundCourse } = useMemo(() => {
    let p = null;
    let s = null;
    let c = null;

    if (playlistId) {
      // 1. Direct playlist ID match
      for (const sub of (subjects || [])) {
        const match = (sub.playlists || []).find((pl) => pl.id === playlistId);
        if (match) {
          p = match;
          s = sub;
          break;
        }
      }

      // 2. Direct subject ID match
      if (!p) {
        const matchSub = (subjects || []).find((sub) => sub.id === playlistId);
        if (matchSub && matchSub.playlists && matchSub.playlists.length > 0) {
          p = matchSub.playlists[0];
          s = matchSub;
        }
      }

      // 3. Course ID match
      if (!p) {
        c = (courses || []).find((cr) => cr.id === playlistId);
        if (c) {
          const courseSub = (subjects || []).find((sub) => sub.courseId === c.id);
          if (courseSub && courseSub.playlists && courseSub.playlists.length > 0) {
            p = courseSub.playlists[0];
            s = courseSub;
          }
        }
      }
    }

    if (!p) {
      // Default to first playlist in first subject
      const firstSub = (subjects || [])[0];
      if (firstSub && firstSub.playlists && firstSub.playlists.length > 0) {
        p = firstSub.playlists[0];
        s = firstSub;
      }
    }

    return { foundPlaylist: p, foundSubject: s, foundCourse: c };
  }, [playlistId, subjects, courses]);

  const playlist = foundPlaylist || {
    id: playlistId || 'pl-default',
    title: 'University Lecture Series',
    author: 'Course Instructor',
    videos: [
      { id: 'v1', title: 'Lecture 1: Introduction & Fundamentals', youtubeId: '0IAPZzGSbME' },
      { id: 'v2', title: 'Lecture 2: Core Architecture & Setup', youtubeId: 'vBURTt97EkA' },
      { id: 'v3', title: 'Lecture 3: Advanced Principles & Applications', youtubeId: 'oeYBdghaIjc' }
    ]
  };

  const videos = playlist.videos && playlist.videos.length > 0 ? playlist.videos : [
    { id: 'v1', title: 'Lecture 1: Course Overview', youtubeId: '0IAPZzGSbME' }
  ];

  const currentVideo = videos[currentIndex] || videos[0];

  // Sync lastPlayed to DB/context
  useEffect(() => {
    if (playlist && currentVideo && updateLastPlayed) {
      updateLastPlayed({
        playlistId: playlist.id,
        playlistTitle: playlist.title,
        videoIndex: currentIndex,
        videoTitle: currentVideo.title,
        youtubeId: currentVideo.youtubeId,
        thumbnail: `https://i.ytimg.com/vi/${currentVideo.youtubeId}/hqdefault.jpg`,
        progress: Math.round(((currentIndex + 1) / videos.length) * 100)
      });
    }
  }, [playlist.id, currentVideo.youtubeId, currentIndex]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const note = {
      id: Date.now(),
      text: newNoteText.trim(),
      videoTitle: currentVideo.title,
      timestamp: 'Today'
    };

    const updated = [note, ...notesList];
    setNotesList(updated);
    try {
      localStorage.setItem(`learnopia_notes_${playlistId}`, JSON.stringify(updated));
    } catch {}
    setNewNoteText('');
  };

  return (
    <div
      className="min-h-screen transition-colors duration-200"
      data-theme={cinemaMode ? 'cinema' : 'default'}
      style={{
        backgroundColor: cinemaMode ? '#141413' : '#F7F5F0',
        color: cinemaMode ? '#F2EFE9' : '#141413'
      }}
    >
      <main className="w-full px-3 sm:px-6 lg:px-8 xl:px-10 pt-3 pb-12 space-y-4">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setCurrentView('learning')}
              className="p-1.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover text-xs font-semibold flex items-center gap-1.5 shrink-0"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Back to Catalog</span>
            </button>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold truncate">
                {playlist.title}
              </h2>
              <p className="text-xs text-text-muted truncate">
                {foundSubject ? foundSubject.title : playlist.author} • Lecture {currentIndex + 1} of {videos.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {setCinemaMode && (
              <button
                onClick={() => setCinemaMode(!cinemaMode)}
                className="p-2 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover text-xs font-semibold flex items-center gap-1.5"
                title={cinemaMode ? 'Turn lights on' : 'Dim lights (Cinema mode)'}
              >
                {cinemaMode ? <Sun size={14} className="text-[#E2A04B]" /> : <Moon size={14} />}
                <span className="hidden md:inline">{cinemaMode ? 'Lights On' : 'Dim Lights'}</span>
              </button>
            )}

            <button
              onClick={handleShare}
              className="p-2 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover text-xs font-semibold flex items-center gap-1.5"
              title="Share Course Link"
            >
              <Share2 size={14} />
              <span className="hidden sm:inline">{copiedLink ? 'Copied!' : 'Share'}</span>
            </button>
          </div>
        </div>

        {/* Responsive Player Grid: Left Video IDE (takes full space) / Right Study Dock */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* =================================================================
              LEFT COLUMN: 16:9 Video Player (expanded for full space)
          ================================================================= */}
          <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-9 space-y-4">
            {/* 16:9 Frame */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-border-subtle shadow-md">
              {currentVideo.youtubeId ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${currentVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                  title={currentVideo.title}
                  className="w-full h-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">
                  Video source unavailable.
                </div>
              )}
            </div>

            {/* Lecture Header + Next / Previous Navigation */}
            <div className="p-4 rounded-xl border border-border-subtle bg-surface space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[11px] font-mono-tabular font-semibold text-accent-forest uppercase">
                    LECTURE {currentIndex + 1} OF {videos.length}
                  </span>
                  <h1 className="text-lg font-bold text-text-primary leading-snug mt-0.5">
                    {currentVideo.title}
                  </h1>
                </div>

                {/* Player Next & Prev Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    disabled={currentIndex === 0}
                    onClick={() => updateIndex(currentIndex - 1)}
                    className="p-2 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1"
                  >
                    <ChevronLeft size={14} />
                    <span>Previous</span>
                  </button>
                  <button
                    disabled={currentIndex >= videos.length - 1}
                    onClick={() => updateIndex(currentIndex + 1)}
                    className="px-3 py-2 rounded-lg bg-accent-ink text-text-on-dark hover:opacity-95 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1"
                  >
                    <span>Next Lecture</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* In-Lecture Quick Note Input */}
            <div className="p-4 rounded-xl border border-border-subtle bg-surface space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary font-mono-tabular">
                Capture Lecture Note
              </h3>
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type an insight or formula from this lecture and press Enter..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-lg border border-border-strong text-xs sm:text-sm bg-canvas focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark hover:opacity-95"
                >
                  Save Note
                </button>
              </form>
            </div>
          </div>

          {/* =================================================================
              RIGHT COLUMN: Tabbed Study Dock (Syllabus, Notes, Materials)
          ================================================================= */}
          <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-3 rounded-xl border border-border-subtle bg-surface overflow-hidden shadow-sm">
            {/* Dock Tabs Header */}
            <div className="flex border-b border-border-subtle bg-[#FAF8F5]">
              <button
                onClick={() => setActiveRightTab('syllabus')}
                className={`flex-1 py-3 text-xs font-semibold text-center transition-colors border-b-2 ${
                  activeRightTab === 'syllabus'
                    ? 'border-accent-ink text-text-primary bg-surface'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                Syllabus ({videos.length})
              </button>
              <button
                onClick={() => setActiveRightTab('notes')}
                className={`flex-1 py-3 text-xs font-semibold text-center transition-colors border-b-2 ${
                  activeRightTab === 'notes'
                    ? 'border-accent-ink text-text-primary bg-surface'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                Notes ({notesList.length})
              </button>
              <button
                onClick={() => setActiveRightTab('resources')}
                className={`flex-1 py-3 text-xs font-semibold text-center transition-colors border-b-2 ${
                  activeRightTab === 'resources'
                    ? 'border-accent-ink text-text-primary bg-surface'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                Materials
              </button>
            </div>

            {/* TAB 1: SYLLABUS LECTURE CHECKLIST */}
            {activeRightTab === 'syllabus' && (
              <div className="max-h-[560px] overflow-y-auto divide-y divide-border-subtle">
                {videos.map((vid, idx) => {
                  const isCurrent = idx === currentIndex;
                  return (
                    <div
                      key={vid.id || idx}
                      onClick={() => updateIndex(idx)}
                      className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                        isCurrent
                          ? 'bg-[#FAF8F5] border-l-4 border-l-accent-forest'
                          : 'hover:bg-surface-hover'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 text-xs font-mono-tabular font-bold border ${
                          isCurrent
                            ? 'bg-accent-forest text-white border-accent-forest'
                            : 'bg-canvas text-text-muted border-border-strong'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className={`text-xs leading-snug truncate ${
                            isCurrent ? 'font-bold text-text-primary' : 'font-medium text-text-secondary'
                          }`}
                        >
                          {vid.title}
                        </div>
                        <div className="text-[10px] text-text-muted font-mono-tabular mt-0.5">
                          {isCurrent ? 'NOW PLAYING' : 'LECTURE'}
                        </div>
                      </div>
                      {isCurrent && (
                        <Play size={12} fill="#1E5631" className="text-accent-forest shrink-0 mt-1" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 2: LECTURE NOTES LIST */}
            {activeRightTab === 'notes' && (
              <div className="p-4 max-h-[560px] overflow-y-auto space-y-3">
                {notesList.length > 0 ? (
                  notesList.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 rounded-lg border border-border-subtle bg-canvas space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] text-text-muted font-mono-tabular">
                        <span>{note.videoTitle || 'Lecture'}</span>
                        <span>{note.timestamp}</span>
                      </div>
                      <p className="text-xs text-text-primary leading-relaxed font-medium">
                        {note.text}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-xs text-text-muted space-y-1">
                    <p>No notes saved for this course yet.</p>
                    <p className="text-[11px]">Use the input below the video to type your study notes.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: SUBJECT ATTACHED MATERIALS */}
            {activeRightTab === 'resources' && (
              <div className="p-4 max-h-[560px] overflow-y-auto space-y-3">
                {foundSubject && foundSubject.materials && foundSubject.materials.length > 0 ? (
                  foundSubject.materials.map((mat) => (
                    <div
                      key={mat.id}
                      className="p-3 rounded-lg border border-border-subtle bg-canvas flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-text-primary truncate">
                          {mat.title}
                        </div>
                        <div className="text-[11px] text-text-muted font-mono-tabular">
                          {mat.type?.toUpperCase() || 'PDF'} • {mat.section || 'General'}
                        </div>
                      </div>
                      {mat.url && (
                        <a
                          href={mat.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded border border-border-subtle bg-surface hover:bg-[#EFECE6] text-xs font-semibold text-accent-forest shrink-0 flex items-center gap-1"
                        >
                          <Download size={12} />
                          <span>View</span>
                        </a>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-xs text-text-muted space-y-2">
                    <FileText size={24} className="text-text-muted mx-auto" />
                    <p>No course documents attached to this playlist.</p>
                    <button
                      onClick={() => setCurrentView('resources')}
                      className="px-3 py-1.5 rounded border border-border-subtle bg-surface hover:bg-[#EFECE6] font-semibold text-xs text-text-primary"
                    >
                      Browse Academic Vault &rarr;
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
