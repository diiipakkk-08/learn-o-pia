import React, { useState, useMemo, useEffect } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import {
  Search, BookOpen, CheckCircle2, FileText, Download, Sparkles, Copy, Check,
  Heart, Filter, UserCheck, Play, Plus, X, Layers, Video, ChevronLeft, ChevronRight,
  GraduationCap
} from 'lucide-react';

const ITEMS_PER_PAGE = 5;

export default function CoursesDashboard({ setSelectedPlaylistId, setCurrentView }) {
  const { courses, subjects, currentUser, enrollInCourse, toggleCourseLike, globalSearchQuery, setGlobalSearchQuery } = useDatabase();

  const [localSearch, setLocalSearch] = useState(globalSearchQuery || '');
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'liked' | 'alphabetical'
  const [enrollNotice, setEnrollNotice] = useState(null);
  const [copiedPlId, setCopiedPlId] = useState(null);
  const [viewTab, setViewTab] = useState('all'); // 'all' | 'degrees' | 'courses' | 'playlists'

  // Pagination states
  const [coursePage, setCoursePage] = useState(1);
  const [playlistPage, setPlaylistPage] = useState(1);

  // Reset pagination on search
  useEffect(() => {
    setCoursePage(1);
    setPlaylistPage(1);
  }, [localSearch, viewTab]);

  const handleCopyPlId = (id, e) => {
    if (e) e.stopPropagation();
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedPlId(id);
    setTimeout(() => setCopiedPlId(null), 2000);
  };

  const query = (localSearch || '').trim().toLowerCase();

  // 1. Degree Programs (isDegree === true)
  const processedDegrees = useMemo(() => {
    let list = courses.filter(c => c.isDegree && (
      !query ||
      c.title.toLowerCase().includes(query) ||
      c.id.toLowerCase().includes(query) ||
      c.department.toLowerCase().includes(query) ||
      (c.description && c.description.toLowerCase().includes(query))
    ));
    if (sortBy === 'liked') {
      list = [...list].sort((a, b) => ((b.likes?.length || 0) - (a.likes?.length || 0)));
    } else if (sortBy === 'alphabetical') {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }, [courses, query, sortBy]);

  // 2. Standard Courses (isDegree === false)
  const processedCourses = useMemo(() => {
    let list = courses.filter(c => !c.isDegree && (
      !query ||
      c.title.toLowerCase().includes(query) ||
      c.id.toLowerCase().includes(query) ||
      c.department.toLowerCase().includes(query) ||
      (c.description && c.description.toLowerCase().includes(query))
    ));
    if (sortBy === 'liked') {
      list = [...list].sort((a, b) => ((b.likes?.length || 0) - (a.likes?.length || 0)));
    } else if (sortBy === 'alphabetical') {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }, [courses, query, sortBy]);

  // Paginated Standard Courses (5 per page)
  const totalCoursePages = Math.max(1, Math.ceil(processedCourses.length / ITEMS_PER_PAGE));
  const currentCoursePage = Math.min(coursePage, totalCoursePages);
  const paginatedCourses = useMemo(() => {
    const start = (currentCoursePage - 1) * ITEMS_PER_PAGE;
    return processedCourses.slice(start, start + ITEMS_PER_PAGE);
  }, [processedCourses, currentCoursePage]);

  // 3. Standalone & Subject Playlists
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

  // Paginated Playlists (5 per page)
  const totalPlaylistPages = Math.max(1, Math.ceil(processedPlaylists.length / ITEMS_PER_PAGE));
  const currentPlaylistPage = Math.min(playlistPage, totalPlaylistPages);
  const paginatedPlaylists = useMemo(() => {
    const start = (currentPlaylistPage - 1) * ITEMS_PER_PAGE;
    return processedPlaylists.slice(start, start + ITEMS_PER_PAGE);
  }, [processedPlaylists, currentPlaylistPage]);

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
            onChange={(e) => {
              setLocalSearch(e.target.value);
              if (setGlobalSearchQuery) setGlobalSearchQuery(e.target.value);
            }}
            style={{ width: '100%', paddingLeft: '42px', paddingRight: '36px', height: '42px', fontSize: '0.88rem', borderRadius: '10px', boxSizing: 'border-box' }}
          />
          {localSearch && (
            <button
              onClick={() => { setLocalSearch(''); if (setGlobalSearchQuery) setGlobalSearchQuery(''); }}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Header Control Bar & Filter Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <button
            className={`btn ${viewTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewTab('all')}
            style={{ padding: '6px 14px', fontSize: '0.78rem', borderRadius: '20px', flexShrink: 0, gap: '6px' }}
          >
            <Layers size={13} /> All ({processedDegrees.length + processedCourses.length + processedPlaylists.length})
          </button>

          <button
            className={`btn ${viewTab === 'degrees' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewTab('degrees')}
            style={{ padding: '6px 14px', fontSize: '0.78rem', borderRadius: '20px', flexShrink: 0, gap: '6px' }}
          >
            <GraduationCap size={13} /> Degree Programs ({processedDegrees.length})
          </button>

          <button
            className={`btn ${viewTab === 'courses' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewTab('courses')}
            style={{ padding: '6px 14px', fontSize: '0.78rem', borderRadius: '20px', flexShrink: 0, gap: '6px' }}
          >
            <BookOpen size={13} /> Standard Courses ({processedCourses.length})
          </button>

          <button
            className={`btn ${viewTab === 'playlists' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewTab('playlists')}
            style={{ padding: '6px 14px', fontSize: '0.78rem', borderRadius: '20px', flexShrink: 0, gap: '6px' }}
          >
            <Video size={13} /> Playlists ({processedPlaylists.length})
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

      {/* SECTION 1: DEGREE PROGRAMS (Horizontal Scroll Carousel) */}
      {(viewTab === 'all' || viewTab === 'degrees') && (
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '1.05rem', color: '#ffffff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GraduationCap size={18} color="var(--primary)" /> Degree Programs ({processedDegrees.length})
          </h3>

          {processedDegrees.length === 0 ? (
            <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No degree programs found matching "{localSearch}".
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '10px', WebkitOverflowScrolling: 'touch' }}>
              {processedDegrees.map((course) => {
                const isEnrolled = currentUser?.enrolledCourses?.includes(course.id);
                const likesCount = (course.likes || []).length;
                const isLiked = currentUser && (course.likes || []).includes(currentUser.id);

                return (
                  <div key={course.id} className="glass-panel" style={{ minWidth: '290px', maxWidth: '320px', borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexShrink: 0, border: '1px solid rgba(139,92,246,0.3)' }}>
                    <div style={{ height: '130px', width: '100%', position: 'relative', overflow: 'hidden', background: '#000' }}>
                      <img
                        src={course.bannerUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800&auto=format&fit=crop'}
                        alt={course.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(13,14,24,0.85) 100%)' }} />
                      <span style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '0.65rem', fontWeight: 700, color: '#fff', background: 'rgba(139,92,246,0.85)', padding: '2px 8px', borderRadius: '6px' }}>
                        {course.department}
                      </span>
                    </div>

                    <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, justifyContent: 'space-between', textAlign: 'left' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '4px' }}>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', margin: 0, lineHeight: '1.3' }}>{course.title}</h4>
                          
                          <button
                            type="button"
                            onClick={() => toggleCourseLike && toggleCourseLike(course.id)}
                            style={{ background: 'none', border: 'none', color: isLiked ? '#ef4444' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', fontWeight: 600 }}
                            title={isLiked ? 'Unlike Degree' : 'Like Degree'}
                          >
                            <Heart size={14} fill={isLiked ? '#ef4444' : 'none'} color={isLiked ? '#ef4444' : 'var(--text-muted)'} />
                            {likesCount > 0 && <span>{likesCount}</span>}
                          </button>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>{course.description}</p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10b981' }}>DEGREE PROGRAM</span>

                        {!isEnrolled ? (
                          <button onClick={(e) => handleEnrollAction(course, e)} className="btn btn-primary btn-sm" style={{ fontSize: '0.75rem', gap: '4px' }}>
                            <Plus size={12} /> Enroll
                          </button>
                        ) : (
                          <button onClick={() => { if (setSelectedPlaylistId) setSelectedPlaylistId(course.id); setCurrentView('learning-player'); }} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem', gap: '4px', borderColor: 'rgba(16,185,129,0.4)', color: '#34d399' }}>
                            <CheckCircle2 size={12} color="#10b981" /> Open
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: STANDARD COURSES (Top-to-Bottom, 5 per Page) */}
      {(viewTab === 'all' || viewTab === 'courses') && (
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '1.05rem', color: '#ffffff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={18} color="var(--primary)" /> Standard Courses ({processedCourses.length})
          </h3>

          {processedCourses.length === 0 ? (
            <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No standard courses found matching "{localSearch}".
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                {paginatedCourses.map((course) => {
                  const isEnrolled = currentUser?.enrolledCourses?.includes(course.id);
                  const likesCount = (course.likes || []).length;
                  const isLiked = currentUser && (course.likes || []).includes(currentUser.id);

                  return (
                    <div key={course.id} className="glass-panel" style={{ padding: 0, borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div style={{ height: '130px', width: '100%', position: 'relative', overflow: 'hidden', background: '#000' }}>
                        <img
                          src={course.bannerUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800&auto=format&fit=crop'}
                          alt={course.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(13,14,24,0.85) 100%)' }} />
                        <span style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '0.65rem', fontWeight: 700, color: '#fff', background: 'rgba(139,92,246,0.85)', padding: '2px 8px', borderRadius: '6px' }}>
                          {course.department}
                        </span>
                      </div>

                      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, justifyContent: 'space-between', textAlign: 'left' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '4px' }}>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', margin: 0, lineHeight: '1.3' }}>{course.title}</h4>
                            
                            <button
                              type="button"
                              onClick={() => toggleCourseLike && toggleCourseLike(course.id)}
                              style={{ background: 'none', border: 'none', color: isLiked ? '#ef4444' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', fontWeight: 600 }}
                            >
                              <Heart size={14} fill={isLiked ? '#ef4444' : 'none'} color={isLiked ? '#ef4444' : 'var(--text-muted)'} />
                              {likesCount > 0 && <span>{likesCount}</span>}
                            </button>
                          </div>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>{course.description}</p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: course.price === 0 ? '#10b981' : '#ffffff' }}>
                            {course.price === 0 ? 'FREE' : `₹${course.price}`}
                          </span>

                          {!isEnrolled ? (
                            <button onClick={(e) => handleEnrollAction(course, e)} className="btn btn-primary btn-sm" style={{ fontSize: '0.75rem', gap: '4px' }}>
                              <Plus size={12} /> Enroll
                            </button>
                          ) : (
                            <button onClick={() => { if (setSelectedPlaylistId) setSelectedPlaylistId(course.id); setCurrentView('learning-player'); }} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem', gap: '4px', borderColor: 'rgba(16,185,129,0.4)', color: '#34d399' }}>
                              <CheckCircle2 size={12} color="#10b981" /> Open
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Course Pagination Bar (5 results per page) */}
              {totalCoursePages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '16px' }}>
                  <button
                    disabled={currentCoursePage <= 1}
                    onClick={() => setCoursePage(p => Math.max(1, p - 1))}
                    className="btn btn-secondary btn-sm"
                    style={{ opacity: currentCoursePage <= 1 ? 0.5 : 1, gap: '4px' }}
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>

                  <span style={{ fontSize: '0.8rem', color: '#a78bfa', fontWeight: 600 }}>
                    Page {currentCoursePage} of {totalCoursePages}
                  </span>

                  <button
                    disabled={currentCoursePage >= totalCoursePages}
                    onClick={() => setCoursePage(p => Math.min(totalCoursePages, p + 1))}
                    className="btn btn-secondary btn-sm"
                    style={{ opacity: currentCoursePage >= totalCoursePages ? 0.5 : 1, gap: '4px' }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* SECTION 3: STANDALONE & SUBJECT PLAYLISTS (Top-to-Bottom, 5 per Page) */}
      {(viewTab === 'all' || viewTab === 'playlists') && (
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '1.05rem', color: '#ffffff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Video size={18} color="var(--secondary)" /> Standalone & Subject Playlists ({processedPlaylists.length})
          </h3>

          {processedPlaylists.length === 0 ? (
            <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No playlists found matching "{localSearch}".
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                {paginatedPlaylists.map((pl) => (
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

                      {/* Copyable Playlist ID Badge */}
                      <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.8)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>ID: <code style={{ color: '#a78bfa' }}>{pl.id}</code></span>
                        <button onClick={(e) => handleCopyPlId(pl.id, e)} style={{ background: 'none', border: 'none', color: copiedPlId === pl.id ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
                          {copiedPlId === pl.id ? <Check size={10} /> : <Copy size={10} />}
                        </button>
                      </div>
                    </div>

                    <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px', textAlign: 'left' }}>
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

              {/* Playlist Pagination Bar (5 results per page) */}
              {totalPlaylistPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '16px' }}>
                  <button
                    disabled={currentPlaylistPage <= 1}
                    onClick={() => setPlaylistPage(p => Math.max(1, p - 1))}
                    className="btn btn-secondary btn-sm"
                    style={{ opacity: currentPlaylistPage <= 1 ? 0.5 : 1, gap: '4px' }}
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>

                  <span style={{ fontSize: '0.8rem', color: '#a78bfa', fontWeight: 600 }}>
                    Page {currentPlaylistPage} of {totalPlaylistPages}
                  </span>

                  <button
                    disabled={currentPlaylistPage >= totalPlaylistPages}
                    onClick={() => setPlaylistPage(p => Math.min(totalPlaylistPages, p + 1))}
                    className="btn btn-secondary btn-sm"
                    style={{ opacity: currentPlaylistPage >= totalPlaylistPages ? 0.5 : 1, gap: '4px' }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </>
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
  coursesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '14px'
  }
};
