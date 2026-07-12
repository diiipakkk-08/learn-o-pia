import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useDatabase } from '../../context/DatabaseContext';
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
  const { courses, subjects, togglePlaylistLike, currentUser } = useDatabase();
  
  const [activeSemester, setActiveSemester] = useState(1);
  const [activeSubjectId, setActiveSubjectId] = useState(null);
  
  const [activeCategory, setActiveCategory] = useState('playlists');
  const [activePlaylistId, setActivePlaylistId] = useState(null);

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
  const activeVideo = activePlaylist?.videos[activeVideoIndex];

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
      <div className="yt-selector-row glass-panel">
        {isDegree && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Semester:</span>
            
            {/* Custom semester dropdown */}
            <CustomSemesterDropdown 
              value={activeSemester} 
              onChange={(s) => setActiveSemester(s)} 
            />
          </div>
        )}

        {/* Subjects selector chips */}
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
      </div>

      {/* Main Content Workspace splits */}
      <div className="workspace-grid">
        
        {/* LEFT COLUMN: Asset Sidebar Menu or Video Chapters List */}
        <div style={styles.sidebarPanel} className="glass-panel">
          {activePlaylist ? (
            /* TRANSITIONED VIEW: Video Chapters List */
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <button onClick={() => setActivePlaylistId(null)} className="yt-sidebar-backbtn">
                <ArrowLeft size={13} />
                Back to Syllabus Assets
              </button>
              
              <div style={styles.sidebarHeader}>
                <List size={14} color="var(--primary)" />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ffffff' }}>Chapters</span>
              </div>

              {activePlaylist.description && (
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0 16px 8px 16px', lineHeight: '1.3' }}>
                  {activePlaylist.description}
                </p>
              )}

              <div className="yt-sidebar-videos">
                {activePlaylist.videos.map((vid, idx) => (
                  <div
                    key={vid.id}
                    onClick={() => setActiveVideoIndex(idx)}
                    className={`yt-sidebar-video-item ${activeVideoIndex === idx ? 'active' : ''}`}
                  >
                    <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>{idx + 1}.</span>
                    <span style={{ textAlign: 'left', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {vid.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* STANDARD VIEW: Playlists + Dynamic Material Sections */
            <div className="yt-sidebar-tabs">
              <button
                onClick={() => setActiveCategory('playlists')}
                className={`yt-sidebar-tab ${activeCategory === 'playlists' ? 'active' : ''}`}
              >
                <Play size={14} />
                Playlists
              </button>
              {(activeSubject?.customMaterialSections || ['Notes', 'Organizer', 'Past Year Papers']).map(section => (
                <button
                  key={section}
                  onClick={() => setActiveCategory(section)}
                  className={`yt-sidebar-tab ${activeCategory === section ? 'active' : ''}`}
                >
                  <FileText size={14} />
                  {section}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CENTER/RIGHT PANEL: Active Workspace */}
        <div style={styles.mainWorkspace}>
          {activeSubject ? (
            activePlaylistId && activeVideo ? (
              /* A. ACTIVE VIDEO CLASSROOM VIEW (Full Width Theatre Layout) */
              <div style={styles.classroomGrid}>
                <div style={styles.playerWrapper} className="glass-panel">
                  <iframe
                    src={getVideoSrc(activeVideo)}
                    title={activeVideo.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={styles.iframe}
                  ></iframe>
                </div>

                <div style={styles.metaBox} className="glass-panel">
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>{activeVideo.title}</h3>
                  {activeVideo.description && (
                    <p style={styles.videoDesc}>{activeVideo.description}</p>
                  )}
                </div>
              </div>
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
                        return (
                          <div key={pl.id} style={styles.playlistCard}>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                <h4 style={{ fontSize: '0.95rem', color: '#ffffff' }}>{pl.title}</h4>
                                <button
                                  onClick={() => togglePlaylistLike(activeSubject.id, pl.id)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: hasLiked ? 'var(--primary)' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    outline: 'none',
                                    padding: '4px 6px',
                                    borderRadius: '4px',
                                    transition: 'color 0.2s'
                                  }}
                                  title="Like this playlist"
                                >
                                  <ThumbsUp size={12} fill={hasLiked ? 'var(--primary)' : 'transparent'} />
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
                                  {pl.videos.length} Lectures inside
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
                              disabled={pl.videos.length === 0}
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
                  const sectionDocs = (activeSubject.materials || []).filter(m => m.sectionName === activeCategory);
                  return sectionDocs.length === 0 ? (
                    <p style={styles.emptyText}>No files uploaded to "{activeCategory}" yet.</p>
                  ) : (
                    <div style={styles.documentList}>
                      {sectionDocs.map(doc => (
                        <div key={doc.id} style={styles.docItem}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FileText size={16} color="#f59e0b" />
                            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                              <span style={{ fontSize: '0.85rem', color: '#ffffff' }}>{doc.title}</span>
                              {doc.author && (
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  Credits: {doc.author}
                                </span>
                              )}
                            </div>
                          </div>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={styles.docBtn}>
                            <Download size={12} />
                            Download
                          </a>
                        </div>
                      ))}
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
