import React, { useState, useMemo } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Search, BookOpen, CheckCircle2, FileText, Download, Sparkles, Copy, Check, Heart, Filter, UserCheck, Play, Plus, X } from 'lucide-react';

export default function CoursesDashboard({ setSelectedPlaylistId, setCurrentView }) {
  const { courses, subjects, currentUser, enrollInCourse, toggleCourseLike, globalSearchQuery, setGlobalSearchQuery } = useDatabase();
  const [localSearch, setLocalSearch] = useState(globalSearchQuery || '');
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'liked' | 'alphabetical'
  const [enrollNotice, setEnrollNotice] = useState(null);
  const [copiedPlId, setCopiedPlId] = useState(null);
  const [viewTab, setViewTab] = useState('all'); // 'all' | 'courses' | 'playlists'

  const handleCopyPlId = (id, e) => {
    if (e) e.stopPropagation();
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedPlId(id);
    setTimeout(() => setCopiedPlId(null), 2000);
  };

  const query = (localSearch || '').trim().toLowerCase();

  // Filtered & Sorted Courses
  const processedCourses = useMemo(() => {
    let list = courses.filter(c => 
      c.title.toLowerCase().includes(query) ||
      c.id.toLowerCase().includes(query) ||
      c.department.toLowerCase().includes(query) ||
      (c.description && c.description.toLowerCase().includes(query))
    );

    if (sortBy === 'liked') {
      list = [...list].sort((a, b) => ((b.likes?.length || 0) - (a.likes?.length || 0)));
    } else if (sortBy === 'alphabetical') {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }, [courses, query, sortBy]);

  // Compiled & Filtered Standalone & Subject Playlists
  const processedPlaylists = useMemo(() => {
    const list = [];
    const seen = new Set();
    (subjects || []).forEach((sub) => {
      (sub.playlists || []).forEach((pl) => {
        if (!pl.id || seen.has(pl.id)) return;
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
          thumbnailUrl: thumb
        });
      });
    });

    return list.filter((pl) => {
      if (!query) return true;
      return (
        pl.title.toLowerCase().includes(query) ||
        pl.id.toLowerCase().includes(query) ||
        pl.subjectTitle.toLowerCase().includes(query) ||
        pl.author.toLowerCase().includes(query)
      );
    });
  }, [subjects, query]);

  const handleEnrollAction = (course, e) => {
    if (e) e.stopPropagation();
    if (!currentUser) {
      setCurrentView('auth');
      return;
    }
    const isEnrolled = currentUser?.enrolledCourses?.includes(course.id);
    if (!isEnrolled) {
      enrollInCourse(course.id);
      setEnrollNotice(`Enrolled in "${course.title}"! Added to My Learning.`);
      setTimeout(() => setEnrollNotice(null), 3000);
    } else {
      if (setSelectedPlaylistId) setSelectedPlaylistId(course.id);
      setCurrentView('learning-player');
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      
      {/* Top Search Bar for Curricula & Playlists */}
      <div className="glass-panel" style={{ padding: '14px 18px', borderRadius: '14px', marginBottom: '14px' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search degree programs, courses, or playlist IDs (e.g. pl-101, physics)..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: '42px', paddingRight: '36px', height: '42px', fontSize: '0.88rem', borderRadius: '10px', boxSizing: 'border-box' }}
          />
          {localSearch && (
            <button
              onClick={() => setLocalSearch('')}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Header Control Bar & Section Switch Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
          <button
            className={`btn ${viewTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewTab('all')}
            style={{ padding: '6px 14px', fontSize: '0.78rem', borderRadius: '20px' }}
          >
            <Layers size={13} /> All ({processedCourses.length + processedPlaylists.length})
          </button>
          <button
            className={`btn ${viewTab === 'courses' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewTab('courses')}
            style={{ padding: '6px 14px', fontSize: '0.78rem', borderRadius: '20px' }}
          >
            <BookOpen size={13} /> Courses & Programs ({processedCourses.length})
          </button>
          <button
            className={`btn ${viewTab === 'playlists' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewTab('playlists')}
            style={{ padding: '6px 14px', fontSize: '0.78rem', borderRadius: '20px' }}
          >
            <Video size={13} /> Standalone & Subject Playlists ({processedPlaylists.length})
          </button>
        </div>

        {/* Sorting Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Filter size={13} color="var(--primary)" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '0.78rem', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
          >
            <option value="recent" style={{ background: '#11121c' }}>Recently Added</option>
            <option value="liked" style={{ background: '#11121c' }}>Most Liked</option>
            <option value="alphabetical" style={{ background: '#11121c' }}>Alphabetical (A - Z)</option>
          </select>
        </div>
      </div>

      {enrollNotice && (
        <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', color: '#34d399', marginBottom: '16px', textAlign: 'center', fontSize: '0.85rem' }}>
          ✔ {enrollNotice}
        </div>
      )}

      {/* SECTION 1: COURSES & DEGREE PROGRAMS */}
      {(viewTab === 'all' || viewTab === 'courses') && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.05rem', color: '#ffffff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={18} color="var(--primary)" /> Degree Programs & Courses ({processedCourses.length})
          </h3>

          {processedCourses.length === 0 ? (
            <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No degree programs or courses found matching "{localSearch}".
            </div>
          ) : (
            <div style={styles.coursesGrid}>
              {processedCourses.map((course) => {
                const isEnrolled = currentUser?.enrolledCourses?.includes(course.id);
                const likesCount = (course.likes || []).length;
                const isLiked = currentUser && (course.likes || []).includes(currentUser.id);

                return (
                  <div key={course.id} className="glass-panel" style={{ ...styles.courseCard, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: '140px', width: '100%', position: 'relative', overflow: 'hidden', background: 'rgba(0,0,0,0.3)' }}>
                      <img
                        src={course.bannerUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800&auto=format&fit=crop'}
                        alt={course.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(13,14,24,0.85) 100%)' }} />
                      
                      <span style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '0.68rem', fontWeight: 700, color: '#fff', background: 'rgba(139,92,246,0.85)', padding: '3px 8px', borderRadius: '6px', backdropFilter: 'blur(4px)' }}>
                        {course.department}
                      </span>

                      <span style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '0.68rem', fontWeight: 600, color: course.isDegree ? '#10b981' : '#f59e0b', background: 'rgba(0,0,0,0.7)', padding: '3px 8px', borderRadius: '6px' }}>
                        {course.isDegree ? 'Degree Program' : 'Standard Course'}
                      </span>
                    </div>

                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, justifyContent: 'space-between', textAlign: 'left' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', margin: 0, lineHeight: '1.3' }}>{course.title}</h3>
                          
                          <button
                            type="button"
                            onClick={() => toggleCourseLike && toggleCourseLike(course.id)}
                            style={{ background: 'none', border: 'none', color: isLiked ? '#ef4444' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', fontWeight: 600 }}
                            title={isLiked ? 'Unlike Course' : 'Like Course'}
                          >
                            <Heart size={14} fill={isLiked ? '#ef4444' : 'none'} color={isLiked ? '#ef4444' : 'var(--text-muted)'} />
                            {likesCount > 0 && <span>{likesCount}</span>}
                          </button>
                        </div>

                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>{course.description}</p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', gap: '8px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: course.price === 0 ? '#10b981' : '#ffffff' }}>
                          {course.price === 0 ? 'FREE ACCESS' : `₹${course.price}`}
                        </span>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          {!isEnrolled ? (
                            <button
                              onClick={(e) => handleEnrollAction(course, e)}
                              className="btn btn-primary btn-sm"
                              style={{ fontSize: '0.78rem', gap: '4px' }}
                            >
                              <Plus size={13} /> Enroll Course
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (setSelectedPlaylistId) setSelectedPlaylistId(course.id);
                                setCurrentView('learning-player');
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.78rem', gap: '4px', borderColor: 'rgba(16,185,129,0.4)', color: '#34d399' }}
                            >
                              <CheckCircle2 size={13} color="#10b981" /> Enrolled · Open
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: STANDALONE & SUBJECT PLAYLISTS GRID */}
      {(viewTab === 'all' || viewTab === 'playlists') && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.05rem', color: '#ffffff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Video size={18} color="var(--secondary)" /> Standalone & Subject Playlists ({processedPlaylists.length})
          </h3>

          {processedPlaylists.length === 0 ? (
            <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No standalone or subject playlists found matching "{localSearch}".
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {processedPlaylists.map((pl) => (
                <div key={pl.id} className="glass-panel" style={{ borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(139,92,246,0.3)' }}>
                  
                  {/* YouTube Thumbnail Banner */}
                  <div style={{ height: '140px', background: '#000', position: 'relative', overflow: 'hidden' }}>
                    {pl.thumbnailUrl ? (
                      <img src={pl.thumbnailUrl} alt={pl.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e1b4b 0%, #311b92 100%)' }}>
                        <Play size={36} color="#a78bfa" />
                      </div>
                    )}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.85) 100%)' }} />
                    
                    {/* Video Count Badge */}
                    <span style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.85)', color: '#ffffff', fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Video size={11} /> {pl.videoCount} Videos
                    </span>

                    {/* Copyable Playlist ID Badge */}
                    <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.8)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>ID: <code style={{ color: '#a78bfa' }}>{pl.id}</code></span>
                      <button onClick={(e) => handleCopyPlId(pl.id, e)} style={{ background: 'none', border: 'none', color: copiedPlId === pl.id ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
                        {copiedPlId === pl.id ? <Check size={10} /> : <Copy size={10} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', margin: '0 0 4px 0', lineHeight: '1.3' }}>{pl.title}</h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                        Subject: <strong>{pl.subjectTitle}</strong> • Credit: {pl.author}
                      </span>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>{pl.description}</p>
                    </div>

                    <button
                      onClick={() => {
                        if (pl.courseId && setSelectedPlaylistId) setSelectedPlaylistId(pl.courseId);
                        setCurrentView('learning-player');
                      }}
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%', fontSize: '0.8rem', gap: '6px' }}
                    >
                      <Play size={13} /> Open Playlist
                    </button>
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

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box'
  },
  banner: {
    padding: '24px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
    textAlign: 'left'
  },
  filterRow: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center'
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 16px',
    flex: 1,
    boxSizing: 'border-box'
  },
  searchInput: {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    fontSize: '0.9rem',
    width: '100%',
    outline: 'none',
    fontFamily: 'var(--font-body)'
  },
  coursesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px'
  },
  courseCard: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContract: 'space-between',
    textAlign: 'left',
    transition: 'transform 0.2s, box-shadow 0.2s'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  cardBody: {
    flex: 1,
    marginBottom: '20px'
  },
  courseTitle: {
    fontSize: '1.2rem',
    fontWeight: 600,
    color: '#ffffff',
    marginBottom: '8px'
  },
  courseDesc: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5'
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    paddingTop: '16px'
  },
  priceTag: {
    fontSize: '0.9rem'
  }
};
