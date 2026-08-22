import React, { useState, useMemo } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Search, BookOpen, CheckCircle2, FileText, Download, Sparkles, Copy, Check, Heart, Filter, UserCheck, Play, Plus, X } from 'lucide-react';

export default function CoursesDashboard({ setSelectedPlaylistId, setCurrentView }) {
  const { courses, subjects, currentUser, enrollInCourse, toggleCourseLike, standaloneResources, globalSearchQuery } = useDatabase();
  const [copiedResId, setCopiedResId] = useState(null);
  
  // Search & Sorting States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'liked' | 'alphabetical'
  const [enrollNotice, setEnrollNotice] = useState(null);

  // Checkout Modal State
  const [checkoutCourse, setCheckoutCourse] = useState(null);

  const query = (localSearch || globalSearchQuery || '').toLowerCase().trim();

  // Filtered & Sorted Courses
  const processedCourses = useMemo(() => {
    let list = courses.filter(c => 
      c.title.toLowerCase().includes(query) ||
      c.department.toLowerCase().includes(query) ||
      (c.description && c.description.toLowerCase().includes(query))
    );

    if (sortBy === 'liked') {
      list = [...list].sort((a, b) => ((b.likes?.length || 0) - (a.likes?.length || 0)));
    } else if (sortBy === 'alphabetical') {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    }
    // Default 'recent' uses database order
    return list;
  }, [courses, query, sortBy]);

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
      
      {/* Top Header Control Bar: Search & Sorting */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '10px', flexWrap: 'wrap' }} className="glass-panel-sm">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ fontSize: '1.15rem', color: '#ffffff', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BookOpen size={18} color="var(--primary)" /> Degree Curricula & Courses ({processedCourses.length})
          </h2>
        </div>

        {/* Right Action Controls: Expandable Search + Sorting Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          
          {/* Expandable Search Button / Input */}
          {isSearchOpen ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.4)', padding: '2px 8px', borderRadius: '8px', border: '1px solid rgba(139,92,246,0.4)' }}>
              <Search size={14} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search curricula..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '0.78rem', outline: 'none', width: '130px' }}
                autoFocus
              />
              <button onClick={() => { setIsSearchOpen(false); setLocalSearch(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSearchOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 10px', fontSize: '0.78rem', gap: '4px' }}
              title="Search Curricula"
            >
              <Search size={14} /> Search
            </button>
          )}

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
      </div>

      {enrollNotice && (
        <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', color: '#34d399', marginBottom: '16px', textAlign: 'center', fontSize: '0.85rem' }}>
          ✔ {enrollNotice}
        </div>
      )}

      {/* Degree Curricula Grid with Rich Banner Images & Explicit Enroll Button */}
      <div style={styles.coursesGrid}>
        {processedCourses.map((course) => {
          const isEnrolled = currentUser?.enrolledCourses?.includes(course.id);
          const likesCount = (course.likes || []).length;
          const isLiked = currentUser && (course.likes || []).includes(currentUser.id);

          return (
            <div key={course.id} className="glass-panel" style={{ ...styles.courseCard, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Course Banner Image */}
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
                    
                    {/* Course Like Button */}
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

      {/* TAB 2: Open Study Resources Feed (Including Standalone Resources) */}
      {activeTab === 'materials' && (
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'left' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '4px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} color="var(--primary)" /> Public Open Study Resources & PDF Feed
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Open formula sheets, lab manuals, and PYQ notes published directly by verified professors and creators.
          </p>

          {filteredResources.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <FileText size={36} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No open resources found matching your search query.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
              {filteredResources.map((res) => (
                <div key={res.id} style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', background: 'rgba(139,92,246,0.12)', padding: '2px 8px', borderRadius: '999px' }}>
                        {res.type}
                      </span>
                      
                      {/* Copyable Resource ID Badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: '6px' }}>
                        <span>ID: <code style={{ color: '#a78bfa' }}>{res.id}</code></span>
                        <button
                          onClick={() => handleCopyId(res.id)}
                          style={{ background: 'none', border: 'none', color: copiedResId === res.id ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2, padding: 0 }}
                          title="Copy Resource ID to link in other subjects"
                        >
                          {copiedResId === res.id ? <Check size={11} /> : <Copy size={11} />}
                          {copiedResId === res.id && <span style={{ fontSize: '0.6rem', color: '#10b981' }}>Copied</span>}
                        </button>
                      </div>
                    </div>

                    <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#ffffff', margin: '0 0 4px 0', lineHeight: '1.4' }}>
                      {res.title}
                    </h4>

                    {res.description && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 8px 0', lineHeight: '1.4' }}>
                        {res.description}
                      </p>
                    )}
                    
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Published by <strong>{res.author}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {res.subjects && res.subjects.join(', ')}
                    </span>
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '5px 10px', fontSize: '0.78rem', gap: 4 }}
                    >
                      <Download size={13} /> Open PDF
                    </a>
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
