import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Search, BookOpen, CheckCircle2, ShieldCheck, FileText, Link as LinkIcon, Download, Loader, Sparkles, Folder, Copy, Check } from 'lucide-react';

export default function CoursesDashboard({ setSelectedPlaylistId, setCurrentView }) {
  const { courses, subjects, currentUser, enrollInCourse, standaloneResources, globalSearchQuery } = useDatabase();
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' | 'materials'
  const [copiedResId, setCopiedResId] = useState(null);
  
  // Checkout Modal State
  const [checkoutCourse, setCheckoutCourse] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const handleCopyId = (id) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedResId(id);
    setTimeout(() => setCopiedResId(null), 2000);
  };

  // Deduplicate and compile list of all downloadable resources/notes across all subjects + standalone resources
  const resourceMap = new Map();

  // 1. Add standalone resources published directly by Creators/Professors
  if (standaloneResources && Array.isArray(standaloneResources)) {
    standaloneResources.forEach(res => {
      const key = res.id || res.url;
      resourceMap.set(key, {
        id: res.id,
        title: res.title,
        url: res.url,
        author: res.author || 'Educator',
        type: res.category || 'Open Public Resource',
        sectionName: res.category || 'Open Public Resource',
        subjects: ['Open Study Material'],
        courseTitle: res.category || 'Public Resource',
        description: res.description
      });
    });
  }

  // 2. Flatten subject materials (deduplicating linked resource IDs or URLs)
  subjects.forEach(subject => {
    const parentCourse = courses.find(c => c.id === subject.courseId);
    
    if (subject.materials && Array.isArray(subject.materials)) {
      subject.materials.forEach(mat => {
        const key = mat.originalResourceId || mat.id || mat.url;
        if (resourceMap.has(key)) {
          const existing = resourceMap.get(key);
          if (!existing.subjects.includes(subject.title)) {
            existing.subjects.push(subject.title);
          }
        } else {
          resourceMap.set(key, {
            id: mat.id,
            title: mat.title,
            url: mat.url,
            author: mat.author || 'Instructor',
            type: mat.sectionName || 'Study Material',
            sectionName: mat.sectionName || 'Study Material',
            subjects: [subject.title],
            courseTitle: parentCourse ? parentCourse.title : 'General'
          });
        }
      });
    }
  });

  const allResources = Array.from(resourceMap.values());
  const query = (globalSearchQuery || '').toLowerCase().trim();

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(query) ||
    c.department.toLowerCase().includes(query)
  );

  const filteredResources = allResources.filter(r =>
    r.title.toLowerCase().includes(query) ||
    (r.id && r.id.toLowerCase().includes(query)) ||
    (r.courseTitle && r.courseTitle.toLowerCase().includes(query)) ||
    (r.subjects && r.subjects.some(s => s.toLowerCase().includes(query))) ||
    (r.author && r.author.toLowerCase().includes(query))
  );

  const handleEnrollClick = (course) => {
    if (course.price === 0) {
      enrollInCourse(course.id);
      setSelectedPlaylistId(course.id);
      setCurrentView('learning-player');
    } else {
      setCheckoutCourse(course);
      setCheckoutSuccess(false);
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* Compact Top Banner */}
      <section style={{ ...styles.banner, padding: '14px 20px', marginBottom: '8px' }} className="glass-panel">
        <div>
          <h1 style={{ fontSize: '1.4rem', marginBottom: '4px' }} className="primary-gradient-text">
            Standard Curricula & Open Public Resources
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
            Explore degree programs, subject lecture series, and open study resources published by verified educators.
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '10px' }}>
          <button
            className={`btn ${activeTab === 'courses' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('courses')}
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
          >
            <BookOpen size={15} /> Degree Curricula ({courses.length})
          </button>
          <button
            className={`btn ${activeTab === 'materials' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('materials')}
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
          >
            <FileText size={15} /> Open Study Resources ({allResources.length})
          </button>
        </div>
      </section>

      {/* TAB 1: Degree Curricula Grid */}
      {activeTab === 'courses' && (
        <div style={styles.coursesGrid}>
          {filteredCourses.map((course) => {
            const isEnrolled = currentUser?.enrolledCourses?.includes(course.id);
            return (
              <div key={course.id} className="glass-panel" style={styles.courseCard}>
                <div style={styles.cardHeader}>
                  <span className="badge badge-learner" style={{ fontSize: '0.7rem' }}>
                    {course.department}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: course.isDegree ? 'var(--primary)' : 'var(--secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                    {course.isDegree ? 'Degree Program' : 'Standard Course'}
                  </span>
                </div>

                <div style={styles.cardBody}>
                  <h3 style={styles.courseTitle}>{course.title}</h3>
                  <p style={styles.courseDesc}>{course.description}</p>
                </div>

                <div style={styles.cardFooter}>
                  <div style={styles.priceTag}>
                    {course.price === 0 ? (
                      <span style={{ color: 'var(--success)', fontWeight: 700 }}>FREE ACCESS</span>
                    ) : (
                      <span style={{ color: '#ffffff', fontWeight: 700 }}>₹{course.price}</span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedPlaylistId(course.id);
                      setCurrentView('learning-player');
                    }}
                    className="btn btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                  >
                    {isEnrolled ? 'Open Course' : 'View Course'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
    gap: '24px',
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
