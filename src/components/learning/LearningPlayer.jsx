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
  BookmarkCheck
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
  const { courses, subjects, currentUser, toggleSaveResource, isResourceSaved } = useDatabase();

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

  const course = courses.find((c) => c.id === playlistId);
  const isDegree = course?.isDegree;

  // Filter subjects based on program type
  const currentSubjects = useMemo(() => {
    return (
      isDegree
        ? subjects.filter((s) => s.courseId === playlistId && s.semester === activeSemester)
        : subjects.filter((s) => s.courseId === playlistId)
    ).sort((a, b) => (a.position || 0) - (b.position || 0));
  }, [subjects, playlistId, activeSemester, isDegree]);

  // Auto select subject when semester or subjects change
  useEffect(() => {
    if (currentSubjects.length > 0) {
      const exists = currentSubjects.some((s) => s.id === activeSubjectId);
      if (!exists) {
        setActiveSubjectId(currentSubjects[0].id);
        setActivePlaylistId(null);
        setActiveVideoIndex(0);
      }
    } else {
      setActiveSubjectId(null);
      setActivePlaylistId(null);
    }
  }, [currentSubjects, activeSubjectId, isDegree]);

  const activeSubject = currentSubjects.find((s) => s.id === activeSubjectId) || currentSubjects[0];

  // Auto-select first playlist if none selected
  useEffect(() => {
    if (activeSubject && activeSubject.playlists && activeSubject.playlists.length > 0) {
      if (!activePlaylistId || !activeSubject.playlists.some((p) => p.id === activePlaylistId)) {
        setActivePlaylistId(activeSubject.playlists[0].id);
        setActiveVideoIndex(0);
      }
    }
  }, [activeSubject, activePlaylistId]);

  const activePlaylist = activeSubject?.playlists?.find((p) => p.id === activePlaylistId) || activeSubject?.playlists?.[0];
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
      {/* ── TOP BAR: STRICT 1 SINGLE HORIZONTAL LINE (< Back + Semester Dropdown on Leftmost, Subjects on Rightmost) ── */}
      <div
        className="glass-panel"
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '10px 16px',
          borderRadius: '12px',
          width: '100%',
          boxSizing: 'border-box',
          marginBottom: '16px'
        }}
      >
        {/* Leftmost Flex Group: Back button + Purple Semester Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button onClick={() => setCurrentView('learning')} style={styles.backBtn}>
            <ChevronLeft size={15} /> Back
          </button>

          {isDegree && (
            <CustomSemesterDropdown value={activeSemester} onChange={(s) => setActiveSemester(s)} />
          )}
        </div>

        {/* Rightmost Flex Group: Subject Selector Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', justifyContent: 'flex-end', flex: 1 }}>
          {isMobile ? (
            <select
              value={activeSubjectId || ''}
              onChange={(e) => setActiveSubjectId(e.target.value || null)}
              className="yt-select-dropdown"
              style={{ padding: '4px 10px', fontSize: '0.78rem', height: '30px' }}
            >
              {currentSubjects.length === 0 ? (
                <option value="">No subjects</option>
              ) : (
                currentSubjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.title}
                  </option>
                ))
              )}
            </select>
          ) : (
            <div className="yt-subject-chips-row" style={{ margin: 0, gap: '4px', flexWrap: 'nowrap' }}>
              {currentSubjects.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubjectId(sub.id)}
                  className={`yt-subject-chip ${activeSubjectId === sub.id ? 'active' : ''}`}
                  style={{ padding: '5px 14px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                >
                  {sub.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile Navigation Tabs Bar (< 1024px) ── */}
      {isMobile && (
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

      {/* ── MAIN WORKSPACE GRID ── */}
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

            {/* 2. Compact "Now Playing" Bar */}
            {activeVideo && (
              <div className="oracle-now-playing-bar">
                <div className="now-playing-left">
                  <span className="now-playing-pill">Playing</span>
                  <div className="now-playing-text">
                    <h3 className="now-playing-h">{activeVideo.title}</h3>
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

          {/* 3. Playlist Overview & Video Materials Below Player */}
          {activePlaylist && (
            <div className="subject-meta-hub glass-panel">
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

                {/* Videos List for Selected Playlist (Removed duration text and Skill Checks / AutoPlay toggles as requested) */}
                <div className="playlist-modules-accordion" style={{ maxHeight: '460px', overflowY: 'auto' }}>
                  <ul className="module-vids-ul" style={{ margin: 0 }}>
                    {playlistVideos.length > 0 ? (
                      playlistVideos.map((video, vIdx) => {
                        const isCurrent = activeVideo?.id === video.id || activeVideoIndex === vIdx;
                        const isWatched = watchedVideos.has(video.id || vIdx);

                        return (
                          <li key={video.id || vIdx}>
                            <button
                              type="button"
                              className={`video-row-item ${isCurrent ? 'active-playing' : ''}`}
                              onClick={() => handlePlayVideo(vIdx, video.id)}
                            >
                              <span className="video-circle-status">
                                {isCurrent ? (
                                  <PlayCircle size={16} className="ic-playing-glow" />
                                ) : isWatched ? (
                                  <CheckCircle2 size={16} className="ic-watched-green" />
                                ) : (
                                  <Circle size={16} className="ic-unplayed-ring" />
                                )}
                              </span>

                              <div className="video-row-details">
                                <span className="vid-title-text">{video.title}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                    <Clock size={11} /> {video.durationText || '15:00'}
                                  </span>
                                  {video.id && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                      ID: <code style={{ color: '#a78bfa' }}>{video.id}</code>
                                      <button
                                        type="button"
                                        onClick={(e) => handleCopyResId(video.id, e)}
                                        style={{ background: 'none', border: 'none', color: copiedPlayerResId === video.id ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                                        title="Copy Video ID"
                                      >
                                        {copiedPlayerResId === video.id ? <Check size={10} /> : <Copy size={10} />}
                                      </button>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                          </li>
                        );
                      })
                    ) : (
                      <div className="empty-playlist-box">
                        <p>No videos found in this playlist.</p>
                      </div>
                    )}
                  </ul>
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
