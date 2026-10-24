/**
 * LearningPlayer.jsx
 * Distraction-free, top-aligned video lecture player with unified controls, syllabus drawer, and study dock.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import {
  Play,
  Check,
  ArrowLeft,
  FileText,
  Download,
  Share2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function LearningPlayer({
  playlistId,
  activeVideoIndex = 0,
  setActiveVideoIndex,
  setCurrentView,
  cinemaMode = false
}) {
  const {
    subjects,
    courses,
    updateLastPlayed
  } = useDatabase();

  const [activeRightTab, setActiveRightTab] = useState('syllabus'); // 'syllabus' | 'resources'
  const [internalVideoIndex, setInternalVideoIndex] = useState(activeVideoIndex || 0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const currentIndex = setActiveVideoIndex !== undefined ? activeVideoIndex : internalVideoIndex;
  const updateIndex = (idx) => {
    if (setActiveVideoIndex) setActiveVideoIndex(idx);
    else setInternalVideoIndex(idx);
  };

  // Find playlist and subject metadata
  const { foundPlaylist, foundSubject } = useMemo(() => {
    let p = null;
    let s = null;

    if (playlistId) {
      // 1. Check in subjects playlists
      (subjects || []).forEach((sub) => {
        const match = (sub.playlists || []).find((pl) => pl.id === playlistId);
        if (match) {
          p = match;
          s = sub;
        }
      });

      // 2. Check if playlistId is a standalone course
      if (!p) {
        const directCourse = (courses || []).find((cr) => cr.id === playlistId);
        if (directCourse) {
          p = {
            id: directCourse.id,
            title: directCourse.title,
            description: directCourse.description,
            author: directCourse.creatorName || 'Instructor',
            videos: [
              { id: 'v1', title: `${directCourse.title}: Complete Masterclass`, youtubeId: '0IAPZzGSbME' },
              { id: 'v2', title: `${directCourse.title}: Hands-on Project Implementation`, youtubeId: 'vBURTt97EkA' },
              { id: 'v3', title: `${directCourse.title}: Architectural Deep Dive`, youtubeId: 'oeYBdghaIjc' }
            ]
          };
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

    return { foundPlaylist: p, foundSubject: s };
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

  const youtubeVideoUrl = currentVideo.youtubeId
    ? `https://www.youtube.com/watch?v=${currentVideo.youtubeId}`
    : null;

  const handleShare = () => {
    const linkToCopy = youtubeVideoUrl || window.location.href;
    navigator.clipboard.writeText(linkToCopy);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
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
      <main className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4 pb-12 space-y-4 animate-fade-in">
        {/* Responsive Player Grid: Left Video Player directly at top / Right Study Dock */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* =================================================================
              LEFT COLUMN: 16:9 Video Player directly at top
          ================================================================= */}
          <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-9 space-y-3 flex flex-col">
            {/* 16:9 Video Frame (Right at Top, zero distractions) */}
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

            {/* UNIFIED SINGLE ACTION & DETAILS BOX DIRECTLY BELOW VIDEO */}
            <div className="rounded-xl border border-border-subtle bg-surface p-4 space-y-3 shadow-xs">
              {/* Line 1: Lecture Breadcrumb & Prev/Next Navigation */}
              <div className="flex items-center justify-between gap-2 border-b border-border-subtle pb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[11px] font-mono-tabular font-bold text-accent-forest uppercase tracking-wider truncate">
                    LECTURE {currentIndex + 1} OF {videos.length} • {foundSubject ? foundSubject.title : playlist.title}
                  </span>
                </div>

                {/* Prev & Next Controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    disabled={currentIndex === 0}
                    onClick={() => updateIndex(currentIndex - 1)}
                    className="px-2.5 py-1 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Previous Lecture"
                  >
                    <ChevronLeft size={13} />
                    <span className="hidden sm:inline">Prev</span>
                  </button>
                  <button
                    disabled={currentIndex >= videos.length - 1}
                    onClick={() => updateIndex(currentIndex + 1)}
                    className="px-3 py-1 rounded-lg bg-accent-ink text-text-on-dark hover:opacity-95 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-xs transition-opacity"
                    title="Next Lecture"
                  >
                    <span>Next</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>

              {/* Line 2: Prominent Lecture Title */}
              <h1 className="text-base sm:text-lg lg:text-xl font-bold text-text-primary leading-snug">
                {currentVideo.title}
              </h1>

              {/* Line 3: Actions Row: Catalog, YouTube, Share, More Details Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border-subtle">
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
                      className="px-2.5 py-1.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover text-xs font-semibold flex items-center gap-1.5 text-red-600 hover:text-red-500 transition-colors shadow-xs"
                      title="Watch on YouTube"
                    >
                      <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      <span className="font-mono-tabular">YouTube</span>
                    </a>
                  )}

                  <button
                    onClick={handleShare}
                    className="px-2.5 py-1.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs text-text-primary"
                    title="Copy direct video link"
                  >
                    {copiedLink ? <Check size={13} className="text-accent-forest" /> : <Share2 size={13} />}
                    <span className="font-mono-tabular">{copiedLink ? 'Copied!' : 'Share'}</span>
                  </button>
                </div>

                {/* Collapsible Details Toggle */}
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs font-semibold text-text-secondary hover:text-text-primary flex items-center gap-1 cursor-pointer transition-colors py-1"
                >
                  <span>{showDetails ? 'Hide details' : 'More details'}</span>
                  {showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              </div>

              {/* Expandable Details Content */}
              {showDetails && (
                <div className="pt-2 border-t border-border-subtle space-y-2 text-xs text-text-secondary animate-fade-in">
                  <p className="leading-relaxed">
                    {playlist.description || `Lecture series for ${foundSubject ? foundSubject.title : playlist.title}.`}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono-tabular pt-1 text-text-muted">
                    <div><span className="text-text-primary font-bold">Subject:</span> {foundSubject?.title || playlist.title}</div>
                    <div><span className="text-text-primary font-bold">Instructor:</span> {playlist.author || 'Faculty'}</div>
                    <div><span className="text-text-primary font-bold">Lectures:</span> {videos.length} videos</div>
                    <div><span className="text-text-primary font-bold">Video ID:</span> {currentVideo.youtubeId || 'Stream'}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* =================================================================
              RIGHT COLUMN: Tabbed Study Dock (Syllabus, Materials)
          ================================================================= */}
          <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-3 rounded-xl border border-border-subtle bg-surface overflow-hidden shadow-sm flex flex-col h-full min-h-[480px]">
            {/* Dock Tabs Header */}
            <div className="flex border-b border-border-subtle bg-surface-hover/50 shrink-0">
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
              <div className="flex-1 overflow-y-auto divide-y divide-border-subtle min-h-0">
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

            {/* TAB 2: SUBJECT ATTACHED MATERIALS */}
            {activeRightTab === 'resources' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
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
                  <div className="p-4 rounded-xl border border-border-subtle bg-canvas space-y-2.5 text-left">
                    <div className="flex items-center gap-2 text-text-primary font-semibold text-xs">
                      <FileText size={16} className="text-accent-forest shrink-0" />
                      <span>No Course Documents Attached</span>
                    </div>
                    <p className="text-[11px] text-text-muted leading-relaxed">
                      This playlist does not have attached PDFs or lecture notes yet. You can find comprehensive study material in the community vault.
                    </p>
                    <button
                      onClick={() => setCurrentView('resources')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-strong bg-surface hover:bg-surface-hover font-semibold text-xs text-text-primary cursor-pointer transition-colors shadow-xs"
                    >
                      <span>Browse Academic Vault</span>
                      <span className="font-mono-tabular">&rarr;</span>
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
