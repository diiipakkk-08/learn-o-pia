import React, { useState, useMemo } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import {
  BookOpen, BookmarkCheck, Play, Download, Copy, Check, Trash2,
  Compass, LogOut, Video, Sparkles, Clock, Layers
} from 'lucide-react';

export default function MyLearningView({ setCurrentView, setSelectedPlaylistId, setSelectedVideoIndex }) {
  const {
    currentUser,
    courses,
    subjects,
    standaloneResources,
    savedResourceIds,
    toggleSaveResource,
    removeUserEnrollment,
    removeUserPlaylistEnrollment,
    deletePlaylist,
    deleteStandaloneResource,
    lastPlayed
  } = useDatabase();

  const [activeSectionTab, setActiveSectionTab] = useState('courses'); // 'courses' | 'playlists' | 'resources'
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (id, e) => {
    if (e) e.preventDefault();
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isAdminOrOwner = currentUser?.role === 'admin' || currentUser?.role === 'owner';

  // SECTION 1: Enrolled Courses
  const enrolledCourseList = useMemo(() => {
    if (!currentUser || !currentUser.enrolledCourses) return [];
    return courses.filter(c => currentUser.enrolledCourses.includes(c.id));
  }, [currentUser, courses]);

  // SECTION 2: Enrolled & User-Created Playlists
  const enrolledPlaylistList = useMemo(() => {
    const list = [];
    const seen = new Set();
    const enrolledIds = currentUser?.enrolledPlaylists || [];
    const currentUserId = currentUser?.id;
    const currentUserName = currentUser?.name;

    (subjects || []).forEach(sub => {
      (sub.playlists || []).forEach(pl => {
        if (!pl.id || seen.has(pl.id)) return;
        
        const isEnrolled = enrolledIds.includes(pl.id);
        const isCreated = (pl.creatorId && pl.creatorId === currentUserId) || (currentUserName && pl.author === currentUserName);

        if (isEnrolled || isCreated) {
          seen.add(pl.id);
          const firstVid = pl.videos && pl.videos[0];
          const yId = pl.youtubePlaylistId || (firstVid?.youtubeId || (firstVid?.url ? (firstVid.url.match(/[?&]v=([^#&]+)/) || [])[1] : ''));
          const thumb = pl.bannerUrl || (yId ? `https://i.ytimg.com/vi/${yId}/hqdefault.jpg` : null);

          list.push({
            id: pl.id,
            title: pl.title,
            description: pl.description || 'Subject lecture series',
            subjectTitle: sub.title,
            courseId: sub.courseId,
            author: pl.author || 'Instructor',
            videoCount: pl.videos?.length || 0,
            thumbnailUrl: thumb,
            isCreated
          });
        }
      });
    });

    return list;
  }, [subjects, currentUser]);

  // SECTION 3: Saved Resources
  const savedDocList = useMemo(() => {
    const list = [];
    const seen = new Set();

    // 1. Standalone
    (standaloneResources || []).forEach(res => {
      if (res.id && savedResourceIds.includes(res.id) && !seen.has(res.id)) {
        seen.add(res.id);
        list.push({
          id: res.id,
          title: res.title,
          url: res.url,
          category: res.category || 'Study Guide',
          description: res.description || '',
          author: res.author || 'Educator',
          isStandalone: true
        });
      }
    });

    // 2. Subject Materials
    (subjects || []).forEach(sub => {
      (sub.materials || []).forEach(mat => {
        const mId = mat.originalResourceId || mat.id;
        if (mId && savedResourceIds.includes(mId) && !seen.has(mId)) {
          seen.add(mId);
          list.push({
            id: mId,
            title: mat.title,
            url: mat.url,
            category: mat.sectionName || 'Subject Material',
            description: `From ${sub.title}`,
            author: mat.author || 'Faculty',
            isStandalone: false
          });
        }
      });
    });

    return list;
  }, [standaloneResources, subjects, savedResourceIds]);

  const handleResumeLastPlayed = () => {
    if (!lastPlayed) return;
    if (setSelectedPlaylistId) {
      setSelectedPlaylistId(lastPlayed.playlistId || lastPlayed.courseId);
    }
    if (setSelectedVideoIndex && lastPlayed.videoIndex !== undefined && lastPlayed.videoIndex !== null) {
      setSelectedVideoIndex(Number(lastPlayed.videoIndex));
    }
    setCurrentView('learning-player');
  };

  const lastVideoThumb = lastPlayed?.videoThumbnail || (lastPlayed?.youtubeId ? `https://i.ytimg.com/vi/${lastPlayed.youtubeId}/hqdefault.jpg` : (lastPlayed?.bannerUrl || null));

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px', textAlign: 'left' }} className="animate-fade-in">

      {/* Header */}
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <h1 style={{ fontSize: '1.3rem', margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }} className="primary-gradient-text">
          <Compass size={22} color="var(--primary)" /> Learn Space
        </h1>
        <button onClick={() => setCurrentView('learning')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.78rem' }}>
          + Explore Curricula & Courses
        </button>
      </div>

      {/* COMPACT PICK UP WHERE YOU LEFT SECTION */}
      <div className="glass-panel" style={{ padding: '12px 16px', borderRadius: '14px', marginBottom: '16px', border: '1px solid rgba(139,92,246,0.3)', background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(17,18,28,0.95) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
          <h2 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={15} color="var(--primary)" /> Pick up where you left
          </h2>
          {lastPlayed && (
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              Last active: {new Date(lastPlayed.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {lastPlayed ? (
          <div
            onClick={handleResumeLastPlayed}
            style={{
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              background: 'rgba(255,255,255,0.03)',
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '220px' }}>
              {/* EXACT VIDEO THUMBNAIL BANNER */}
              <div style={{ width: '96px', height: '58px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, position: 'relative', background: '#000' }}>
                {lastVideoThumb ? (
                  <img src={lastVideoThumb} alt={lastPlayed.videoTitle || 'Last Video'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)' }}>
                    <Play size={20} color="#ffffff" />
                  </div>
                )}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Play size={18} color="#ffffff" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }} />
                </div>
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                  {lastPlayed.playlistTitle || 'Lecture Series'}
                </span>
                <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff', margin: '2px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {lastPlayed.videoTitle || lastPlayed.playlistTitle || 'Resume Video'}
                </h3>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleResumeLastPlayed();
              }}
              className="btn btn-primary btn-sm"
              style={{ fontSize: '0.78rem', padding: '6px 14px', gap: '6px', whiteSpace: 'nowrap' }}
            >
              <Play size={13} /> Resume Video
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '10px 8px', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '0.8rem', margin: '0 0 8px 0', color: 'var(--text-secondary)' }}>
              No active learning session tracked yet. Click on any course or video lecture to resume seamlessly anytime!
            </p>
            <button onClick={() => setCurrentView('learning')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem', padding: '4px 12px' }}>
              Start Exploring Curricula
            </button>
          </div>
        )}
      </div>

      {/* SECTION NAVIGATION TAB PILLS (STRICT SINGLE LINE FOR ALL DEVICES) */}
      <div
        className="glass-panel"
        style={{
          padding: '6px',
          borderRadius: '12px',
          marginBottom: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '6px',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <button
          className={`btn ${activeSectionTab === 'courses' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSectionTab('courses')}
          style={{
            padding: '8px 4px',
            fontSize: 'clamp(0.68rem, 2.2vw, 0.82rem)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            width: '100%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          <BookOpen size={14} style={{ flexShrink: 0 }} />
          <span>Courses ({enrolledCourseList.length})</span>
        </button>

        <button
          className={`btn ${activeSectionTab === 'playlists' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSectionTab('playlists')}
          style={{
            padding: '8px 4px',
            fontSize: 'clamp(0.68rem, 2.2vw, 0.82rem)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            gap: '6px',
            width: '100%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          <Video size={14} style={{ flexShrink: 0 }} />
          <span>Playlists ({enrolledPlaylistList.length})</span>
        </button>

        <button
          className={`btn ${activeSectionTab === 'resources' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSectionTab('resources')}
          style={{
            padding: '8px 4px',
            fontSize: 'clamp(0.68rem, 2.2vw, 0.82rem)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            gap: '6px',
            width: '100%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          <BookmarkCheck size={14} style={{ flexShrink: 0 }} />
          <span>Resources ({savedDocList.length})</span>
        </button>
      </div>

      {/* SECTION 1: MY COURSES */}
      {activeSectionTab === 'courses' && (
        <div style={{ marginBottom: '36px' }} className="animate-fade-in">
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 14px 0', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={18} color="var(--primary)" /> Courses & Degree Programs ({enrolledCourseList.length})
          </h2>

          {enrolledCourseList.length === 0 ? (
            <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', borderRadius: '14px' }}>
              <BookOpen size={36} color="var(--primary)" style={{ opacity: 0.5, marginBottom: '8px' }} />
              <h3 style={{ fontSize: '1rem', color: '#ffffff', margin: '0 0 6px 0' }}>No Enrolled Courses Yet</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 16px auto' }}>
                You haven't enrolled in any degree curricula or courses yet. Browse available programs and click "Enroll Course" to get started!
              </p>
              <button onClick={() => setCurrentView('learning')} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                Browse Degree Curricula
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {enrolledCourseList.map((course) => (
                <div key={course.id} className="glass-panel" style={{ borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ height: '130px', position: 'relative', overflow: 'hidden', background: '#000' }}>
                    <img
                      src={course.bannerUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800&auto=format&fit=crop'}
                      alt={course.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(13,14,24,0.85) 100%)' }} />
                    <span style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '0.68rem', fontWeight: 700, color: '#fff', background: 'rgba(139,92,246,0.85)', padding: '2px 8px', borderRadius: '6px' }}>
                      {course.department}
                    </span>
                  </div>

                  <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', margin: '0 0 4px 0', lineHeight: '1.3' }}>{course.title}</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>{course.description}</p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          if (setSelectedPlaylistId) setSelectedPlaylistId(course.id);
                          setCurrentView('learning-player');
                        }}
                        className="btn btn-primary"
                        style={{ flex: 1, fontSize: '0.82rem', gap: '6px' }}
                      >
                        <Play size={14} /> Open Course
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (typeof removeUserEnrollment === 'function' && currentUser) {
                            removeUserEnrollment(currentUser.id, course.id);
                          }
                        }}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.78rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                        title="Exit Course / Remove from My Learning"
                      >
                        <LogOut size={13} /> Exit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: MY PLAYLISTS */}
      {activeSectionTab === 'playlists' && (
        <div style={{ marginBottom: '36px' }} className="animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <h2 style={{ fontSize: '1.1rem', margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Video size={18} color="var(--secondary)" /> Playlists ({enrolledPlaylistList.length})
            </h2>
            <button onClick={() => setCurrentView('learning')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
              + Add Playlists to My Learnings
            </button>
          </div>

          {enrolledPlaylistList.length === 0 ? (
            <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', borderRadius: '14px' }}>
              <Video size={36} color="var(--secondary)" style={{ opacity: 0.5, marginBottom: '8px' }} />
              <h3 style={{ fontSize: '1rem', color: '#ffffff', margin: '0 0 6px 0' }}>No Enrolled Playlists Yet</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 16px auto' }}>
                Enrolling in a degree course does not automatically add all standalone playlists here. Browse playlists or create your own in Studio, and click <strong>"Add to My Learnings"</strong>!
              </p>
              <button onClick={() => setCurrentView('learning')} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                Explore Available Playlists
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {enrolledPlaylistList.map((pl) => (
                <div key={pl.id} className="glass-panel" style={{ borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(139,92,246,0.3)' }}>
                  <div style={{ height: '130px', background: '#000', position: 'relative', overflow: 'hidden' }}>
                    {pl.thumbnailUrl ? (
                      <img src={pl.thumbnailUrl} alt={pl.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e1b4b 0%, #311b92 100%)' }}>
                        <Play size={36} color="#a78bfa" />
                      </div>
                    )}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.85) 100%)' }} />

                    <span style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.85)', color: '#ffffff', fontSize: '0.68rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Video size={11} /> {pl.videoCount} Videos
                    </span>
                  </div>

                  <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', margin: 0, lineHeight: '1.3' }}>{pl.title}</h4>
                        {pl.isCreated && (
                          <span style={{ fontSize: '0.62rem', background: 'rgba(56,189,248,0.2)', color: '#38bdf8', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                            Created by You
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        Subject: <strong>{pl.subjectTitle}</strong> • Credit: {pl.author}
                      </span>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>{pl.description}</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => {
                            if (setSelectedPlaylistId) setSelectedPlaylistId(pl.id);
                            if (setSelectedVideoIndex) setSelectedVideoIndex(0);
                            setCurrentView('learning-player');
                          }}
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1, fontSize: '0.78rem', gap: '6px' }}
                        >
                          <Play size={13} /> Open Playlist
                        </button>

                        <button
                          onClick={() => removeUserPlaylistEnrollment(currentUser?.id, pl.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                          title="Remove from My Learning"
                        >
                          Remove
                        </button>
                      </div>

                      {isAdminOrOwner && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Admin Action: Are you sure you want to permanently delete playlist "${pl.title}"?`)) {
                              deletePlaylist(pl.id);
                            }
                          }}
                          className="btn btn-danger btn-sm"
                          style={{ width: '100%', fontSize: '0.72rem', padding: '4px', gap: 4 }}
                        >
                          <Trash2 size={12} /> Delete Playlist (Admin)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: MY RESOURCES */}
      {activeSectionTab === 'resources' && (
        <div style={{ marginBottom: '28px' }} className="animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <h2 style={{ fontSize: '1.1rem', margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookmarkCheck size={18} color="#10b981" /> Resources ({savedDocList.length})
            </h2>
            <button onClick={() => setCurrentView('resources')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
              + Search & Save Resources
            </button>
          </div>

          {savedDocList.length === 0 ? (
            <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', borderRadius: '14px' }}>
              <BookmarkCheck size={36} color="var(--primary)" style={{ opacity: 0.5, marginBottom: '8px' }} />
              <h3 style={{ fontSize: '1rem', color: '#ffffff', margin: '0 0 6px 0' }}>No Saved Resources Yet</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 16px auto' }}>
                Whenever you see a useful PDF, formula sheet, or Google Drive resource, click the <strong>"Save Resource"</strong> button so it appears here for instant access anytime!
              </p>
              <button onClick={() => setCurrentView('resources')} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                Explore Public Resources
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
              {savedDocList.map((res) => (
                <div key={res.id} className="glass-panel" style={{ padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', background: 'rgba(139,92,246,0.12)', padding: '2px 8px', borderRadius: '999px' }}>
                        {res.category}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: '6px' }}>
                        <span>ID: <code style={{ color: '#a78bfa' }}>{res.id}</code></span>
                        <button onClick={(e) => handleCopy(res.id, e)} style={{ background: 'none', border: 'none', color: copiedId === res.id ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
                          {copiedId === res.id ? <Check size={10} /> : <Copy size={10} />}
                        </button>
                      </div>
                    </div>

                    <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#ffffff', margin: '0 0 4px 0', lineHeight: '1.4' }}>{res.title}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 4px 0' }}>{res.description}</p>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Credit: {res.author}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <button onClick={() => toggleSaveResource(res.id)} className="btn btn-secondary btn-sm" style={{ color: '#ef4444', fontSize: '0.75rem' }}>
                        Remove
                      </button>

                      <a href={res.url} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ fontSize: '0.75rem', gap: 4 }}>
                        <Download size={13} /> Open File
                      </a>
                    </div>

                    {isAdminOrOwner && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Admin Action: Delete resource "${res.title}"?`)) {
                            deleteStandaloneResource(res.id);
                          }
                        }}
                        className="btn btn-danger btn-sm"
                        style={{ width: '100%', fontSize: '0.72rem', padding: '4px', gap: 4 }}
                      >
                        <Trash2 size={12} /> Delete Resource (Admin)
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
