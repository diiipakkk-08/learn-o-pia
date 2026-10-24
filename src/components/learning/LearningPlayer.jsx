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
  Plus,
  ChevronDown,
  ChevronUp,
  Heart
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

  const [showDetails, setShowDetails] = useState(false);
  const [videoLikes, setVideoLikes] = useState(() => {
    try {
      const saved = localStorage.getItem('learnopia_video_likes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const isVideoLiked = !!videoLikes[currentVideo.id || currentVideo.youtubeId || currentIndex];
  const baseVideoLikes = 45 + ((currentIndex * 7) % 30);
  const videoLikesCount = baseVideoLikes + (isVideoLiked ? 1 : 0);

  const toggleVideoLike = () => {
    const key = currentVideo.id || currentVideo.youtubeId || currentIndex;
    setVideoLikes((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('learnopia_video_likes', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const youtubeVideoUrl = currentVideo.youtubeId
    ? `https://www.youtube.com/watch?v=${currentVideo.youtubeId}`
    : null;

  const handleShare = () => {
    const linkToCopy = youtubeVideoUrl || window.location.href;
    navigator.clipboard.writeText(linkToCopy);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
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
      <main className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4 pb-12 space-y-4">
        {/* Responsive Player Grid: Left Video Player directly at top / Right Study Dock */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* =================================================================
              LEFT COLUMN: 16:9 Video Player (Directly at top, zero distractions above)
          ================================================================= */}
          <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-9 space-y-4">
            {/* 16:9 Video Frame (Right at Top) */}
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

            {/* YouTube-Style Below-Video Title & Actions Bar */}
            <div className="space-y-3">
              {/* Lecture Title */}
              <div>
                <span className="text-[11px] font-mono-tabular font-bold text-accent-forest uppercase tracking-wider">
                  LECTURE {currentIndex + 1} OF {videos.length} • {foundSubject ? foundSubject.title : playlist.title}
                </span>
                <h1 className="text-base sm:text-lg lg:text-xl font-bold text-text-primary leading-snug mt-1">
                  {currentVideo.title}
                </h1>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-border-subtle">
                {/* Left Action Buttons: Back, YouTube, Share, Like */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setCurrentView('learning')}
                    className="px-2.5 py-1.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer text-text-secondary hover:text-text-primary"
                    title="Back to Catalog"
                  >
                    <ArrowLeft size={13} />
                    <span className="hidden sm:inline">Catalog</span>
                  </button>

                  {youtubeVideoUrl && (
                    <a
                      href={youtubeVideoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover text-xs font-semibold flex items-center gap-1.5 text-red-600 hover:text-red-500 transition-colors shadow-xs"
                      title="Watch lecture directly on YouTube"
                    >
                      <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      <span className="font-mono-tabular">YouTube</span>
                    </a>
                  )}

                  <button
                    onClick={handleShare}
                    className="px-3 py-1.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs text-text-primary"
                    title="Copy direct YouTube video link"
                  >
                    {copiedLink ? <Check size={13} className="text-accent-forest" /> : <Share2 size={13} />}
                    <span className="font-mono-tabular">{copiedLink ? 'Copied!' : 'Share'}</span>
                  </button>

                  <button
                    onClick={toggleVideoLike}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                      isVideoLiked
                        ? 'border-red-500/30 bg-red-500/10 text-red-500'
                        : 'border-border-subtle bg-surface hover:bg-surface-hover text-text-secondary hover:text-red-500'
                    }`}
                    title={isVideoLiked ? 'Liked' : 'Like lecture'}
                  >
                    <Heart size={13} fill={isVideoLiked ? 'currentColor' : 'none'} />
                    <span className="font-mono-tabular">{videoLikesCount}</span>
                  </button>
                </div>

                {/* Right: Prev & Next Lecture Navigation */}
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentIndex === 0}
                    onClick={() => updateIndex(currentIndex - 1)}
                    className="px-3 py-1.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                    <span>Previous</span>
                  </button>
                  <button
                    disabled={currentIndex >= videos.length - 1}
                    onClick={() => updateIndex(currentIndex + 1)}
                    className="px-3.5 py-1.5 rounded-lg bg-accent-ink text-text-on-dark hover:opacity-95 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <span>Next Lecture</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* YouTube-Style Compact Collapsible Description Box */}
              <div className="rounded-xl border border-border-subtle bg-surface/80 p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-text-muted font-mono-tabular text-[11px]">
                  <span>{playlist.author || 'University Faculty'} • {videos.length} Lectures in Series</span>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="flex items-center gap-1 font-semibold text-text-primary hover:text-accent-forest transition-colors cursor-pointer"
                  >
                    <span>{showDetails ? 'Show less' : 'More details'}</span>
                    {showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                </div>

                <p className={`text-text-secondary leading-relaxed ${showDetails ? '' : 'line-clamp-2'}`}>
                  {playlist.description || `University curriculum lecture ${currentIndex + 1} for ${foundSubject ? foundSubject.title : playlist.title}.`}
                </p>

                {showDetails && (
                  <div className="pt-2 border-t border-border-subtle mt-2 space-y-2 text-text-secondary">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono-tabular">
                      <div><strong className="text-text-primary">Subject:</strong> {foundSubject?.title || playlist.title}</div>
                      <div><strong className="text-text-primary">Department:</strong> {foundSubject?.semester ? `Semester ${foundSubject.semester}` : 'Academic Track'}</div>
                      <div><strong className="text-text-primary">Video ID:</strong> {currentVideo.youtubeId || 'Standard Stream'}</div>
                      <div><strong className="text-text-primary">Total Lectures:</strong> {videos.length}</div>
                    </div>
                  </div>
                )}
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
            <div className="flex border-b border-border-subtle bg-surface-hover/50">
              <button
                onClick={() => setActiveRightTab('syllabus')}
                className={`flex-1 py-3 text-xs font-semibold text-center transition-colors border-b-2 cursor-pointer ${
                  activeRightTab === 'syllabus'
                    ? 'border-accent-ink text-text-primary bg-surface'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                Syllabus ({videos.length})
              </button>
              <button
                onClick={() => setActiveRightTab('notes')}
                className={`flex-1 py-3 text-xs font-semibold text-center transition-colors border-b-2 cursor-pointer ${
                  activeRightTab === 'notes'
                    ? 'border-accent-ink text-text-primary bg-surface'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                Notes ({notesList.length})
              </button>
              <button
                onClick={() => setActiveRightTab('resources')}
                className={`flex-1 py-3 text-xs font-semibold text-center transition-colors border-b-2 cursor-pointer ${
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
                          ? 'bg-surface-hover border-l-4 border-l-accent-forest'
                          : 'hover:bg-surface-hover/60'
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
                          className="px-2.5 py-1 rounded border border-border-subtle bg-surface hover:bg-surface-hover text-xs font-semibold text-accent-forest shrink-0 flex items-center gap-1 transition-colors"
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
                      className="px-3 py-1.5 rounded border border-border-subtle bg-surface hover:bg-surface-hover font-semibold text-xs text-text-primary cursor-pointer transition-colors"
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
