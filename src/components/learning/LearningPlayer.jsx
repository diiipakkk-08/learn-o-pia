import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useDatabase, extractYoutubePlaylistId, fetchYoutubePlaylistVideos } from '../../context/DatabaseContext';
import {
  Play,
  FileText,
  ChevronLeft,
  BookOpen,
  ChevronDown,
  Share2,
  Check,
  Download,
  PlayCircle,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  MessageSquare,
  SkipBack,
  SkipForward,
  UserCheck,
  Folder,
  Copy,
  Bookmark,
  BookmarkCheck,
  Plus
} from 'lucide-react';

const TYPE_LABEL = {
  syllabus: 'Syllabus',
  notes: 'Notes',
  pyq: 'PYQ',
  organizer: 'Organizer'
};

// Portal Dropdown for Semester selection
function SemesterPortalMenu({ triggerRef, menuRef, isOpen, value, onChange, onClose }) {
  const [style, setStyle] = useState({});

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setStyle({
        position: 'absolute',
        top: r.bottom + window.scrollY + 4,
        left: r.left + window.scrollX,
        width: Math.max(r.width, 140),
        zIndex: 99999,
        background: '#11121c',
        border: '1px solid rgba(139,92,246,0.4)',
        borderRadius: '10px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        padding: '6px 0',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '260px',
        overflowY: 'auto'
      });
    }
  }, [isOpen, triggerRef]);

  if (!isOpen) return null;
  return ReactDOM.createPortal(
    <div ref={menuRef} style={style}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => {
            onChange(s);
            onClose();
          }}
          style={{
            padding: '8px 14px',
            fontSize: '0.8rem',
            textAlign: 'left',
            background: value === s ? 'var(--primary)' : 'transparent',
            color: '#fff',
            fontWeight: value === s ? 700 : 400,
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            transition: 'background 0.15s',
            width: '100%'
          }}
        >
          Semester {s}
        </button>
      ))}
    </div>,
    document.body
  );
}

// Purple Styled Semester Dropdown (Matching subject chips)
function CustomSemesterDropdown({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      const clickedTrigger = triggerRef.current && triggerRef.current.contains(e.target);
      const clickedMenu = menuRef.current && menuRef.current.contains(e.target);
      if (!clickedTrigger && !clickedMenu) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [isOpen]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div
        ref={triggerRef}
        className="purple-semester-trigger"
        onClick={() => setIsOpen((o) => !o)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          borderRadius: '999px',
          fontSize: '0.8rem',
          fontWeight: 700,
          background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)',
          color: '#ffffff',
          border: '1px solid rgba(255,255,255,0.2)',
          cursor: 'pointer',
          boxShadow: '0 2px 10px rgba(139, 92, 246, 0.3)',
          whiteSpace: 'nowrap'
        }}
      >
        <span>Semester {value}</span>
        <ChevronDown
          size={13}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s'
          }}
        />
      </div>
      <SemesterPortalMenu
        triggerRef={triggerRef}
        menuRef={menuRef}
        isOpen={isOpen}
        value={value}
        onChange={onChange}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
}

export default function LearningPlayer({
  playlistId,
  activeVideoIndex,
  setActiveVideoIndex,
  setCurrentView
}) {
  const {
    courses,
    subjects,
    currentUser,
    toggleSaveResource,
    isResourceSaved,
    updateLastPlayed,
    enrollInPlaylist,
    removeUserPlaylistEnrollment,
    lastPlayed
  } = useDatabase();

  const [activeSemester, setActiveSemester] = useState(1);
  const [activeSubjectId, setActiveSubjectId] = useState(null);
  const [activePlaylistId, setActivePlaylistId] = useState(null);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 1023 : false));

  // Controls & Engagement states
  const [watchedVideos, setWatchedVideos] = useState(() => new Set());
  const [sidebarTab, setSidebarTab] = useState('playlist'); // 'playlist' | 'materials' | 'info'
  const [mainTab, setMainTab] = useState('overview'); // 'overview' | 'materials' | 'notes'
  const [mobileTab, setMobileTab] = useState('playlist'); // 'playlist' | 'materials' | 'overview'

  const [shareCopied, setShareCopied] = useState(false);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [copiedPlayerResId, setCopiedPlayerResId] = useState(null);
  const [userNotes, setUserNotes] = useState({});
  const [currentNoteText, setCurrentNoteText] = useState('');

  const handleCopyResId = (resId, e) => {
    if (e) e.preventDefault();
    if (!resId) return;
    navigator.clipboard.writeText(resId);
    setCopiedPlayerResId(resId);
    setTimeout(() => setCopiedPlayerResId(null), 2000);
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1023);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen for Ad Pop-up trigger to pause lecture video immediately
  useEffect(() => {
    const handlePauseMedia = () => {
      const playerIframe = document.querySelector('.oracle-video-wrapper iframe');
      if (playerIframe) {
        try {
          playerIframe.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo' }), '*');
        } catch (e) {}
      }
    };
    window.addEventListener('learnopia-pause-media', handlePauseMedia);
    return () => window.removeEventListener('learnopia-pause-media', handlePauseMedia);
  }, []);

  // ── RESOLVE COURSE & PLAYLIST METADATA ──
  const foundPlaylistInfo = useMemo(() => {
    if (!playlistId) return null;
    for (const sub of subjects || []) {
      const pl = sub.playlists?.find((p) => p.id === playlistId);
      if (pl) {
        return { subject: sub, playlist: pl };
      }
    }
    return null;
  }, [subjects, playlistId]);

  const course = useMemo(() => {
    let c = courses.find((item) => item.id === playlistId);
    if (!c && foundPlaylistInfo) {
      c = courses.find((item) => item.id === foundPlaylistInfo.subject.courseId);
      if (!c) {
        c = {
          id: foundPlaylistInfo.subject.courseId || playlistId,
          title: foundPlaylistInfo.playlist.title,
          department: 'General',
          isDegree: false,
          bannerUrl: foundPlaylistInfo.playlist.bannerUrl
        };
      }
    }
    return c;
  }, [courses, playlistId, foundPlaylistInfo]);

  const isDegree = Boolean(course?.isDegree);

  // Initialize or synchronize activePlaylistId / activeSubjectId / activeSemester on entry
  useEffect(() => {
    if (!playlistId) return;

    // Case 1: Direct playlist ID (e.g. from Standalone Playlists)
    if (foundPlaylistInfo) {
      setActiveSemester(Number(foundPlaylistInfo.subject.semester || 1));
      setActiveSubjectId(foundPlaylistInfo.subject.id);
      setActivePlaylistId(foundPlaylistInfo.playlist.id);
      return;
    }

    // Case 2: Resume / Last Played matching this course or playlist
    if (lastPlayed && (lastPlayed.courseId === playlistId || lastPlayed.playlistId === playlistId)) {
      if (lastPlayed.semester) setActiveSemester(Number(lastPlayed.semester));
      if (lastPlayed.subjectId) setActiveSubjectId(lastPlayed.subjectId);
      if (lastPlayed.playlistId) setActivePlaylistId(lastPlayed.playlistId);
      if (lastPlayed.videoIndex !== undefined && setActiveVideoIndex) {
        setActiveVideoIndex(Number(lastPlayed.videoIndex));
      }
      return;
    }
  }, [playlistId, foundPlaylistInfo]);

  // Filter subjects based on program type
  const currentSubjects = useMemo(() => {
    const targetCourseId = course?.id || playlistId;
    return (
      isDegree
        ? subjects.filter((s) => s.courseId === targetCourseId && Number(s.semester) === Number(activeSemester))
        : subjects.filter((s) => s.courseId === targetCourseId)
    ).sort((a, b) => (a.position || 0) - (b.position || 0));
  }, [subjects, playlistId, course, activeSemester, isDegree]);

  // Auto select subject when semester or subjects change (if not already set)
  useEffect(() => {
    if (currentSubjects.length > 0) {
      const exists = currentSubjects.some((s) => s.id === activeSubjectId);
      if (!exists) {
        setActiveSubjectId(currentSubjects[0].id);
      }
    }
  }, [currentSubjects, activeSubjectId]);

  const activeSubject = currentSubjects.find((s) => s.id === activeSubjectId) || currentSubjects[0];

  const activePlaylist = useMemo(() => {
    if (activePlaylistId) {
      const inActiveSub = activeSubject?.playlists?.find((p) => p.id === activePlaylistId);
      if (inActiveSub) return inActiveSub;
      for (const s of currentSubjects) {
        const pl = s.playlists?.find((p) => p.id === activePlaylistId);
        if (pl) return pl;
      }
    }
    return null;
  }, [activePlaylistId, activeSubject, currentSubjects]);

  const playlistVideos = activePlaylist?.videos || [];

  // ── LOCAL STORAGE PROGRESS PERSISTENCE ──
  useEffect(() => {
    if (!playlistId || !activePlaylistId) return;
    const storageKey = `learnopia_progress_${playlistId}_${activePlaylistId}`;

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.lastPlayedIndex !== undefined && parsed.lastPlayedIndex < playlistVideos.length) {
            setActiveVideoIndex(parsed.lastPlayedIndex);
          }
          if (parsed.watchedIndices && Array.isArray(parsed.watchedIndices)) {
            setWatchedVideos(new Set(parsed.watchedIndices));
          }
        } catch (e) {}
      }
    }
  }, [playlistId, activePlaylistId]);

  // Save progress whenever active video changes
  const saveProgress = (videoIdx, newWatchedSet) => {
    if (!playlistId || !activePlaylistId) return;
    const storageKey = `learnopia_progress_${playlistId}_${activePlaylistId}`;
    const watchedArray = Array.from(newWatchedSet);
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        lastPlayedIndex: videoIdx,
        watchedIndices: watchedArray
      })
    );
  };

  const activeVideo = useMemo(() => {
    if (playlistVideos && playlistVideos.length > 0) {
      return playlistVideos[activeVideoIndex] || playlistVideos[0];
    }
    return null;
  }, [playlistVideos, activeVideoIndex]);

  useEffect(() => {
    if ((activePlaylist || activeVideo) && typeof updateLastPlayed === 'function') {
      const vId = activeVideo?.youtubeId || (activeVideo?.url ? (activeVideo.url.match(/[?&]v=([^#&]+)/) || [])[1] : null);
      const videoThumb = vId ? `https://i.ytimg.com/vi/${vId}/hqdefault.jpg` : (activeVideo?.thumbnailUrl || activePlaylist?.bannerUrl || course?.bannerUrl);

      updateLastPlayed({
        playlistId: activePlaylist?.id || playlistId,
        playlistTitle: activePlaylist?.title || course?.title || 'Lecture Series',
        videoId: activeVideo?.id || null,
        videoTitle: activeVideo?.title || activePlaylist?.title || 'Lecture Video',
        courseId: course?.id || playlistId,
        bannerUrl: videoThumb || activePlaylist?.bannerUrl || course?.bannerUrl,
        videoThumbnail: videoThumb,
        youtubeId: vId,
        videoIndex: activeVideoIndex || 0,
        subjectId: activeSubject?.id || null,
        semester: activeSemester || 1
      });
    }
  }, [activePlaylist, activeVideo, activeVideoIndex, playlistId, course, activeSubject, activeSemester]);

  // Specific materials attached to active video
  const activeVideoMaterials = useMemo(() => {
    if (!activeSubject || !activeSubject.materials) return [];
    return activeSubject.materials.filter((m) => m.videoId === activeVideo?.id);
  }, [activeSubject, activeVideo]);

  // Group all course materials by Section Divisions for the Guides Tab
  const groupedMaterialsBySection = useMemo(() => {
    if (!activeSubject) return {};
    const customSections = activeSubject.customMaterialSections || ['Notes', 'Organizer', 'Past Year Papers', 'Syllabus'];
    const mats = activeSubject.materials || [];

    const grouped = {};
    customSections.forEach((sec) => {
      grouped[sec] = [];
    });

    mats.forEach((m) => {
      const secName = m.sectionName || m.type || 'Notes';
      const matchedKey = Object.keys(grouped).find(
        (k) => k.toLowerCase() === secName.toLowerCase()
      ) || secName;

      if (!grouped[matchedKey]) {
        grouped[matchedKey] = [];
      }
      grouped[matchedKey].push(m);
    });

    return grouped;
  }, [activeSubject]);

  // Load saved note when active video changes
  useEffect(() => {
    if (activeVideo) {
      setCurrentNoteText(userNotes[activeVideo.id] || '');
    }
  }, [activeVideo, userNotes]);

  // Auto fetch YT playlist if needed
  useEffect(() => {
    if (activePlaylist && (!activePlaylist.videos || activePlaylist.videos.length === 0)) {
      const ytPlId =
        activePlaylist.youtubePlaylistId ||
        extractYoutubePlaylistId(activePlaylist.description) ||
        extractYoutubePlaylistId(activePlaylist.title);

      if (ytPlId) {
        fetchYoutubePlaylistVideos(ytPlId).then((fetched) => {
          if (fetched && fetched.length > 0) {
            activePlaylist.videos = fetched;
            setActiveVideoIndex(0);
          }
        });
      }
    }
  }, [activePlaylistId, activePlaylist]);

  const getVideoSrc = (video) => {
    if (!video) return '';
    if (video.youtubeId?.startsWith('http') || video.youtubeId?.includes('embed/')) {
      return video.youtubeId;
    }
    return `https://www.youtube.com/embed/${video.youtubeId}?rel=0&modestbranding=1&autoplay=1`;
  };

  const handlePlayVideo = (vIdx, videoId) => {
    setActiveVideoIndex(vIdx);

    setWatchedVideos((prev) => {
      const next = new Set(prev);
      // Mark all videos up to vIdx as watched!
      for (let i = 0; i <= vIdx; i++) {
        if (playlistVideos[i]) {
          next.add(playlistVideos[i].id || i);
        }
      }
      saveProgress(vIdx, next);
      return next;
    });
  };

  const handleNextVideo = () => {
    if (!playlistVideos) return;
    if (activeVideoIndex < playlistVideos.length - 1) {
      const nextIdx = activeVideoIndex + 1;
      handlePlayVideo(nextIdx, playlistVideos[nextIdx]?.id);
    }
  };

  const handlePrevVideo = () => {
    if (activeVideoIndex > 0) {
      const prevIdx = activeVideoIndex - 1;
      handlePlayVideo(prevIdx, playlistVideos[prevIdx]?.id);
    }
  };

  const handleSaveNote = () => {
    if (!activeVideo) return;
    setUserNotes((prev) => ({
      ...prev,
      [activeVideo.id]: currentNoteText
    }));
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    }
  };

  // Stats calculation for current active playlist
  const watchedCount = useMemo(() => {
    return playlistVideos.filter((v, idx) => watchedVideos.has(v.id || idx)).length;
  }, [playlistVideos, watchedVideos]);

  const progressPercent = playlistVideos.length > 0 ? Math.round((watchedCount / playlistVideos.length) * 100) : 0;

  if (!course) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }} className="glass-panel">
        <p>Course syllabus not found.</p>
        <button onClick={() => setCurrentView('learning')} className="btn btn-primary" style={{ marginTop: '12px' }}>
          Back to Courses
        </button>
      </div>
    );
  }

  const ytPlId =
    activePlaylist?.youtubePlaylistId ||
    extractYoutubePlaylistId(activePlaylist?.description) ||
    extractYoutubePlaylistId(activePlaylist?.title);

  const currentSrc = ytPlId && (!activePlaylist?.videos || activePlaylist.videos.length === 0 || !activeVideo)
    ? `https://www.youtube.com/embed/videoseries?list=${ytPlId}&rel=0&modestbranding=1`
    : getVideoSrc(activeVideo);

  return (
    <div className="animate-fade-in oracle-workspace-container" style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      {/* ── TOP BAR: Single Horizontal Row (< Back + Semester Dropdown + Switch Playlist) ── */}
      <div
        className="glass-panel"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '8px 14px',
          borderRadius: '12px',
          width: '100%',
          boxSizing: 'border-box',
          marginBottom: '12px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
          <button onClick={() => setCurrentView('learning')} style={styles.backBtn}>
            <ChevronLeft size={15} /> Back
          </button>

          {isDegree && (
            <CustomSemesterDropdown value={activeSemester} onChange={(s) => setActiveSemester(s)} />
          )}

          {activePlaylistId && (
            <button
              onClick={() => setActivePlaylistId(null)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '6px 12px', gap: '4px', whiteSpace: 'nowrap', borderRadius: '999px' }}
              title="Switch Playlist Series"
            >
              <ChevronLeft size={13} /> Switch Playlist
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile Navigation Tabs Bar (< 1024px) ── */}
      {isMobile && activePlaylistId && (
        <div className="mobile-nav-tabs-bar">
          <button
            className={`mobile-tab-pill ${mobileTab === 'playlist' ? 'active' : ''}`}
            onClick={() => setMobileTab('playlist')}
          >
            <PlayCircle size={15} /> Playlist ({playlistVideos.length})
          </button>
          <button
            className={`mobile-tab-pill ${mobileTab === 'materials' ? 'active' : ''}`}
            onClick={() => setMobileTab('materials')}
          >
            <FileText size={15} /> Materials ({activeVideoMaterials.length})
          </button>
          <button
            className={`mobile-tab-pill ${mobileTab === 'overview' ? 'active' : ''}`}
            onClick={() => setMobileTab('overview')}
          >
            <BookOpen size={15} /> Overview
          </button>
        </div>
      )}

      {/* ── STACKED SUBJECT BLOCKS WITH HORIZONTAL PLAYLIST CAROUSELS ── */}
      {!activePlaylistId ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
          {currentSubjects.length === 0 ? (
            <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <BookOpen size={36} color="var(--primary)" style={{ opacity: 0.5, marginBottom: '8px' }} />
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#ffffff' }}>No subjects available for this semester yet.</p>
            </div>
          ) : (
            currentSubjects.map((sub) => {
              const subPlaylists = sub.playlists || [];

              return (
                <div
                  key={sub.id}
                  id={`subject-block-${sub.id}`}
                  className="glass-panel"
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    textAlign: 'left',
                    background: activeSubjectId === sub.id ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.02)',
                    border: activeSubjectId === sub.id ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.08)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)', padding: '3px 8px', borderRadius: '6px', color: '#fff', fontSize: '0.72rem', fontWeight: 800 }}>
                        {sub.code || 'SUB'}
                      </div>
                      <div>
                        <h2 style={{ fontSize: '0.98rem', color: '#ffffff', margin: 0, fontWeight: 700 }}>
                          {sub.title}
                        </h2>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          {subPlaylists.length} Lecture {subPlaylists.length === 1 ? 'Series' : 'Series'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveSubjectId(sub.id)}
                      className={`btn ${activeSubjectId === sub.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                      style={{ fontSize: '0.72rem', padding: '4px 10px', gap: '4px' }}
                    >
                      <Sparkles size={11} /> {activeSubjectId === sub.id ? 'Active' : 'Focus'}
                    </button>
                  </div>

                  {subPlaylists.length > 0 ? (
                    <div
                      style={{
                        display: 'flex',
                        gap: '12px',
                        overflowX: 'auto',
                        paddingBottom: '6px',
                        WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'thin'
                      }}
                    >
                      {subPlaylists.map((pl) => {
                        const firstVid = pl.videos && pl.videos[0];
                        const yId = pl.youtubePlaylistId || (firstVid?.youtubeId || (firstVid?.url ? (firstVid.url.match(/[?&]v=([^#&]+)/) || [])[1] : ''));
                        const thumb = pl.bannerUrl || (yId ? `https://i.ytimg.com/vi/${yId}/hqdefault.jpg` : null);

                        return (
                          <div
                            key={pl.id}
                            className="glass-panel"
                            style={{
                              minWidth: isMobile ? '230px' : '260px',
                              maxWidth: '280px',
                              flexShrink: 0,
                              borderRadius: '10px',
                              overflow: 'hidden',
                              display: 'flex',
                              flexDirection: 'column',
                              justify: 'space-between',
                              border: '1px solid rgba(139,92,246,0.3)',
                              background: '#11121c'
                            }}
                          >
                            <div style={{ height: '115px', background: '#000', position: 'relative', overflow: 'hidden' }}>
                              {thumb ? (
                                <img src={thumb} alt={pl.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e1b4b 0%, #311b92 100%)' }}>
                                  <Play size={28} color="#a78bfa" />
                                </div>
                              )}
                              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.85) 100%)' }} />
                              <span style={{ position: 'absolute', top: '6px', left: '6px', fontSize: '0.62rem', fontWeight: 700, color: '#fff', background: 'rgba(139,92,246,0.85)', padding: '2px 6px', borderRadius: '4px' }}>
                                {pl.videos?.length || 0} Videos
                              </span>
                            </div>

                            <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '8px' }}>
                              <div>
                                <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff', margin: '0 0 2px 0', lineHeight: '1.25' }}>{pl.title}</h3>
                                <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '0 0 4px 0', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {pl.description || 'Subject lecture series.'}
                                </p>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Instructor: <strong>{pl.author || 'Educator'}</strong></span>
                              </div>

                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  onClick={() => {
                                    setActiveSubjectId(sub.id);
                                    setActivePlaylistId(pl.id);
                                    setActiveVideoIndex(0);
                                  }}
                                  className="btn btn-primary btn-sm"
                                  style={{ flex: 1, fontSize: '0.72rem', padding: '4px 8px', gap: '4px' }}
                                >
                                  <Play size={12} /> Watch Series
                                </button>

                                {currentUser?.enrolledPlaylists?.includes(pl.id) ? (
                                  <button
                                    onClick={() => removeUserPlaylistEnrollment(currentUser?.id, pl.id)}
                                    className="btn btn-secondary btn-sm"
                                    style={{ fontSize: '0.7rem', color: '#10b981', borderColor: 'rgba(16,185,129,0.3)', padding: '4px 6px' }}
                                    title="Remove from My Learnings"
                                  >
                                    <BookmarkCheck size={11} />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => enrollInPlaylist(pl.id)}
                                    className="btn btn-secondary btn-sm"
                                    style={{ fontSize: '0.7rem', padding: '4px 6px' }}
                                    title="Add to My Learnings Section 2: Playlists"
                                  >
                                    <Plus size={11} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      No video playlists linked to this subject yet.
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* ── MAIN WORKSPACE GRID ── */
      <div className="oracle-learning-grid">
        {/* ========================================================= */}
        {/* LEFT COLUMN: 16:9 Video Player directly at the top        */}
        {/* ========================================================= */}
        <div className={`oracle-main-col ${isMobile && mobileTab !== 'playlist' ? 'mobile-hidden' : ''}`}>
          {/* 1. Main 16:9 Video Frame (Right at the top of page) */}
          <div className="player-frame-card glass-panel">
            <div style={styles.playerWrapper}>
              <iframe
                src={currentSrc}
                title={activeVideo?.title || activePlaylist?.title || 'Video Player'}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={styles.iframe}
              />
            </div>

            {/* 2. Compact "Now Playing" Bar with Expandable Video Heading & Arrow Icon */}
            {activeVideo && (
              <div className="oracle-now-playing-bar">
                <div
                  className="now-playing-left"
                  style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                  onClick={() => setShowDetailsDrawer(prev => !prev)}
                >
                  <span className="now-playing-pill">Playing</span>
                  <div className="now-playing-text" style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, position: 'relative' }}>
                      <div style={{ minWidth: 0, flex: 1, position: 'relative', overflow: 'hidden' }}>
                        <h3
                          className="now-playing-h"
                          style={{
                            whiteSpace: showDetailsDrawer ? 'normal' : 'nowrap',
                            overflow: showDetailsDrawer ? 'visible' : 'hidden',
                            textOverflow: showDetailsDrawer ? 'clip' : 'ellipsis',
                            wordBreak: 'break-word',
                            lineHeight: '1.3',
                            maskImage: showDetailsDrawer ? 'none' : 'linear-gradient(to right, black 85%, transparent 100%)',
                            WebkitMaskImage: showDetailsDrawer ? 'none' : 'linear-gradient(to right, black 85%, transparent 100%)'
                          }}
                        >
                          {activeVideo.title}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDetailsDrawer(prev => !prev);
                        }}
                        style={{
                          background: showDetailsDrawer ? 'var(--primary)' : 'rgba(139, 92, 246, 0.15)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          color: showDetailsDrawer ? '#ffffff' : '#a78bfa',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '50%',
                          width: '26px',
                          height: '26px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'all 0.2s ease'
                        }}
                        title={showDetailsDrawer ? 'Collapse Overview & Options' : 'Expand Overview & Options'}
                      >
                        <ChevronDown
                          size={15}
                          style={{
                            transform: showDetailsDrawer ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease'
                          }}
                        />
                      </button>
                    </div>
                    <span className="now-playing-sub">
                      Module {activePlaylist?.title ? activePlaylist.title : '1'} · Lecture {(activeVideoIndex || 0) + 1} of {playlistVideos.length}
                    </span>
                  </div>
                </div>

                <div className="now-playing-right">
                  {/* Prev Video Button */}
                  <button
                    type="button"
                    className="circle-action-btn"
                    onClick={handlePrevVideo}
                    disabled={activeVideoIndex === 0}
                    title="Previous Lecture"
                    style={{ opacity: activeVideoIndex === 0 ? 0.4 : 1 }}
                  >
                    <SkipBack size={16} />
                  </button>

                  {/* Next Video Button */}
                  <button
                    type="button"
                    className="circle-action-btn"
                    onClick={handleNextVideo}
                    disabled={activeVideoIndex >= playlistVideos.length - 1}
                    title="Next Lecture"
                    style={{ opacity: activeVideoIndex >= playlistVideos.length - 1 ? 0.4 : 1 }}
                  >
                    <SkipForward size={16} />
                  </button>

                  {/* Share Link */}
                  <button
                    type="button"
                    className="circle-action-btn"
                    onClick={handleShare}
                    title="Share lecture link"
                  >
                    {shareCopied ? <Check size={16} style={{ color: 'var(--success)' }} /> : <Share2 size={16} />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Playlist Overview & Video Materials Below Player (Only visible when arrow clicked) */}
          {activePlaylist && showDetailsDrawer && (
            <div className="subject-meta-hub glass-panel" style={{ marginTop: '12px' }}>
              <div className="action-tabs-bar" style={{ marginBottom: '14px', paddingBottom: '12px' }}>
                <button
                  className={`action-tab-pill ${mainTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setMainTab('overview')}
                >
                  <BookOpen size={16} /> Playlist Overview
                </button>
                <button
                  className={`action-tab-pill ${mainTab === 'materials' ? 'active' : ''}`}
                  onClick={() => setMainTab('materials')}
                >
                  <FileText size={16} /> Video Materials ({activeVideoMaterials.length})
                </button>
                <button
                  className={`action-tab-pill ${mainTab === 'notes' ? 'active' : ''}`}
                  onClick={() => setMainTab('notes')}
                >
                  <MessageSquare size={16} /> My Notes
                </button>
              </div>

              {/* Tab Contents */}
              <div className="action-tab-body">
                {/* Playlist Overview Below Video: Title, Description, Playlist Owner / Channel Credit */}
                {mainTab === 'overview' && (
                  <div className="tab-pane-content">
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{activePlaylist.title}</h3>
                    <p className="tab-pane-desc" style={{ marginBottom: '16px' }}>
                      {activePlaylist.description || `Lecture series playlist for ${activeSubject?.title || 'this subject'}.`}
                    </p>

                    <div className="stats-cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                      {/* Playlist Owner / Creator Channel Credit */}
                      <div className="stat-card-box">
                        <UserCheck size={18} color="var(--primary)" />
                        <div>
                          <strong style={{ color: '#ffffff' }}>
                            {activePlaylist.author || activeSubject?.author || course?.author || 'Take It Easy (MAKAUT)'}
                          </strong>
                          <span>Playlist Owner / Creator</span>
                        </div>
                      </div>

                      <div className="stat-card-box">
                        <Clock size={18} color="var(--primary)" />
                        <div>
                          <strong>{playlistVideos.length} Video Lectures</strong>
                          <span>Playlist Length</span>
                        </div>
                      </div>

                      <div className="stat-card-box">
                        <Sparkles size={18} color="var(--primary)" />
                        <div>
                          <strong>{activeSubject?.playlists?.length || 1} Playlist Series</strong>
                          <span>Subject Modules</span>
                        </div>
                      </div>
                    </div>

                    {/* Extra Instructor Overview Notes if provided */}
                    {activePlaylist.extraInfo && (
                      <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <strong style={{ color: '#ffffff', display: 'block', marginBottom: '4px' }}>Instructor & Playlist Notes:</strong>
                        {activePlaylist.extraInfo}
                      </div>
                    )}
                  </div>
                )}

                {/* Video Specific Materials */}
                {mainTab === 'materials' && (
                  <div className="tab-pane-content">
                    <h3>Lecture Specific PDF Materials</h3>
                    {activeVideoMaterials.length > 0 ? (
                      <div className="materials-grid-list">
                        {activeVideoMaterials.map((mat) => (
                          <div key={mat.id} className="mat-card-row">
                            <div className="mat-card-left">
                              <span className="mat-type-tag">{TYPE_LABEL[mat.type] || mat.type}</span>
                              <span className="mat-title-txt">{mat.title}</span>
                            </div>
                            <a
                              href={mat.url}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            >
                              <Download size={14} /> Open PDF
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-txt-notice">No specific PDF notes attached to this lecture video.</p>
                    )}
                  </div>
                )}

                {/* Personal Lecture Notes */}
                {mainTab === 'notes' && (
                  <div className="tab-pane-content">
                    <h3>My Lecture Notes</h3>
                    <p className="tab-pane-desc">
                      Personal notes for <strong>{activeVideo?.title || 'this lecture'}</strong>.
                    </p>

                    <div className="notes-box-wrap">
                      <textarea
                        className="form-input notes-textarea-field"
                        rows={4}
                        placeholder="Type lecture notes or key formulas here..."
                        value={currentNoteText}
                        onChange={(e) => setCurrentNoteText(e.target.value)}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                        <button className="btn btn-primary" onClick={handleSaveNote}>
                          Save Notes
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Single Playlist Dropdown & Sectioned Guides */}
        {/* ========================================================= */}
        <div className={`oracle-sidebar-col ${isMobile && mobileTab !== 'playlist' && mobileTab !== 'materials' ? 'mobile-hidden' : ''}`}>
          <div className="oracle-sidebar-card glass-panel">
            {/* Sidebar Top Header Tabs */}
            <div className="sidebar-top-tabs">
              <button
                className={`sidebar-top-tab ${sidebarTab === 'playlist' ? 'active' : ''}`}
                onClick={() => setSidebarTab('playlist')}
              >
                <PlayCircle size={15} /> Playlists
              </button>
              <button
                className={`sidebar-top-tab ${sidebarTab === 'materials' ? 'active' : ''}`}
                onClick={() => setSidebarTab('materials')}
              >
                <FileText size={15} /> Guides
              </button>
              <button
                className={`sidebar-top-tab ${sidebarTab === 'info' ? 'active' : ''}`}
                onClick={() => setSidebarTab('info')}
              >
                <BookOpen size={15} /> Overview
              </button>
            </div>

            {/* PLAYLIST TAB CONTENT: Single Playlist Select Dropdown + Clean Videos List */}
            {sidebarTab === 'playlist' && (
              <div className="sidebar-tab-pane">
                {/* ── SINGLE PLAYLIST SELECT DROPDOWN (Switches Playlist Series) ── */}
                {activeSubject?.playlists && activeSubject.playlists.length > 0 && (
                  <div style={{ marginBottom: '14px' }}>
                    <label className="form-label" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                      Select Playlist Series
                    </label>
                    <select
                      value={activePlaylistId || ''}
                      onChange={(e) => {
                        setActivePlaylistId(e.target.value);
                        setActiveVideoIndex(0);
                      }}
                      className="form-input"
                      style={{ width: '100%', padding: '8px 12px', fontSize: '0.83rem', fontWeight: 600, background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(139,92,246,0.3)', color: '#ffffff' }}
                    >
                      {activeSubject.playlists.map((pl, idx) => (
                        <option key={pl.id} value={pl.id} style={{ background: '#11121c', color: '#ffffff' }}>
                          {idx + 1}. {pl.title} ({pl.videos?.length || 0} videos)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Videos List for Selected Playlist (YouTube Playlist Player Style: Flat Clean List) */}
                <div
                  className="playlist-modules-accordion"
                  style={{
                    maxHeight: '500px',
                    overflowY: 'auto',
                    paddingRight: '2px',
                    scrollbarWidth: 'thin'
                  }}
                >
                  {playlistVideos.length > 0 ? (
                    <ul className="module-vids-ul" style={{ margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {playlistVideos.map((video, vIdx) => {
                        const isCurrent = activeVideo?.id === video.id || activeVideoIndex === vIdx;
                        const isWatched = watchedVideos.has(video.id || vIdx);

                        const vId = video.youtubeId || (video.url ? (video.url.match(/[?&]v=([^#&]+)/) || [])[1] : null);
                        const thumb = vId ? `https://i.ytimg.com/vi/${vId}/hqdefault.jpg` : (video.thumbnailUrl || activePlaylist?.bannerUrl || course?.bannerUrl);

                        return (
                          <li key={video.id || vIdx} style={{ listStyle: 'none' }}>
                            <button
                              type="button"
                              className={`video-row-item ${isCurrent ? 'active-playing' : ''}`}
                              onClick={() => handlePlayVideo(vIdx, video.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '8px',
                                borderRadius: '10px',
                                width: '100%',
                                background: isCurrent
                                  ? 'linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(124,58,237,0.12) 100%)'
                                  : 'rgba(255,255,255,0.02)',
                                border: isCurrent ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.05)',
                                borderLeft: isCurrent ? '3px solid var(--primary)' : '3px solid transparent',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {/* Left Thumbnail (YouTube Playlist Style) */}
                              <div
                                style={{
                                  position: 'relative',
                                  width: '94px',
                                  height: '54px',
                                  borderRadius: '6px',
                                  overflow: 'hidden',
                                  flexShrink: 0,
                                  background: '#000'
                                }}
                              >
                                {thumb ? (
                                  <img
                                    src={thumb}
                                    alt={video.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e1b4b 0%, #311b92 100%)' }}>
                                    <Play size={16} color="#a78bfa" />
                                  </div>
                                )}

                                <span style={{ position: 'absolute', bottom: '2px', right: '2px', background: 'rgba(0,0,0,0.85)', color: '#ffffff', fontSize: '0.6rem', fontWeight: 700, padding: '1px 4px', borderRadius: '3px' }}>
                                  {video.durationText || '15:00'}
                                </span>

                                {isCurrent && (
                                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(139,92,246,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <PlayCircle size={22} color="#ffffff" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }} />
                                  </div>
                                )}
                              </div>

                              {/* Right Video Details */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                  <span
                                    style={{
                                      fontSize: '0.68rem',
                                      fontWeight: 700,
                                      color: isCurrent ? 'var(--primary)' : 'var(--text-muted)'
                                    }}
                                  >
                                    #{vIdx + 1}
                                  </span>
                                  {isWatched && <CheckCircle2 size={12} color="#10b981" />}
                                  {isCurrent && (
                                    <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                      Playing
                                    </span>
                                  )}
                                </div>

                                <h4
                                  style={{
                                    fontSize: '0.8rem',
                                    fontWeight: isCurrent ? 700 : 500,
                                    color: isCurrent ? '#ffffff' : 'var(--text-secondary)',
                                    margin: 0,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    lineHeight: '1.3'
                                  }}
                                >
                                  {video.title}
                                </h4>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="empty-playlist-box" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <p style={{ margin: 0, fontSize: '0.82rem' }}>No videos found in this playlist.</p>
                    </div>
                  )}
                </div>

                {/* Progress Footer (Saved in LocalStorage) */}
                <div className="sidebar-progress-footer">
                  <div className="dur-summary-row">
                    <span className="dur-lbl">Playlist Progress</span>
                    <span className="dur-val">
                      {watchedCount} / {playlistVideos.length} Watched
                    </span>
                  </div>

                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill-bar" style={{ width: `${progressPercent}%` }} />
                  </div>

                  <div className="progress-text-sub">
                    <span>Watched Ratio</span>
                    <span>{progressPercent}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* GUIDES TAB: Categorized and Divided by Section Headers (Notes, Organizer, PYQ, Syllabus) */}
            {sidebarTab === 'materials' && (
              <div className="sidebar-tab-pane">
                <div className="pane-head-info" style={{ marginBottom: '12px' }}>
                  <h4>Entire Course Guides & PDFs</h4>
                  <p>All Syllabi, Notes, Organizers, and Past Year Papers for this course.</p>
                </div>

                {Object.keys(groupedMaterialsBySection).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {Object.entries(groupedMaterialsBySection).map(([sectionTitle, files]) => (
                      <div key={sectionTitle} style={{ textAlign: 'left' }}>
                        {/* Section Division Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <Folder size={14} color="#f59e0b" />
                          <strong style={{ fontSize: '0.8rem', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {sectionTitle} ({files.length})
                          </strong>
                        </div>

                        {files.length > 0 ? (
                          <div className="sidebar-mat-list" style={{ gap: '6px' }}>
                            {files.map((mat) => {
                              const isSaved = isResourceSaved && isResourceSaved(mat.id);
                              return (
                                <div
                                  key={mat.id}
                                  className="sidebar-mat-card"
                                  style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                >
                                  <a
                                    href={mat.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'inherit', flex: 1, minWidth: 0 }}
                                  >
                                    <FileText size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                                    <div style={{ minWidth: 0 }}>
                                      <strong style={{ fontSize: '0.82rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mat.title}</strong>
                                      <span className="mat-type-sub" style={{ fontSize: '0.7rem' }}>{TYPE_LABEL[mat.type] || mat.type || sectionTitle}</span>
                                    </div>
                                  </a>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        if (typeof toggleSaveResource === 'function') toggleSaveResource(mat.id);
                                      }}
                                      style={{ background: 'none', border: 'none', color: isSaved ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                                      title={isSaved ? 'Saved in My Resources' : 'Save to My Resources'}
                                    >
                                      {isSaved ? <BookmarkCheck size={14} color="#10b981" /> : <Bookmark size={14} />}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => handleCopyResId(mat.id, e)}
                                      style={{ background: 'none', border: 'none', color: copiedPlayerResId === mat.id ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2, padding: '4px', fontSize: '0.65rem' }}
                                      title={`Copy Resource ID (${mat.id})`}
                                    >
                                      {copiedPlayerResId === mat.id ? <Check size={12} /> : <Copy size={12} />}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: '4px 0 0 12px' }}>
                            No files uploaded.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-txt-notice">No PDF guides uploaded for this course yet.</p>
                )}
              </div>
            )}

            {/* RIGHT SIDEBAR OVERVIEW TAB: Academic Credits & Subject Info */}
            {sidebarTab === 'info' && (
              <div className="sidebar-tab-pane">
                <div className="pane-head-info">
                  <h4>{activeSubject?.title}</h4>
                  <span className="code-badge">{activeSubject?.code || 'SUB-101'}</span>
                </div>

                <div className="meta-info-list">
                  <div className="meta-info-row">
                    <span className="lbl">Academic Credits</span>
                    <span className="val" style={{ color: 'var(--primary)', fontWeight: 800 }}>
                      {activeSubject?.credits || 4} Credits
                    </span>
                  </div>
                  <div className="meta-info-row">
                    <span className="lbl">Playlist Owner</span>
                    <span className="val">{activeSubject?.author || course.author || 'designed by team OpenSeas'}</span>
                  </div>
                  <div className="meta-info-row">
                    <span className="lbl">Department</span>
                    <span className="val">{course.department || 'CSE/IT'}</span>
                  </div>
                  <div className="meta-info-row">
                    <span className="lbl">Semester</span>
                    <span className="val">Semester {activeSubject?.semester || activeSemester}</span>
                  </div>
                  <div className="meta-info-row">
                    <span className="lbl">Total Videos</span>
                    <span className="val">{playlistVideos.length} Lectures</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

const styles = {
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'var(--text-secondary)',
    padding: '6px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontFamily: 'var(--font-heading)',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap'
  },
  playerWrapper: {
    position: 'relative',
    paddingBottom: '56.25%',
    height: 0,
    overflow: 'hidden',
    borderRadius: '16px 16px 0 0',
    width: '100%'
  },
  iframe: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: 'none'
  }
};
