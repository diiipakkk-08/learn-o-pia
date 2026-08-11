import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useDatabase, extractYoutubePlaylistId, fetchYoutubePlaylistVideos } from '../../context/DatabaseContext';
import { Play, FileText, ChevronLeft, BookOpen, AlertCircle, ArrowLeft, Download, List, ChevronDown, ThumbsUp } from 'lucide-react';

// Portal Dropdown — renders in document.body to escape backdrop-filter ancestors
function SemesterPortalMenu({ triggerRef, menuRef, isOpen, value, onChange, onClose }) {
  const [style, setStyle] = React.useState({});

  React.useEffect(() => {
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
      {[1,2,3,4,5,6,7,8].map(s => (
        <button
          key={s}
          type="button"
          onClick={() => { onChange(s); onClose(); }}
          style={{
            padding: '10px 16px', fontSize: '0.85rem', textAlign: 'left',
            background: value === s ? 'var(--primary)' : 'transparent',
            color: value === s ? '#fff' : 'var(--text-secondary)',
            fontWeight: value === s ? 600 : 400,
            border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
            transition: 'background 0.15s', width: '100%'
          }}
        >
          Semester {s}
        </button>
      ))}
    </div>,
    document.body
  );
}

// Custom Semester Dropdown Component
function CustomSemesterDropdown({ value, onChange }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const triggerRef = React.useRef(null);
  const menuRef = React.useRef(null);

  React.useEffect(() => {
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
      <div ref={triggerRef} className="custom-dropdown-trigger" onClick={() => setIsOpen(o => !o)}>
        <span>Semester {value}</span>
        <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
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
  const { courses, subjects, togglePlaylistLike, toggleVideoLike, currentUser } = useDatabase();
  
  const [activeSemester, setActiveSemester] = useState(1);
  const [activeSubjectId, setActiveSubjectId] = useState(null);
  
  const [activeCategory, setActiveCategory] = useState('playlists');
  const [activePlaylistId, setActivePlaylistId] = useState(null);
  const [videoSearchQuery, setVideoSearchQuery] = useState('');
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const course = courses.find(c => c.id === playlistId);
  const isDegree = course?.isDegree;

  // Filter subjects based on program type
  const currentSubjects = (isDegree 
    ? subjects.filter(s => s.courseId === playlistId && s.semester === activeSemester)
    : subjects.filter(s => s.courseId === playlistId))
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  // Auto select subject when semester, course, or course subjects change
  useEffect(() => {
    if (isDegree) {
      const semSubs = subjects
        .filter(s => s.courseId === playlistId && s.semester === activeSemester)
        .sort((a, b) => (a.position || 0) - (b.position || 0));
      if (semSubs.length > 0) {
        setActiveSubjectId(semSubs[0].id);
        setActivePlaylistId(null);
        setActiveVideoIndex(0);
      } else {
        setActiveSubjectId(null);
        setActivePlaylistId(null);
      }
    } else {
      const courseSubs = subjects
        .filter(s => s.courseId === playlistId)
        .sort((a, b) => (a.position || 0) - (b.position || 0));
      if (courseSubs.length > 0) {
        setActiveSubjectId(courseSubs[0].id);
        setActivePlaylistId(null);
        setActiveVideoIndex(0);
      } else {
        setActiveSubjectId(null);
        setActivePlaylistId(null);
      }
    }
  }, [activeSemester, playlistId, isDegree]);

  // Reset active playlist when switching subjects
  useEffect(() => {
    setActivePlaylistId(null);
    setActiveVideoIndex(0);
  }, [activeSubjectId]);

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

  const activeSubject = currentSubjects.find(s => s.id === activeSubjectId);
  const activePlaylist = activeSubject?.playlists?.find(p => p.id === activePlaylistId);
  const activeVideo = activePlaylist?.videos ? activePlaylist.videos[activeVideoIndex] : null;

  useEffect(() => {
    if (activePlaylist && (!activePlaylist.videos || activePlaylist.videos.length === 0)) {
      const ytPlId = activePlaylist.youtubePlaylistId 
        || extractYoutubePlaylistId(activePlaylist.description) 
        || extractYoutubePlaylistId(activePlaylist.title);

      if (ytPlId) {
        fetchYoutubePlaylistVideos(ytPlId).then(fetched => {
          if (fetched && fetched.length > 0) {
            activePlaylist.videos = fetched;
            setActiveVideoIndex(0);
          }
        });
      }
    }
  }, [activePlaylistId, activePlaylist]);

  const filteredVideos = activePlaylist
    ? (activePlaylist.videos || []).filter(v => 
        v.title.toLowerCase().includes(videoSearchQuery.toLowerCase()) || 
        v.description?.toLowerCase().includes(videoSearchQuery.toLowerCase())
      )
    : [];

  const getVideoSrc = (video) => {
    if (!video) return '';
    if (video.youtubeId.startsWith('http') || video.youtubeId.includes('embed/')) {
      return video.youtubeId;
    }
    return `https://www.youtube.com/embed/${video.youtubeId}?rel=0&modestbranding=1&autoplay=1`;
  };

  const handleSelectPlaylist = (plId) => {
    setActivePlaylistId(plId);
    setActiveVideoIndex(0);
  };

  return (
    <div className="animate-fade-in" style={styles.container}>
      
      {/* Top Header Row */}
      <div style={styles.header}>
        <button onClick={() => setCurrentView('learning')} style={styles.backBtn}>
          <ChevronLeft size={16} />
          Back to Programs
        </button>
        <div style={styles.headerTitleContainer}>
          <h2 style={{ fontSize: '1.4rem' }}>{course.title}</h2>
        </div>
      </div>

      {/* Top Bar Selectors: Custom Semester Dropdown + Subject Chips */}
      <div className="yt-selector-row glass-panel" style={{ flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? '12px' : '16px' }}>
        {isDegree && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Semester:</span>
            
            {/* Custom semester dropdown */}
            <CustomSemesterDropdown 
              value={activeSemester} 
              onChange={(s) => setActiveSemester(s)} 
            />
          </div>
        )}

        {isMobile ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>Subject:</span>
            <select
              value={activeSubjectId || ''}
              onChange={(e) => setActiveSubjectId(e.target.value || null)}
              className="yt-select-dropdown"
              style={{ width: '100%', maxWidth: '240px' }}
            >
              {currentSubjects.length === 0 ? (
                <option value="" style={{ background: '#11121c', color: '#fff' }}>No subjects</option>
              ) : (
                currentSubjects.map(sub => (
                  <option key={sub.id} value={sub.id} style={{ background: '#11121c', color: '#fff' }}>{sub.title}</option>
                ))
              )}
            </select>
          </div>
        ) : (
          /* Subjects selector chips */
          <div className="yt-subject-chips-row">
            {currentSubjects.length === 0 ? (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '10px' }}>
                {isDegree ? `No subjects added for Semester ${activeSemester}` : 'No subjects added for this course'}
              </span>
            ) : (
              currentSubjects.map(sub => (
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

      {/* Main Content Workspace splits */}
      <div 
        className="custom-workspace-layout" 
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '16px' : '24px',
          alignItems: 'stretch',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        
        {/* LEFT COLUMN: Asset Sidebar Menu (Desktop Only) */}
        {!isMobile && (
          <div style={{ ...styles.sidebarPanel, width: '260px', flexShrink: 0 }} className="glass-panel">
            <div className="yt-sidebar-tabs">
              <button
                onClick={() => { setActiveCategory('playlists'); setActivePlaylistId(null); }}
                className={`yt-sidebar-tab ${activeCategory === 'playlists' ? 'active' : ''}`}
              >
                <Play size={14} />
                Video Playlists
              </button>

              <button
                onClick={() => { setActiveCategory('all-materials'); setActivePlaylistId(null); }}
                className={`yt-sidebar-tab ${activeCategory === 'all-materials' ? 'active' : ''}`}
              >
                <FileText size={14} color="#f59e0b" />
                All Materials & PDFs
              </button>

              {(activeSubject?.customMaterialSections || ['Syllabus', 'Notes', 'Organizer', 'Past Year Papers']).map(section => (
                <button
                  key={section}
                  onClick={() => { setActiveCategory(section); setActivePlaylistId(null); }}
                  className={`yt-sidebar-tab ${activeCategory === section ? 'active' : ''}`}
                >
                  <FileText size={14} />
                  {section}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CENTER/RIGHT PANEL: Active Workspace (Takes full width on mobile stack) */}
        <div style={{ ...styles.mainWorkspace, flex: 1, minWidth: 0, width: '100%' }}>
          {activeSubject ? (
            (activePlaylistId && activePlaylist) ? (
              /* A. ACTIVE VIDEO / PLAYLIST CLASSROOM VIEW (Full Width Theatre Layout) */
              (() => {
                const ytPlId = activePlaylist.youtubePlaylistId 
                  || extractYoutubePlaylistId(activePlaylist.description) 
                  || extractYoutubePlaylistId(activePlaylist.title);

                const isEmbedMode = Boolean(ytPlId) && (!activePlaylist.videos || activePlaylist.videos.length === 0 || !activeVideo);

                if (!activeVideo && !ytPlId) {
                  return (
                    <div style={{ textAlign: 'center', padding: '60px 20px' }} className="glass-panel">
                      <BookOpen size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
                      <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '8px' }}>{activePlaylist.title}</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '400px', margin: '0 auto 20px auto' }}>
                        {activePlaylist.description || 'No videos or YouTube playlist links have been added to this section yet.'}
                      </p>
                      <button onClick={() => setActivePlaylistId(null)} className="btn btn-primary">
                        Back to Syllabus Assets
                      </button>
                    </div>
                  );
                }

                const currentTitle = isEmbedMode ? activePlaylist.title : activeVideo?.title;
                const currentDesc = isEmbedMode ? activePlaylist.description : activeVideo?.description;
                const currentSrc = isEmbedMode 
                  ? `https://www.youtube.com/embed/videoseries?list=${ytPlId}&rel=0&modestbranding=1`
                  : getVideoSrc(activeVideo);

                return (
                  <div className="classroom-grid animate-fade-in" style={{ textAlign: 'left' }}>
                    {/* LEFT COLUMN: Video Theatre Stage & Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <button 
                        onClick={() => setActivePlaylistId(null)} 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          padding: 0,
                          width: 'fit-content'
                        }}
                      >
                        <ArrowLeft size={14} />
                        Back to Syllabus Assets
                      </button>

                      <div style={styles.playerWrapper} className="glass-panel">
                        <iframe
                          src={currentSrc}
                          title={currentTitle || 'Video Player'}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={styles.iframe}
                        ></iframe>
                      </div>

                      {/* Video Title & Navigation Row */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '16px',
                        flexWrap: 'wrap',
                        marginTop: '4px'
                      }}>
                        <div>
                          <h3 style={{ fontSize: '1.3rem', color: '#ffffff', margin: 0, fontWeight: 700 }}>
                            {currentTitle}
                          </h3>
                          {activePlaylist.videos && activePlaylist.videos.length > 0 && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '4px', display: 'inline-block', fontWeight: 600 }}>
                              Lecture {activeVideoIndex + 1} of {activePlaylist.videos.length}
                            </span>
                          )}
                        </div>

                        {activePlaylist.videos && activePlaylist.videos.length > 1 && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              disabled={activeVideoIndex === 0}
                              onClick={() => {
                                setActiveVideoIndex(idx => Math.max(0, idx - 1));
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '8px 14px', fontSize: '0.82rem', opacity: activeVideoIndex === 0 ? 0.4 : 1, cursor: activeVideoIndex === 0 ? 'not-allowed' : 'pointer' }}
                            >
                              ◄ Previous
                            </button>
                            <button
                              disabled={activeVideoIndex === activePlaylist.videos.length - 1}
                              onClick={() => {
                                setActiveVideoIndex(idx => Math.min(activePlaylist.videos.length - 1, idx + 1));
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="btn btn-primary"
                              style={{ padding: '8px 14px', fontSize: '0.82rem', opacity: activeVideoIndex === activePlaylist.videos.length - 1 ? 0.4 : 1, cursor: activeVideoIndex === activePlaylist.videos.length - 1 ? 'not-allowed' : 'pointer' }}
                            >
                              Next ►
                            </button>
                          </div>
                        )}
                      </div>

                      {currentDesc && (
                        <p style={{
                          fontSize: '0.88rem',
                          color: 'var(--text-secondary)',
                          lineHeight: '1.5',
                          margin: '4px 0 12px 0',
                          background: 'rgba(255,255,255,0.02)',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          borderLeft: '3px solid var(--primary)'
                        }}>
                          {currentDesc}
                        </p>
                      )}
                    </div>

                    {/* RIGHT COLUMN: Dedicated Scrollable Playlist Queue Sidebar */}
                    {activePlaylist.videos && activePlaylist.videos.length > 0 && (
                      <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', borderRadius: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={{ fontSize: '1rem', color: '#ffffff', margin: 0, fontWeight: 700 }}>
                            Playlist Queue ({activePlaylist.videos.length})
                          </h4>
                        </div>

                        <input
                          type="text"
                          placeholder="Filter videos in playlist..."
                          value={videoSearchQuery}
                          onChange={(e) => setVideoSearchQuery(e.target.value)}
                          className="form-input"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            fontSize: '0.8rem',
                            borderRadius: '8px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.08)'
                          }}
                        />

                        <div className="custom-playlist-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {filteredVideos.length === 0 ? (
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '12px 0' }}>No lectures match your search.</p>
                          ) : (
                            filteredVideos.map((vid) => {
                              const originalIndex = activePlaylist.videos.findIndex(v => v.id === vid.id);
                              const isActive = activeVideoIndex === originalIndex;
                              return (
                                <div
                                  key={vid.id}
                                  onClick={() => {
                                    setActiveVideoIndex(originalIndex);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                  className={`lecture-item-hover ${isActive ? 'active-lecture-item' : ''}`}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '10px 12px',
                                    background: isActive ? 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(168,85,247,0.15) 100%)' : 'rgba(255,255,255,0.02)',
                                    border: isActive ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.04)',
                                    borderRadius: '10px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <span style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    color: isActive ? '#ffffff' : 'var(--text-muted)',
                                    background: isActive ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                                    minWidth: '22px',
                                    height: '22px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    {originalIndex + 1}
                                  </span>

                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
                                    <span style={{
                                      fontSize: '0.83rem',
                                      color: isActive ? '#ffffff' : 'var(--text-secondary)',
                                      fontWeight: isActive ? 700 : 500,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}>
                                      {vid.title}
                                    </span>
                                  </div>

                                  {isActive && (
                                    <span style={{
                                      fontSize: '0.65rem',
                                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                      color: '#ffffff',
                                      padding: '2px 8px',
                                      borderRadius: '12px',
                                      fontWeight: 700,
                                      letterSpacing: '0.04em'
                                    }}>
                                      PLAYING
                                    </span>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              /* B. LIST VIEWS FOR SELECTED CATEGORY */
              <div className="glass-panel" style={styles.assetListPanel}>
                <h3 style={styles.assetListHeading}>
                  {activeCategory === 'playlists' ? 'Educator Suggested Playlists' : activeCategory}
                </h3>
                
                {/* 1. Render Playlists */}
                {activeCategory === 'playlists' && (
                  (!activeSubject.playlists || activeSubject.playlists.length === 0) ? (
                    <p style={styles.emptyText}>No playlists created yet.</p>
                  ) : (
                    <div style={styles.playlistsListGrid}>
                      {activeSubject.playlists.map(pl => {
                        const hasLiked = pl.likes?.includes(currentUser?.id);
                        const ytPlId = pl.youtubePlaylistId || extractYoutubePlaylistId(pl.description) || extractYoutubePlaylistId(pl.title);
                        return (
                          <div key={pl.id} style={styles.playlistCard}>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                <h4 style={{ fontSize: '0.95rem', color: '#ffffff' }}>{pl.title}</h4>
                                <button
                                  onClick={() => togglePlaylistLike(activeSubject.id, pl.id)}
                                  style={{
                                    background: hasLiked ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.03)',
                                    border: hasLiked ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(255,255,255,0.08)',
                                    color: hasLiked ? 'var(--primary)' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    outline: 'none',
                                    padding: '6px 10px',
                                    borderRadius: '8px',
                                    transition: 'all 0.2s',
                                    whiteSpace: 'nowrap'
                                  }}
                                  title="Like this playlist"
                                >
                                  <ThumbsUp size={14} fill={hasLiked ? 'var(--primary)' : 'transparent'} />
                                  <span>{pl.likes?.length || 0}</span>
                                </button>
                              </div>
                              {pl.description && (
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 8px 0', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {pl.description}
                                </p>
                              )}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '6px' }}>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  {ytPlId ? '▶ Full YouTube Playlist Embed' : `${pl.videos?.length || 0} Lectures inside`}
                                </span>
                                {pl.author && (
                                  <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 500 }}>
                                    By: {pl.author}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button 
                              onClick={() => handleSelectPlaylist(pl.id)} 
                              className="btn btn-primary"
                              style={{ padding: '6px 12px', fontSize: '0.75rem', marginTop: '12px' }}
                            >
                              <Play size={10} fill="#ffffff" />
                              <span>Start Lessons</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}

                {/* Dynamic section documents rendering */}
                {activeCategory !== 'playlists' && (() => {
                  const allDocs = activeSubject.materials || [];
                  const sectionDocs = allDocs.filter(doc => {
                    const matchesCategory = activeCategory === 'all-materials' ||
                      (doc.sectionName && doc.sectionName.toLowerCase() === activeCategory.toLowerCase()) ||
                      (doc.type && doc.type.toLowerCase() === activeCategory.toLowerCase());

                    const matchesQuery = !materialSearchQuery.trim() ||
                      doc.title.toLowerCase().includes(materialSearchQuery.toLowerCase()) ||
                      (doc.sectionName && doc.sectionName.toLowerCase().includes(materialSearchQuery.toLowerCase())) ||
                      (doc.author && doc.author.toLowerCase().includes(materialSearchQuery.toLowerCase()));

                    return matchesCategory && matchesQuery;
                  });

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* Search Bar for Documents */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <h4 style={{ fontSize: '1.05rem', color: '#ffffff', margin: 0, fontWeight: 700 }}>
                          {activeCategory === 'all-materials' ? 'All Study Materials & PDFs' : activeCategory} ({sectionDocs.length})
                        </h4>
                        
                        <input
                          type="text"
                          placeholder="Search syllabus, notes, PDFs..."
                          value={materialSearchQuery}
                          onChange={(e) => setMaterialSearchQuery(e.target.value)}
                          className="form-input"
                          style={{
                            maxWidth: '300px',
                            width: '100%',
                            padding: '8px 14px',
                            fontSize: '0.82rem',
                            borderRadius: '8px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.08)'
                          }}
                        />
                      </div>

                      {sectionDocs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px border-dashed rgba(255,255,255,0.08)' }}>
                          <FileText size={36} color="var(--text-muted)" style={{ marginBottom: '10px' }} />
                          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                            No files found for "{activeCategory === 'all-materials' ? 'Study Materials' : activeCategory}".
                          </p>
                          {materialSearchQuery && (
                            <button onClick={() => setMaterialSearchQuery('')} className="btn btn-secondary" style={{ marginTop: '10px', fontSize: '0.78rem' }}>
                              Clear Search Filter
                            </button>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                          {sectionDocs.map(doc => (
                            <div
                              key={doc.id}
                              style={{
                                padding: '16px',
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                gap: '12px',
                                transition: 'all 0.2s'
                              }}
                              className="lecture-item-hover"
                            >
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                <div style={{
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  borderRadius: '10px',
                                  padding: '10px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  <FileText size={22} color="#ef4444" />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left', minWidth: 0, flex: 1 }}>
                                  <span style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 600, lineHeight: '1.3' }}>
                                    {doc.title}
                                  </span>
                                  
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                                    <span style={{
                                      fontSize: '0.68rem',
                                      background: 'rgba(139,92,246,0.15)',
                                      color: 'var(--primary)',
                                      padding: '2px 8px',
                                      borderRadius: '10px',
                                      fontWeight: 600
                                    }}>
                                      {doc.sectionName || 'Study Material'}
                                    </span>
                                    {doc.author && (
                                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                        By: {doc.author}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-secondary"
                                  style={{ flex: 1, padding: '8px 12px', fontSize: '0.78rem', justifyContent: 'center' }}
                                >
                                  View / Open
                                </a>
                                <a
                                  href={doc.url}
                                  download
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-primary"
                                  style={{ padding: '8px 12px', fontSize: '0.78rem', justifyContent: 'center' }}
                                >
                                  <Download size={14} />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

              </div>
            )
          ) : (
            <div style={styles.selectSubjectFallback} className="glass-panel">
              <BookOpen size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
              <h3>Select a Subject</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px', maxWidth: '300px' }}>
                Pick a subject from the top bar chips row to open play records, files, organisers, and previous exams.
              </p>
            </div>
          )}
        </div>

        {/* 3. On mobile, render selector dropdown below list content when playlist is not active */}
        {isMobile && !activePlaylist && activeSubject && (
          <div style={{ ...styles.sidebarPanel, width: '100%', marginTop: '8px' }} className="glass-panel">
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Section / Category:</label>
              <select
                value={activeCategory}
                onChange={(e) => { setActiveCategory(e.target.value); setActivePlaylistId(null); }}
                className="yt-select-dropdown"
                style={{ width: '100%' }}
              >
                <option value="playlists" style={{ background: '#11121c', color: '#fff' }}>Video Playlists</option>
                <option value="all-materials" style={{ background: '#11121c', color: '#fff' }}>All Materials & PDFs</option>
                {(activeSubject?.customMaterialSections || ['Syllabus', 'Notes', 'Organizer', 'Past Year Papers']).map(section => (
                  <option key={section} value={section} style={{ background: '#11121c', color: '#fff' }}>{section}</option>
                ))}
              </select>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '12px',
    textAlign: 'left'
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'var(--text-secondary)',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontFamily: 'var(--font-heading)',
    transition: 'all 0.2s'
  },
  headerTitleContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  workspaceGrid: {
    display: 'grid',
    gridTemplateColumns: '260px 1fr',
    gap: '24px',
    alignItems: 'stretch',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr'
    }
  },
  sidebarPanel: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    height: 'fit-content'
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.01)',
    textAlign: 'left'
  },
  mainWorkspace: {
    display: 'flex',
    flexDirection: 'column'
  },
  selectSubjectFallback: {
    padding: '100px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center'
  },
  classroomGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  playerWrapper: {
    position: 'relative',
    paddingBottom: '56.25%',
    height: 0,
    overflow: 'hidden',
    borderRadius: '16px'
  },
  iframe: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderRadius: '16px'
  },
  metaBox: {
    padding: '20px',
    textAlign: 'left'
  },
  videoDesc: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5'
  },
  assetListPanel: {
    padding: '24px',
    textAlign: 'left',
    minHeight: '360px'
  },
  assetListHeading: {
    fontSize: '1.1rem',
    marginBottom: '20px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: '8px'
  },
  playlistsListGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '16px'
  },
  playlistCard: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '10px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '140px'
  },
  documentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  docItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.01)',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: '8px',
    gap: '10px'
  },
  docBtn: {
    padding: '6px 12px',
    fontSize: '0.75rem',
    gap: '4px',
    borderRadius: '6px',
    flexShrink: 0
  }
};
