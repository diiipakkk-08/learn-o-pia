/**
 * LearningPlayer.jsx
 * Distraction-free, top-aligned video lecture player with unified controls, syllabus drawer, and study dock.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useDatabase, fetchYoutubePlaylistVideos, extractYoutubePlaylistId } from '../../context/DatabaseContext';
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
      // 1. Direct match in subject playlists (by playlist ID or youtubePlaylistId)
      (subjects || []).forEach((sub) => {
        (sub.playlists || []).forEach((pl) => {
          if (pl.id === playlistId || (pl.youtubePlaylistId && pl.youtubePlaylistId === playlistId)) {
            p = pl;
            s = sub;
          }
        });
      });

      // 2. Check if playlistId matches a subject directly (sub.id or sub.title)
      if (!p) {
        const sub = (subjects || []).find(
          (sub) => sub.id === playlistId || sub.title?.toLowerCase() === playlistId?.toLowerCase()
        );
        if (sub) {
          s = sub;
          if (sub.playlists && sub.playlists.length > 0) {
            p = sub.playlists[0];
          } else {
            const ytId = extractYoutubePlaylistId(
              sub.youtubePlaylistId || sub.youtube_playlist_id || sub.playlistUrl || ''
            );
            p = {
              id: `pl-${sub.id}`,
              title: sub.title,
              description: sub.description || `Comprehensive university lecture series for ${sub.title}.`,
              author: sub.author || 'Faculty Instructor',
              youtubePlaylistId: ytId,
              videos: []
            };
          }
        }
      }

      // 3. Check if playlistId matches a course in courses
      if (!p) {
        const directCourse = (courses || []).find(
          (cr) => cr.id === playlistId || cr.title?.toLowerCase() === playlistId?.toLowerCase()
        );
        if (directCourse) {
          const courseSub = (subjects || []).find((sub) => sub.courseId === directCourse.id);
          if (courseSub && courseSub.playlists && courseSub.playlists.length > 0) {
            p = courseSub.playlists[0];
            s = courseSub;
          } else {
            const ytId = extractYoutubePlaylistId(
              directCourse.youtubePlaylistId ||
              directCourse.youtube_playlist_id ||
              directCourse.playlist_url ||
              directCourse.playlistUrl ||
              ''
            );
            p = {
              id: directCourse.id,
              title: directCourse.title,
              description: directCourse.description || `Lecture series for ${directCourse.title}.`,
              author: directCourse.author || directCourse.creatorName || 'Faculty Instructor',
              youtubePlaylistId: ytId,
              videos: directCourse.videos || []
            };
            if (courseSub) s = courseSub;
          }
        }
      }

      // 4. Check if playlistId is a raw YouTube Playlist link or ID
      if (!p) {
        const rawYtId = extractYoutubePlaylistId(playlistId);
        if (rawYtId) {
          p = {
            id: `pl-${rawYtId}`,
            title: 'YouTube Lecture Series',
            description: 'Streaming syllabus lectures from linked YouTube playlist.',
            author: 'Faculty & Educators',
            youtubePlaylistId: rawYtId,
            videos: []
          };
        }
      }
    }

    // 5. Only if absolutely no match was found AND no playlistId was provided, pick first available
    if (!p && !playlistId) {
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
    videos: []
  };

  const [dynamicVideos, setDynamicVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);

  const cleanYtPlaylistId = useMemo(() => {
    let yt = extractYoutubePlaylistId(playlist?.youtubePlaylistId || playlist?.youtube_playlist_id || '');
    if (yt) return yt;
    if (foundSubject?.youtubePlaylistId || foundSubject?.youtube_playlist_id) {
      yt = extractYoutubePlaylistId(foundSubject.youtubePlaylistId || foundSubject.youtube_playlist_id);
      if (yt) return yt;
    }
    if (playlist?.id) {
      yt = extractYoutubePlaylistId(playlist.id);
      if (yt) return yt;
    }
    if (playlistId) {
      yt = extractYoutubePlaylistId(playlistId);
      if (yt) return yt;
    }
    return '';
  }, [playlist, foundSubject, playlistId]);

  // Dynamically load YouTube playlist lectures only if database videos are absent
  useEffect(() => {
    let isMounted = true;
    if (cleanYtPlaylistId && (!playlist.videos || playlist.videos.length === 0)) {
      setLoadingVideos(true);
      fetchYoutubePlaylistVideos(cleanYtPlaylistId)
        .then((fetched) => {
          if (isMounted && fetched && fetched.length > 0) {
            setDynamicVideos(fetched);
          }
        })
        .catch((err) => {
          console.warn('Error fetching playlist videos:', err);
        })
        .finally(() => {
          if (isMounted) setLoadingVideos(false);
        });
    } else {
      setDynamicVideos([]);
    }
    return () => {
      isMounted = false;
    };
  }, [cleanYtPlaylistId, playlist.videos]);

  const videos = useMemo(() => {
    // 1. If playlist already has real videos from the database, use them!
    if (playlist.videos && playlist.videos.length > 0) return playlist.videos;
    // 2. If dynamic extraction found lectures, use them!
    if (dynamicVideos && dynamicVideos.length > 0) return dynamicVideos;
    // 3. If a YouTube playlist ID is present, offer playlist stream placeholder
    if (cleanYtPlaylistId) {
      return [{ id: 'pl-stream', title: `${playlist.title}: Full Playlist Stream`, youtubeId: '' }];
    }
    // 4. Fallback based on playlist title
    return [{ id: 'v1', title: `${playlist.title}: Lecture Overview`, youtubeId: '' }];
  }, [playlist.videos, dynamicVideos, cleanYtPlaylistId, playlist.title]);

  const currentVideo = videos[currentIndex] || videos[0] || {};

  // Sync lastPlayed to DB/context
  useEffect(() => {
    if (playlist && currentVideo && updateLastPlayed) {
      const vidId = currentVideo.youtubeId || '';
      updateLastPlayed({
        playlistId: playlist.id,
        playlistTitle: playlist.title,
        videoIndex: currentIndex,
        videoTitle: currentVideo.title || playlist.title,
        youtubeId: vidId,
        thumbnail: vidId ? `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg` : '',
        progress: Math.round(((currentIndex + 1) / Math.max(videos.length, 1)) * 100)
      });
    }
  }, [playlist.id, currentVideo?.youtubeId, currentIndex, videos.length]);

  const youtubeVideoUrl = currentVideo?.youtubeId
    ? `https://www.youtube.com/watch?v=${currentVideo.youtubeId}${cleanYtPlaylistId ? `&list=${cleanYtPlaylistId}` : ''}`
    : cleanYtPlaylistId
    ? `https://www.youtube.com/playlist?list=${cleanYtPlaylistId}`
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
              {cleanYtPlaylistId ? (
                <iframe
                  src={
                    currentVideo?.youtubeId
                      ? `https://www.youtube-nocookie.com/embed/${currentVideo.youtubeId}?list=${cleanYtPlaylistId}&autoplay=1&rel=0&modestbranding=1`
                      : `https://www.youtube-nocookie.com/embed/videoseries?list=${cleanYtPlaylistId}&autoplay=1&rel=0&modestbranding=1`
                  }
                  title={currentVideo?.title || playlist.title}
                  className="w-full h-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : currentVideo?.youtubeId ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${currentVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                  title={currentVideo.title}
                  className="w-full h-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-surface-sunken select-none">
                  <Play size={40} className="text-text-muted mb-3 opacity-30" />
                  <p className="text-sm font-semibold text-text-primary">No video lectures linked yet</p>
                  <p className="text-xs text-text-muted mt-1 max-w-sm">
                    Attach any YouTube playlist URL in the Creator Studio to stream syllabus lectures here.
                  </p>
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
                  <p className="leading-relaxed whitespace-pre-line">
                    {currentVideo.description || playlist.description || `Lecture series for ${foundSubject ? foundSubject.title : playlist.title}.`}
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
          <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-3 rounded-xl border border-border-subtle bg-surface overflow-hidden shadow-sm flex flex-col h-[520px] lg:h-[calc(100vh-140px)] max-h-[840px]">
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
                Syllabus ({loadingVideos ? 'Loading...' : videos.length})
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

            {/* TAB 1: SYLLABUS LECTURE CHECKLIST WITH THUMBNAILS */}
            {activeRightTab === 'syllabus' && (
              <div className="flex-1 overflow-y-auto divide-y divide-border-subtle min-h-0">
                {videos.map((vid, idx) => {
                  const isCurrent = idx === currentIndex;
                  const thumbUrl =
                    vid.thumbnail ||
                    (vid.youtubeId
                      ? `https://i.ytimg.com/vi/${vid.youtubeId}/mqdefault.jpg`
                      : null);

                  return (
                    <div
                      key={vid.id || idx}
                      onClick={() => updateIndex(idx)}
                      className={`p-2.5 sm:p-3 flex items-center gap-3 cursor-pointer transition-colors ${
                        isCurrent
                          ? 'bg-accent-forest/10 border-l-4 border-l-accent-forest text-text-primary'
                          : 'hover:bg-surface-hover text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {/* Index Badge */}
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center shrink-0 text-[10px] font-mono-tabular font-bold border ${
                          isCurrent
                            ? 'bg-accent-forest text-white border-accent-forest shadow-xs'
                            : 'bg-surface text-text-muted border-border-subtle'
                        }`}
                      >
                        {idx + 1}
                      </div>

                      {/* Video Thumbnail */}
                      <div className="relative w-16 h-10 sm:w-20 sm:h-12 rounded-md overflow-hidden bg-black/10 shrink-0 border border-border-subtle">
                        {thumbUrl ? (
                          <img
                            src={thumbUrl}
                            alt={vid.title}
                            loading="lazy"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-black/5 text-text-muted">
                            <Play size={12} />
                          </div>
                        )}
                        {isCurrent && (
                          <div className="absolute inset-0 bg-black/35 flex items-center justify-center backdrop-blur-2xs">
                            <Play size={14} fill="#ffffff" className="text-white" />
                          </div>
                        )}
                      </div>

                      {/* Video Title & Meta */}
                      <div className="min-w-0 flex-1">
                        <div
                          className={`text-xs leading-snug line-clamp-2 ${
                            isCurrent
                              ? 'font-bold text-text-primary'
                              : 'font-medium text-text-secondary'
                          }`}
                          title={vid.title}
                        >
                          {vid.title}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-text-muted font-mono-tabular mt-1">
                          <span className={isCurrent ? 'text-accent-forest font-bold' : ''}>
                            {isCurrent ? 'NOW PLAYING' : `LEC ${idx + 1}`}
                          </span>
                          {vid.duration && (
                            <>
                              <span>•</span>
                              <span>{vid.duration}</span>
                            </>
                          )}
                        </div>
                      </div>
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
