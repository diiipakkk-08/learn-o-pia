import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Search, BookOpen, CheckCircle2, ShieldCheck, FileText, Link as LinkIcon, Download, Loader, Sparkles, Folder } from 'lucide-react';

export default function CoursesDashboard({ setSelectedPlaylistId, setCurrentView }) {
  const { courses, subjects, currentUser, enrollInCourse, standaloneResources } = useDatabase();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' | 'materials'
  
  // Checkout Modal State
  const [checkoutCourse, setCheckoutCourse] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Compile list of all downloadable resources/notes across all subjects + standalone resources
  const allResources = [];

  // 1. Add standalone resources published directly by Creators/Professors
  if (standaloneResources && Array.isArray(standaloneResources)) {
    standaloneResources.forEach(res => {
      allResources.push({
        id: res.id,
        title: res.title,
        url: res.url,
        author: res.author || 'Educator',
        type: res.category || 'Open Public Resource',
        sectionName: res.category || 'Open Public Resource',
        subjectTitle: 'Open Study Material',
        semester: 'All',
        courseTitle: res.category || 'Public Resource',
        description: res.description
      });
    });
  }

  // 2. Flatten subject materials
  subjects.forEach(subject => {
    const parentCourse = courses.find(c => c.id === subject.courseId);
    
    if (subject.materials && Array.isArray(subject.materials)) {
      subject.materials.forEach(mat => {
        allResources.push({
          id: mat.id,
          title: mat.title,
          url: mat.url,
          author: mat.author || 'Instructor',
          type: mat.sectionName || 'Study Material',
          sectionName: mat.sectionName || 'Study Material',
          subjectTitle: subject.title,
          semester: subject.semester,
          courseTitle: parentCourse ? parentCourse.title : 'General'
        });
      });
    }
  });

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredResources = allResources.filter(r =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.courseTitle && r.courseTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (r.subjectTitle && r.subjectTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (r.author && r.author.toLowerCase().includes(searchQuery.toLowerCase()))
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

  const handleConfirmPayment = () => {
    if (!checkoutCourse) return;
    setCheckoutLoading(true);

    setTimeout(() => {
      enrollInCourse(checkoutCourse.id);
      setCheckoutLoading(false);
      setCheckoutSuccess(true);

      setTimeout(() => {
        setCheckoutCourse(null);
        setSelectedPlaylistId(checkoutCourse.id);
        setCurrentView('learning-player');
      }, 1200);
    }, 1500);
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* Top Banner */}
      <section style={styles.banner} className="glass-panel">
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '8px' }} className="primary-gradient-text">
            Standard Curricula & Open Public Resources
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Explore degree programs, subject lecture series, and open study resources published by verified educators.
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '10px', marginTop: '12px' }}>
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

      {/* Filter and Search Bar */}
      <div style={{ marginBottom: '24px', width: '100%' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 18px',
          borderRadius: '14px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxSizing: 'border-box',
          width: '100%',
          textAlign: 'left'
        }}>
          <Search size={20} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder={activeTab === 'courses' ? "Search degree programs or subjects..." : "Search open PDFs, notes, formula sheets..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.92rem',
              width: '100%',
              outline: 'none',
              fontFamily: 'var(--font-body)',
              padding: 0,
              margin: 0
            }}
          />
        </div>
      </div>

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
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'left' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '4px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} color="var(--primary)" /> Public Open Study Resources & PDF Feed
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Open formula sheets, lab manuals, and notes published directly by verified professors and creators.
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', background: 'rgba(139,92,246,0.12)', padding: '2px 8px', borderRadius: '999px' }}>
                        {res.type}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Published by <strong>{res.author}</strong></span>
                    </div>

                    <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#ffffff', margin: '0 0 6px 0', lineHeight: '1.4' }}>
                      {res.title}
                    </h4>

                    {res.description && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: '1.4' }}>
                        {res.description}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{res.subjectTitle}</span>
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '6px 12px', fontSize: '0.78rem', gap: 4 }}
                    >
                      <Download size={14} /> Open PDF
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
