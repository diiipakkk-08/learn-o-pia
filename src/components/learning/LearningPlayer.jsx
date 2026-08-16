import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useDatabase, extractYoutubePlaylistId, fetchYoutubePlaylistVideos } from '../../context/DatabaseContext';
import {
  Play,
  FileText,
  ChevronLeft,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Share2,
  Check,
  Download,
  PlayCircle,
  CheckCircle2,
  Circle,
  Search,
  Clock,
  GraduationCap,
  Sparkles,
  MessageSquare,
  SkipBack,
  SkipForward,
  ArrowRight,
  ListVideo,
  Layers
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
        border: '1px solid rgba(139,92,246,0.3)',
        borderRadius: '10px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
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
            color: value === s ? '#fff' : 'var(--text-secondary)',
            fontWeight: value === s ? 600 : 400,
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
    <div style={{ position: 'relative' }}>
      <div
        ref={triggerRef}
        className="custom-dropdown-trigger"
        onClick={() => setIsOpen((o) => !o)}
        style={{ padding: '6px 12px', fontSize: '0.8rem', height: '34px', background: 'rgba(255,255,255,0.03)' }}
      >
        <span>Sem {value}</span>
        <ChevronDown
          size={14}
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
  const { courses, subjects } = useDatabase();

  const [activeSemester, setActiveSemester] = useState(1);
  const [activeSubjectId, setActiveSubjectId] = useState(null);
  
  // Step State: selectedPlaylistId is null when browsing playlists hub, non-null when in video player view!
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);

  const [videoSearchQuery, setVideoSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 1023 : false));

  // Engagement & Player state
  const [watchedVideos, setWatchedVideos] = useState(() => new Set());
  const [autoPlay, setAutoPlay] = useState(true);
  const [showSkillChecks, setShowSkillChecks] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('playlist'); // 'playlist' | 'materials' | 'info'
  const [mainTab, setMainTab] = useState('overview'); // 'overview' | 'materials' | 'notes'
  const [mobileTab, setMobileTab] = useState('playlist'); // 'playlist' | 'materials' | 'overview'

  const [shareCopied, setShareCopied] = useState(false);
  const [userNotes, setUserNotes] = useState({});
  const [currentNoteText, setCurrentNoteText] = useState('');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1023);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  // Auto select subject when semester changes
  useEffect(() => {
    if (currentSubjects.length > 0) {
      const exists = currentSubjects.some((s) => s.id === activeSubjectId);
      if (!exists) {
        setActiveSubjectId(currentSubjects[0].id);
        setSelectedPlaylistId(null);
        setActiveVideoIndex(0);
      }
    } else {
      setActiveSubjectId(null);
      setSelectedPlaylistId(null);
    }
  }, [currentSubjects, activeSubjectId, isDegree]);

  const activeSubject = currentSubjects.find((s) => s.id === activeSubjectId) || currentSubjects[0];

  const activePlaylist = useMemo(() => {
    if (!activeSubject || !activeSubject.playlists) return null;
    return activeSubject.playlists.find((p) => p.id === selectedPlaylistId) || null;
  }, [activeSubject, selectedPlaylistId]);

  const activeVideo = useMemo(() => {
    if (activePlaylist?.videos && activePlaylist.videos.length > 0) {
      return activePlaylist.videos[activeVideoIndex] || activePlaylist.videos[0];
    }
    return null;
  }, [activePlaylist, activeVideoIndex]);

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
  }, [selectedPlaylistId, activePlaylist]);

  const getVideoSrc = (video) => {
    if (!video) return '';
    if (video.youtubeId?.startsWith('http') || video.youtubeId?.includes('embed/')) {
      return video.youtubeId;
    }
    return `https://www.youtube.com/embed/${video.youtubeId}?rel=0&modestbranding=1&autoplay=1`;
  };

  const handleStartPlaylist = (plId) => {
    setSelectedPlaylistId(plId);
    setActiveVideoIndex(0);
  };

  const handlePlayVideo = (vIdx, videoId) => {
    setActiveVideoIndex(vIdx);
    if (videoId) {
      setWatchedVideos((prev) => {
        const next = new Set(prev);
        next.add(videoId);
        return next;
      });
    }
  };

  const handleNextVideo = () => {
    if (!activePlaylist?.videos) return;
    if (activeVideoIndex < activePlaylist.videos.length - 1) {
      setActiveVideoIndex(activeVideoIndex + 1);
    }
  };

  const handlePrevVideo = () => {
    if (activeVideoIndex > 0) {
      setActiveVideoIndex(activeVideoIndex - 1);
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

  // Stats calculation for selected playlist
  const playlistVideos = activePlaylist?.videos || [];
  const watchedCount = useMemo(() => {
    return playlistVideos.filter((v) => watchedVideos.has(v.id)).length;
  }, [playlistVideos, watchedVideos]);

  const progressPercent = playlistVideos.length > 0 ? Math.round((watchedCount / playlistVideos.length) * 100) : 0;

  // Filter video rows by search query
  const filteredVideos = useMemo(() => {
    if (!playlistVideos) return [];
    if (!videoSearchQuery.trim()) return playlistVideos;
    const q = videoSearchQuery.toLowerCase().trim();
    return playlistVideos.filter((v) => v.title.toLowerCase().includes(q));
  }, [playlistVideos, videoSearchQuery]);

  if (!course) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }} className="glass-panel">
        <p>Course not found.</p>
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

  // =========================================================================
  // STEP 1: PLAYLIST SELECTION OVERVIEW HUB (Before video starts playing)
  // =========================================================================
  if (!selectedPlaylistId || !activePlaylist) {
    return (
      <div className="animate-fade-in oracle-workspace-container" style={styles.container}>
        {/* Top Header Row */}
        <div className="glass-panel" style={styles.compactTopBar}>
          <button onClick={() => setCurrentView('learning')} style={styles.backBtn}>
            <ChevronLeft size={16} /> Back to Courses
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0, overflowX: 'auto' }}>
            {isDegree && (
              <CustomSemesterDropdown value={activeSemester} onChange={(s) => setActiveSemester(s)} />
            )}

            {isMobile ? (
              <select
                value={activeSubjectId || ''}
                onChange={(e) => setActiveSubjectId(e.target.value || null)}
                className="yt-select-dropdown"
                style={{ padding: '6px 12px', fontSize: '0.8rem', flex: 1 }}
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
              <div className="yt-subject-chips-row" style={{ margin: 0 }}>
                {currentSubjects.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setActiveSubjectId(sub.id)}
                    className={`yt-subject-chip ${activeSubjectId === sub.id ? 'active' : ''}`}
                    style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                  >
                    {sub.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Subject Playlists Hub */}
        {activeSubject && (
          <div className="glass-panel" style={{ padding: '24px', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span className="code-badge">{activeSubject.code || 'SUB-101'} · {activeSubject.credits || 4} Credits</span>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff', margin: '4px 0 0 0' }}>{activeSubject.title}</h1>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {activeSubject.playlists?.length || 0} Playlists Available
              </span>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Select a video playlist series below to start learning.
            </p>

            {/* Playlists Cards Grid */}
            {!activeSubject.playlists || activeSubject.playlists.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Layers size={36} style={{ marginBottom: '8px' }} />
                <p>No playlists added to this subject yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {activeSubject.playlists.map((pl, idx) => (
                  <div
                    key={pl.id}
                    className="glass-panel"
                    style={{
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '16px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#a78bfa', background: 'rgba(139,92,246,0.15)', padding: '3px 8px', borderRadius: '999px' }}>
                          Playlist #{idx + 1}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <ListVideo size={13} style={{ display: 'inline', marginRight: 4 }} />
                          {pl.videos?.length || 0} Videos
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '6px' }}>{pl.title}</h3>
                      {pl.description && (
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                          {pl.description}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleStartPlaylist(pl.id)}
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '0.85rem' }}
                    >
                      Study This Playlist Now <ArrowRight size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // STEP 2: CLEAN DISTRACTION-FREE VIDEO PLAYER VIEW (After playlist is clicked)
  // =========================================================================
  return (
    <div className="animate-fade-in oracle-workspace-container" style={styles.container}>
      {/* ── MINIMAL TOP BAR: Only Back to Subject Playlists button (No heavy headers above video) ── */}
      <div className="glass-panel" style={styles.compactTopBar}>
        <button onClick={() => setSelectedPlaylistId(null)} style={styles.backBtn}>
          <ChevronLeft size={16} /> Back to Subject Playlists
        </button>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', marginLeft: 'auto' }}>
          {activePlaylist.title}
        </span>
      </div>

      {/* ── Mobile Navigation Tabs Bar (< 1024px) ── */}
      {isMobile && (
        <div className="mobile-nav-tabs-bar">
          <button
            className={`mobile-tab-pill ${mobileTab === 'playlist' ? 'active' : ''}`}
            onClick={() => setMobileTab('playlist')}
          >
            <PlayCircle size={15} /> Videos ({playlistVideos.length})
          </button>
          <button
            className={`mobile-tab-pill ${mobileTab === 'materials' ? 'active' : ''}`}
            onClick={() => setMobileTab('materials')}
          >
            <FileText size={15} /> Materials ({activeSubject?.materials?.length || 0})
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
        {/* LEFT COLUMN: Clean Video Player                           */}
        {/* ========================================================= */}
        <div className={`oracle-main-col ${isMobile && mobileTab !== 'playlist' ? 'mobile-hidden' : ''}`}>
          {/* 1. Main 16:9 Video Frame */}
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
                      Lecture {(activeVideoIndex || 0) + 1} of {playlistVideos.length}
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

          {/* 3. Subject Metadata Card & Tabs */}
          {activeSubject && (
            <div className="subject-meta-hub glass-panel">
              <div className="action-tabs-bar" style={{ marginBottom: '14px', paddingBottom: '12px' }}>
                <button
                  className={`action-tab-pill ${mainTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setMainTab('overview')}
                >
                  <BookOpen size={16} /> Overview
                </button>
                <button
                  className={`action-tab-pill ${mainTab === 'materials' ? 'active' : ''}`}
                  onClick={() => setMainTab('materials')}
                >
                  <FileText size={16} /> Materials ({activeSubject.materials?.length || 0})
                </button>
                <button
                  className={`action-tab-pill ${mainTab === 'notes' ? 'active' : ''}`}
                  onClick={() => setMainTab('notes')}
                >
                  <MessageSquare size={16} /> Lecture Notes
                </button>
              </div>

              {/* Tab Contents */}
              <div className="action-tab-body">
                {mainTab === 'overview' && (
                  <div className="tab-pane-content">
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>{activePlaylist.title}</h3>
                    <p className="tab-pane-desc">
                      Currently studying playlist in <strong>{activeSubject.title}</strong>.
                    </p>

                    <div className="stats-cards-grid">
                      <div className="stat-card-box">
                        <Clock size={18} color="var(--primary)" />
                        <div>
                          <strong>{playlistVideos.length} Videos</strong>
                          <span>In Playlist</span>
                        </div>
                      </div>

                      <div className="stat-card-box">
                        <GraduationCap size={18} color="var(--primary)" />
                        <div>
                          <strong>{activeSubject.credits || 4} Credits</strong>
                          <span>Semester {activeSubject.semester || activeSemester}</span>
                        </div>
                      </div>

                      <div className="stat-card-box">
                        <Sparkles size={18} color="var(--primary)" />
                        <div>
                          <strong>{activeSubject.materials?.length || 0} Documents</strong>
                          <span>Syllabi & Notes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {mainTab === 'materials' && (
                  <div className="tab-pane-content">
                    <h3>Study Materials & PDFs</h3>
                    {activeSubject.materials && activeSubject.materials.length > 0 ? (
                      <div className="materials-grid-list">
                        {activeSubject.materials.map((mat) => (
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
                      <p className="empty-txt-notice">No study materials uploaded for this subject yet.</p>
                    )}
                  </div>
                )}

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
        {/* RIGHT COLUMN: Video List Sidebar for Selected Playlist    */}
        {/* ========================================================= */}
        <div className={`oracle-sidebar-col ${isMobile && mobileTab !== 'playlist' && mobileTab !== 'materials' ? 'mobile-hidden' : ''}`}>
          <div className="oracle-sidebar-card glass-panel">
            <div className="sidebar-top-tabs">
              <button
                className={`sidebar-top-tab ${sidebarTab === 'playlist' ? 'active' : ''}`}
                onClick={() => setSidebarTab('playlist')}
              >
                <PlayCircle size={15} /> Playlist Videos
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

            {/* PLAYLIST VIDEOS TAB */}
            {sidebarTab === 'playlist' && (
              <div className="sidebar-tab-pane">
                {/* Search Box */}
                <div className="playlist-search-wrap">
                  <Search size={15} className="search-icon-fixed" />
                  <input
                    type="text"
                    placeholder="Search videos in playlist…"
                    value={videoSearchQuery}
                    onChange={(e) => setVideoSearchQuery(e.target.value)}
                    className="form-input playlist-search-input"
                  />
                  {videoSearchQuery && (
                    <button className="search-clear-x" onClick={() => setVideoSearchQuery('')}>
                      ×
                    </button>
                  )}
                </div>

                {/* Toggles Bar */}
                <div className="playlist-toggles-bar">
                  <label className="checkbox-toggle-label">
                    <input
                      type="checkbox"
                      checked={showSkillChecks}
                      onChange={(e) => setShowSkillChecks(e.target.checked)}
                    />
                    <span>Skill Checks</span>
                  </label>

                  <label className="checkbox-toggle-label">
                    <input
                      type="checkbox"
                      checked={autoPlay}
                      onChange={(e) => setAutoPlay(e.target.checked)}
                    />
                    <span>Auto Play</span>
                  </label>
                </div>

                {/* Videos List */}
                <div className="playlist-modules-accordion">
                  <ul className="module-vids-ul" style={{ margin: 0 }}>
                    {filteredVideos.length > 0 ? (
                      filteredVideos.map((video, vIdx) => {
                        const isCurrent = activeVideo?.id === video.id || activeVideoIndex === vIdx;
                        const isWatched = watchedVideos.has(video.id);

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
                                ) : isWatched && showSkillChecks ? (
                                  <CheckCircle2 size={16} className="ic-watched-green" />
                                ) : (
                                  <Circle size={16} className="ic-unplayed-ring" />
                                )}
                              </span>

                              <div className="video-row-details">
                                <span className="vid-title-text">{video.title}</span>
                                <span className="vid-duration-sub">{video.duration || '8m'}</span>
                              </div>
                            </button>
                          </li>
                        );
                      })
                    ) : (
                      <div className="empty-playlist-box">
                        <p>No videos match search.</p>
                      </div>
                    )}
                  </ul>
                </div>

                {/* Progress Footer */}
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

            {/* MATERIALS TAB */}
            {sidebarTab === 'materials' && (
              <div className="sidebar-tab-pane">
                <div className="pane-head-info">
                  <h4>Guides & Documents</h4>
                  <p>PDF Syllabi, Notes, and Exam Practice papers.</p>
                </div>

                {activeSubject?.materials && activeSubject.materials.length > 0 ? (
                  <div className="sidebar-mat-list">
                    {activeSubject.materials.map((mat) => (
                      <a
                        key={mat.id}
                        href={mat.url}
                        target="_blank"
                        rel="noreferrer"
                        className="sidebar-mat-card"
                      >
                        <FileText size={18} color="var(--primary)" />
                        <div>
                          <strong>{mat.title}</strong>
                          <span className="mat-type-sub">{TYPE_LABEL[mat.type] || mat.type}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="empty-txt-notice">No documents uploaded for this subject.</p>
                )}
              </div>
            )}

            {/* OVERVIEW TAB */}
            {sidebarTab === 'info' && (
              <div className="sidebar-tab-pane">
                <div className="pane-head-info">
                  <h4>{activeSubject?.title}</h4>
                  <span className="code-badge">{activeSubject?.code}</span>
                </div>

                <div className="meta-info-list">
                  <div className="meta-info-row">
                    <span className="lbl">Department</span>
                    <span className="val">{course.department || 'Engineering'}</span>
                  </div>
                  <div className="meta-info-row">
                    <span className="lbl">Semester</span>
                    <span className="val">Semester {activeSubject?.semester || activeSemester}</span>
                  </div>
                  <div className="meta-info-row">
                    <span className="lbl">Credits</span>
                    <span className="val">{activeSubject?.credits || 4} Credits</span>
                  </div>
                  <div className="meta-info-row">
                    <span className="lbl">Playlist Videos</span>
                    <span className="val">{playlistVideos.length} Videos</span>
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
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box'
  },
  compactTopBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 14px',
    borderRadius: '12px',
    boxSizing: 'border-box',
    width: '100%'
  },
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
