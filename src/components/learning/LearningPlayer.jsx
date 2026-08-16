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
  Star,
  Heart,
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
  MessageSquare
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
        width: Math.max(r.width, 160),
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
            padding: '10px 16px',
            fontSize: '0.85rem',
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
      <div ref={triggerRef} className="custom-dropdown-trigger" onClick={() => setIsOpen((o) => !o)}>
        <span>Semester {value}</span>
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
  const { courses, subjects, currentUser } = useDatabase();

  const [activeSemester, setActiveSemester] = useState(1);
  const [activeSubjectId, setActiveSubjectId] = useState(null);
  const [activePlaylistId, setActivePlaylistId] = useState(null);
  const [videoSearchQuery, setVideoSearchQuery] = useState('');
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 1023 : false));

  // Controls & Engagement states
  const [watchedVideos, setWatchedVideos] = useState(() => new Set());
  const [autoPlay, setAutoPlay] = useState(true);
  const [showSkillChecks, setShowSkillChecks] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('playlist'); // 'playlist' | 'materials' | 'info'
  const [mainTab, setMainTab] = useState('overview'); // 'overview' | 'materials' | 'notes'
  const [mobileTab, setMobileTab] = useState('playlist'); // 'playlist' | 'materials' | 'overview'
  const [collapsedModules, setCollapsedModules] = useState({});

  const [isFavorited, setIsFavorited] = useState(false);
  const [userRating, setUserRating] = useState(0);
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

  // Auto select subject when semester, course, or subjects change
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
      {/* ── Top Header Row ── */}
      <div style={styles.header}>
        <button onClick={() => setCurrentView('learning')} style={styles.backBtn}>
          <ChevronLeft size={16} />
          Back to Programs
        </button>
        <div style={styles.headerTitleContainer}>
          <h2 style={{ fontSize: '1.4rem' }}>{course.title}</h2>
        </div>
      </div>

      {/* ── Top Bar Selectors: Semester Dropdown + Subject Selector ── */}
      <div className="yt-selector-row glass-panel" style={styles.toolbarRow}>
        {isDegree && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Semester:</span>
            <CustomSemesterDropdown value={activeSemester} onChange={(s) => setActiveSemester(s)} />
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, overflowX: 'auto' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>Subject:</span>
          {isMobile ? (
            <select
              value={activeSubjectId || ''}
              onChange={(e) => setActiveSubjectId(e.target.value || null)}
              className="yt-select-dropdown"
              style={{ width: '100%' }}
            >
              {currentSubjects.length === 0 ? (
                <option value="">No subjects</option>
              ) : (
                currentSubjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code || ''} {sub.title}
                  </option>
                ))
              )}
            </select>
          ) : (
            <div className="yt-subject-chips-row">
              {currentSubjects.length === 0 ? (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {isDegree ? `No subjects added for Semester ${activeSemester}` : 'No subjects added for this course'}
                </span>
              ) : (
                currentSubjects.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setActiveSubjectId(sub.id)}
                    className={`yt-subject-chip ${activeSubjectId === sub.id ? 'active' : ''}`}
                  >
                    {sub.title}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile View Tabs Selector (< 1024px) ── */}
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

      {/* ── MAIN ORACLE-STYLE WORKSPACE GRID ── */}
      <div className="oracle-learning-grid">
        {/* ========================================================= */}
        {/* LEFT COLUMN: Main Video Player & Details Hub             */}
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

            {/* 2. Oracle-Style "Now Playing" Status Bar */}
            {activeVideo && (
              <div className="oracle-now-playing-bar">
                <div className="now-playing-left">
                  <span className="now-playing-pill">Now Playing</span>
                  <div className="now-playing-text">
                    <h3 className="now-playing-h">{activeVideo.title}</h3>
                    <span className="now-playing-sub">
                      Module {activePlaylist?.title ? activePlaylist.title : '1'} · Lecture {(activeVideoIndex || 0) + 1} of {activePlaylist?.videos?.length || allSubjectVideos.length}
                    </span>
                  </div>
                </div>

                <div className="now-playing-right">
                  {/* Rating Stars */}
                  <div className="star-rating-row" title="Rate this video">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`star-btn-icon ${userRating >= star ? 'filled' : ''}`}
                        onClick={() => setUserRating(star)}
                      >
                        <Star size={16} />
                      </button>
                    ))}
                  </div>

                  {/* Favorite Toggle */}
                  <button
                    type="button"
                    className={`circle-action-btn ${isFavorited ? 'active' : ''}`}
                    onClick={() => setIsFavorited(!isFavorited)}
                    title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} />
                  </button>

                  {/* Share Link */}
                  <button
                    type="button"
                    className="circle-action-btn"
                    onClick={handleShare}
                    title="Share lecture link"
                  >
                    {shareCopied ? <Check size={18} style={{ color: 'var(--success)' }} /> : <Share2 size={18} />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Subject Metadata Card & Action Tabs */}
          {activeSubject && (
            <div className="subject-meta-hub glass-panel">
              <div className="subject-meta-top">
                <span className="code-badge">
                  {activeSubject.code || 'SUB-101'} · {activeSubject.credits || 4} Credits · Semester {activeSubject.semester || activeSemester}
                </span>
                <h1 className="subject-title-h">{activeSubject.title}</h1>
              </div>

              {/* Action Buttons Row */}
              <div className="action-tabs-bar">
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
                    <h3>About this Subject</h3>
                    <p className="tab-pane-desc">
                      Master key principles, theoretical frameworks, and practical applications in{' '}
                      <strong>{activeSubject.title}</strong>. Mapped strictly to university guidelines with verified video playlists, lecture series, and course material.
                    </p>

                    <div className="stats-cards-grid">
                      <div className="stat-card-box">
                        <Clock size={20} color="var(--primary)" />
                        <div>
                          <strong>{allSubjectVideos.length} Lectures</strong>
                          <span>{activeSubject.playlists?.length || 0} Modules</span>
                        </div>
                      </div>

                      <div className="stat-card-box">
                        <GraduationCap size={20} color="var(--primary)" />
                        <div>
                          <strong>{activeSubject.credits || 4} Academic Credits</strong>
                          <span>Semester {activeSubject.semester || activeSemester}</span>
                        </div>
                      </div>

                      <div className="stat-card-box">
                        <Sparkles size={20} color="var(--primary)" />
                        <div>
                          <strong>{activeSubject.materials?.length || 0} PDF Materials</strong>
                          <span>Syllabi, Notes & PYQs</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {mainTab === 'materials' && (
                  <div className="tab-pane-content">
                    <h3>Subject Study Materials & PDFs</h3>
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
                    <h3>My Study Notes</h3>
                    <p className="tab-pane-desc">
                      Take personal study notes while watching <strong>{activeVideo?.title || 'this lecture'}</strong>. Your notes are stored locally in your browser.
                    </p>

                    <div className="notes-box-wrap">
                      <textarea
                        className="form-input notes-textarea-field"
                        rows={5}
                        placeholder="Write study notes, key formulas, or questions here..."
                        value={currentNoteText}
                        onChange={(e) => setCurrentNoteText(e.target.value)}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                        <button className="btn btn-primary" onClick={handleSaveNote}>
                          Save Lecture Notes
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
        {/* RIGHT COLUMN: Oracle-Style Playlist & Content Sidebar    */}
        {/* ========================================================= */}
        <div className={`oracle-sidebar-col ${isMobile && mobileTab !== 'playlist' && mobileTab !== 'materials' ? 'mobile-hidden' : ''}`}>
          <div className="oracle-sidebar-card glass-panel">
            {/* 1. Sidebar Top Header Navigation Tabs */}
            <div className="sidebar-top-tabs">
              <button
                className={`sidebar-top-tab ${sidebarTab === 'playlist' ? 'active' : ''}`}
                onClick={() => setSidebarTab('playlist')}
              >
                <PlayCircle size={15} /> Playlist
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

            {/* 2. PLAYLIST TAB CONTENT */}
            {sidebarTab === 'playlist' && (
              <div className="sidebar-tab-pane">
                {/* Search Playlist Field */}
                <div className="playlist-search-wrap">
                  <Search size={16} className="search-icon-fixed" />
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

                {/* Filter & Control Toggles Bar (matching Oracle layout) */}
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

                {/* Accordion / Collapsible Playlist Sections */}
                <div className="playlist-modules-accordion">
                  {filteredPlaylists.length > 0 ? (
                    filteredPlaylists.map((playlist, pIdx) => {
                      const isCollapsed = !!collapsedModules[playlist.id];
                      return (
                        <div key={playlist.id} className="accordion-module-group">
                          {/* Module Accordion Header */}
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
                            {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                          </button>

                          {/* Module Video List */}
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
                                      {/* Status Circle Indicator */}
                                      <span className="video-circle-status">
                                        {isCurrent ? (
                                          <PlayCircle size={18} className="ic-playing-glow" />
                                        ) : isWatched && showSkillChecks ? (
                                          <CheckCircle2 size={18} className="ic-watched-green" />
                                        ) : (
                                          <Circle size={18} className="ic-unplayed-ring" />
                                        )}
                                      </span>

                                      {/* Video Details */}
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
                      <p>No lectures match your playlist search.</p>
                    </div>
                  )}
                </div>

                {/* Sidebar Footer: Duration & Completion Progress */}
                <div className="sidebar-progress-footer">
                  <div className="dur-summary-row">
                    <span className="dur-lbl">Course Duration</span>
                    <span className="dur-val">
                      {totalLecturesCount * 8}m ({totalLecturesCount} Lectures)
                    </span>
                  </div>

                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill-bar" style={{ width: `${progressPercent}%` }} />
                  </div>

                  <div className="progress-text-sub">
                    <span>
                      {watchedCount} of {totalLecturesCount} completed
                    </span>
                    <span>{progressPercent}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. MATERIALS / GUIDES TAB */}
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

            {/* 4. OVERVIEW TAB */}
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
                    <span className="lbl">Playlists</span>
                    <span className="val">{activeSubject?.playlists?.length || 0} Series</span>
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
    gap: '16px'
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '10px',
    textAlign: 'left'
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'var(--text-secondary)',
    padding: '6px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontFamily: 'var(--font-heading)',
    transition: 'all 0.2s'
  },
  headerTitleContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  toolbarRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '12px 18px',
    borderRadius: '14px',
    flexWrap: 'wrap'
  },
  playerWrapper: {
    position: 'relative',
    paddingBottom: '56.25%',
    height: 0,
    overflow: 'hidden',
    borderRadius: '16px 16px 0 0'
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
