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
  UserCheck,
  Award
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
            background: value === s ? 'var(--primary-hover)' : 'transparent',
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
    <div style={{ position: 'relative' }}>
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
  const { courses, subjects } = useDatabase();

  const [activeSemester, setActiveSemester] = useState(1);
  const [activeSubjectId, setActiveSubjectId] = useState(null);
  const [activePlaylistId, setActivePlaylistId] = useState(null);
  const [videoSearchQuery, setVideoSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 1023 : false));

  // Controls & Engagement states
  const [watchedVideos, setWatchedVideos] = useState(() => new Set());
  const [autoPlay, setAutoPlay] = useState(true);
  const [showSkillChecks, setShowSkillChecks] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('playlist'); // 'playlist' | 'materials' | 'info'
  const [mainTab, setMainTab] = useState('overview'); // 'overview' | 'materials' | 'notes'
  const [mobileTab, setMobileTab] = useState('playlist'); // 'playlist' | 'materials' | 'overview'
  const [collapsedModules, setCollapsedModules] = useState({});

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

  // Flatten all videos across playlists for the active subject
  const allSubjectVideos = useMemo(() => {
    if (!activeSubject || !activeSubject.playlists) return [];
    const vids = [];
    activeSubject.playlists.forEach((p, pIdx) => {
      (p.videos || []).forEach((v, vIdx) => {
        vids.push({
          ...v,
          playlistId: p.id,
          playlistTitle: p.title,
          moduleIndex: pIdx + 1,
          lectureIndex: vIdx + 1
        });
      });
    });
    return vids;
  }, [activeSubject]);

  const activeVideo = useMemo(() => {
    if (activePlaylist?.videos && activePlaylist.videos.length > 0) {
      return activePlaylist.videos[activeVideoIndex] || activePlaylist.videos[0];
    }
    return allSubjectVideos[0] || null;
  }, [activePlaylist, activeVideoIndex, allSubjectVideos]);

  // Specific materials attached to active video
  const activeVideoMaterials = useMemo(() => {
    if (!activeSubject || !activeSubject.materials) return [];
    return activeSubject.materials.filter((m) => m.videoId === activeVideo?.id || m.type === 'notes');
  }, [activeSubject, activeVideo]);

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

  const toggleModuleCollapse = (modId) => {
    setCollapsedModules((prev) => ({
      ...prev,
      [modId]: !prev[modId]
    }));
  };

  const handlePlayVideo = (plId, vIdx, videoId) => {
    setActivePlaylistId(plId);
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

  // Stats calculation
  const totalLecturesCount = allSubjectVideos.length;
  const watchedCount = useMemo(() => {
    return allSubjectVideos.filter((v) => watchedVideos.has(v.id)).length;
  }, [allSubjectVideos, watchedVideos]);

  const progressPercent = totalLecturesCount > 0 ? Math.round((watchedCount / totalLecturesCount) * 100) : 0;

  // Filter playlists by search query
  const filteredPlaylists = useMemo(() => {
    if (!activeSubject || !activeSubject.playlists) return [];
    if (!videoSearchQuery.trim()) return activeSubject.playlists;

    const q = videoSearchQuery.toLowerCase().trim();
    return activeSubject.playlists
      .map((playlist) => {
        const matchingVideos = (playlist.videos || []).filter((v) =>
          v.title.toLowerCase().includes(q)
        );
        if (playlist.title.toLowerCase().includes(q) || matchingVideos.length > 0) {
          return {
            ...playlist,
            videos: matchingVideos.length > 0 ? matchingVideos : playlist.videos
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [activeSubject, videoSearchQuery]);

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
    <div className="animate-fade-in oracle-workspace-container" style={styles.container}>
      {/* ── TOP FLEX ROW: Back (Leftmost) + Purple Semester Dropdown + Subjects Chips (Rightmost) ── */}
      <div className="glass-panel" style={styles.topFlexRow}>
        {/* Leftmost: Back button */}
        <button onClick={() => setCurrentView('learning')} style={styles.backBtn}>
          <ChevronLeft size={15} /> Back
        </button>

        {/* Beside Back: Purple Semester Dropdown */}
        {isDegree && (
          <CustomSemesterDropdown value={activeSemester} onChange={(s) => setActiveSemester(s)} />
        )}

        {/* Rightmost: Subject Chips Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto', overflowX: 'auto' }}>
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
            <div className="yt-subject-chips-row" style={{ margin: 0, gap: '4px' }}>
              {currentSubjects.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubjectId(sub.id)}
                  className={`yt-subject-chip ${activeSubjectId === sub.id ? 'active' : ''}`}
                  style={{ padding: '4px 12px', fontSize: '0.78rem' }}
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
            <PlayCircle size={15} /> Playlist ({allSubjectVideos.length})
          </button>
          <button
            className={`mobile-tab-pill ${mobileTab === 'materials' ? 'active' : ''}`}
            onClick={() => setMobileTab('materials')}
          >
            <FileText size={15} /> Materials ({activeSubjectMaterials?.length || 0})
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
                      Module {activePlaylist?.title ? activePlaylist.title : '1'} · Lecture {(activeVideoIndex || 0) + 1} of {activePlaylist?.videos?.length || allSubjectVideos.length}
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
                    disabled={!activePlaylist?.videos || activeVideoIndex >= activePlaylist.videos.length - 1}
                    title="Next Lecture"
                    style={{ opacity: !activePlaylist?.videos || activeVideoIndex >= activePlaylist.videos.length - 1 ? 0.4 : 1 }}
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

          {/* 3. Playlist Details & Action Tabs Below Player */}
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
                {/* Overview Below Video: Focused strictly on Active Playlist Details */}
                {mainTab === 'overview' && (
                  <div className="tab-pane-content">
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>{activePlaylist.title}</h3>
                    <p className="tab-pane-desc">
                      {activePlaylist.description || `Lecture series playlist for ${activeSubject?.title || 'this subject'}.`}
                    </p>

                    {/* Extra Custom Overview Info from Creator Studio */}
                    {activePlaylist.extraInfo && (
                      <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <strong style={{ color: '#ffffff', display: 'block', marginBottom: '4px' }}>Instructor & Playlist Notes:</strong>
                        {activePlaylist.extraInfo}
                      </div>
                    )}

                    <div className="stats-cards-grid">
                      <div className="stat-card-box">
                        <Clock size={18} color="var(--primary)" />
                        <div>
                          <strong>{activePlaylist.videos?.length || 0} Video Lectures</strong>
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
        {/* RIGHT COLUMN: Playlists Accordion & Course Guides Hub      */}
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

            {/* PLAYLIST TAB CONTENT */}
            {sidebarTab === 'playlist' && (
              <div className="sidebar-tab-pane">
                {/* Search Box */}
                <div className="playlist-search-wrap">
                  <Search size={15} className="search-icon-fixed" />
                  <input
                    type="text"
                    placeholder="Search playlist…"
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

                {/* Collapsible Playlists / Modules Accordion */}
                <div className="playlist-modules-accordion">
                  {filteredPlaylists.length > 0 ? (
                    filteredPlaylists.map((playlist, pIdx) => {
                      const isCollapsed = !!collapsedModules[playlist.id];
                      return (
                        <div key={playlist.id} className="accordion-module-group">
                          <button
                            type="button"
                            className="module-header-toggle"
                            onClick={() => toggleModuleCollapse(playlist.id)}
                          >
                            <span className="module-name-txt">
                              <strong>
                                {pIdx + 1}. {playlist.title}
                              </strong>
                            </span>
                            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                          </button>

                          {!isCollapsed && (
                            <ul className="module-vids-ul">
                              {(playlist.videos || []).map((video, vIdx) => {
                                const isCurrent = activeVideo?.id === video.id || (activePlaylistId === playlist.id && activeVideoIndex === vIdx);
                                const isWatched = watchedVideos.has(video.id);

                                return (
                                  <li key={video.id || vIdx}>
                                    <button
                                      type="button"
                                      className={`video-row-item ${isCurrent ? 'active-playing' : ''}`}
                                      onClick={() => handlePlayVideo(playlist.id, vIdx, video.id)}
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
                              })}
                            </ul>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="empty-playlist-box">
                      <p>No lectures match search.</p>
                    </div>
                  )}
                </div>

                {/* Progress Footer */}
                <div className="sidebar-progress-footer">
                  <div className="dur-summary-row">
                    <span className="dur-lbl">Course Progress</span>
                    <span className="dur-val">
                      {watchedCount} / {totalLecturesCount} Watched
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

            {/* GUIDES TAB: Contains ALL course materials (syllabi, notes, pyqs, organizers) */}
            {sidebarTab === 'materials' && (
              <div className="sidebar-tab-pane">
                <div className="pane-head-info">
                  <h4>Entire Course Guides & PDFs</h4>
                  <p>All Syllabi, Notes, Organizers, and Past Year Papers for this course.</p>
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
                  <p className="empty-txt-notice">No PDF guides uploaded for this course yet.</p>
                )}
              </div>
            )}

            {/* RIGHT SIDEBAR OVERVIEW TAB: Academic Credits & Playlist Owner Info */}
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
                    <span className="val">{activeSubject?.author || course.author || 'University Faculty'}</span>
                  </div>
                  <div className="meta-info-row">
                    <span className="lbl">Department</span>
                    <span className="val">{course.department || 'Engineering'}</span>
                  </div>
                  <div className="meta-info-row">
                    <span className="lbl">Semester</span>
                    <span className="val">Semester {activeSubject?.semester || activeSemester}</span>
                  </div>
                  <div className="meta-info-row">
                    <span className="lbl">Total Videos</span>
                    <span className="val">{allSubjectVideos.length} Lectures</span>
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
    gap: '10px',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box'
  },
  topFlexRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '6px 12px',
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
