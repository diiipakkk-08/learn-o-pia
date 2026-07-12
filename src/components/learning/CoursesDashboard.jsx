import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Search, BookOpen, CheckCircle2, ShieldCheck, FileText, Link as LinkIcon, Download, Loader } from 'lucide-react';

export default function CoursesDashboard({ setSelectedPlaylistId, setCurrentView }) {
  const { courses, subjects, currentUser, enrollInCourse } = useDatabase();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('courses'); // courses, materials
  
  // Checkout Modal State
  const [checkoutCourse, setCheckoutCourse] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Compile list of all downloadable resources/notes across all subjects
  const allResources = [];
  subjects.forEach(subject => {
    const parentCourse = courses.find(c => c.id === subject.courseId);
    
    // Flatten Notes
    if (subject.notes) {
      subject.notes.forEach(res => {
        allResources.push({
          id: res.id,
          title: res.title,
          url: res.url,
          type: 'notes',
          subjectTitle: subject.title,
          semester: subject.semester,
          courseTitle: parentCourse ? parentCourse.title : 'General'
        });
      });
    }

    // Flatten Organizers
    if (subject.organizers) {
      subject.organizers.forEach(res => {
        allResources.push({
          id: res.id,
          title: res.title,
          url: res.url,
          type: 'organizers',
          subjectTitle: subject.title,
          semester: subject.semester,
          courseTitle: parentCourse ? parentCourse.title : 'General'
        });
      });
    }

    // Flatten Past Papers
    if (subject.pastPapers) {
      subject.pastPapers.forEach(res => {
        allResources.push({
          id: res.id,
          title: res.title,
          url: res.url,
          type: 'pastPapers',
          subjectTitle: subject.title,
          semester: subject.semester,
          courseTitle: parentCourse ? parentCourse.title : 'General'
        });
      });
    }
  });

  // Filter Courses
  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter Materials
  const filteredMaterials = allResources.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.subjectTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.courseTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartCheckout = (course) => {
    setCheckoutCourse(course);
    setCheckoutSuccess(false);
  };

  const handleConfirmCheckout = () => {
    setCheckoutLoading(true);
    setTimeout(() => {
      setCheckoutLoading(false);
      setCheckoutSuccess(true);
      setTimeout(() => {
        enrollInCourse(checkoutCourse.id);
        setSelectedPlaylistId(checkoutCourse.id);
        setCheckoutCourse(null);
        setCurrentView('learning-player');
      }, 1200);
    }, 1500);
  };

  const handleOpenCourse = (courseId) => {
    setSelectedPlaylistId(courseId);
    setCurrentView('learning-player');
  };

  return (
    <div className="animate-fade-in" style={styles.container}>
      
      {/* Search and Tab Switcher */}
      <div style={styles.headerBox} className="glass-panel">
        <h2 style={{ fontSize: '1.6rem', marginBottom: '14px' }} className="gradient-text">
          University Learning Workspace
        </h2>
        
        {/* Search */}
        <div style={styles.searchWrapper}>
          <Search size={18} style={styles.searchIcon} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
            placeholder={activeTab === 'courses' ? "Search degree programs or departments..." : "Search study notes and resource files..."} 
          />
        </div>

        {/* Tab Controls */}
        <div style={styles.tabsRow}>
          <button
            onClick={() => { setActiveTab('courses'); setSearchQuery(''); }}
            className={`yt-chip ${activeTab === 'courses' ? 'active' : ''}`}
            style={{ padding: '8px 24px' }}
          >
            Syllabus Courses
          </button>
          <button
            onClick={() => { setActiveTab('materials'); setSearchQuery(''); }}
            className={`yt-chip ${activeTab === 'materials' ? 'active' : ''}`}
            style={{ padding: '8px 24px' }}
          >
            Study Materials
          </button>
        </div>
      </div>

      {/* Degree Courses Tab Grid */}
      {activeTab === 'courses' && (
        filteredCourses.length === 0 ? (
          <div style={styles.noResults} className="glass-panel">
            <BookOpen size={44} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
            <h3>No courses found</h3>
            <p style={{ color: 'var(--text-muted)' }}>Try adjusting your keywords.</p>
          </div>
        ) : (
          <div style={styles.grid} className="courses-dashboard-grid">
            {filteredCourses.map(course => {
              const isEnrolled = currentUser.enrolledCourses.includes(course.id) || currentUser.role === 'admin';
              return (
                <div key={course.id} className="glass-panel" style={styles.card}>
                  <div>
                    <div style={styles.cardHeader}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span className="badge badge-learner" style={{ fontSize: '0.65rem' }}>{course.department}</span>
                        <span className={course.isDegree ? "badge badge-creator" : "badge badge-admin"} style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                          {course.isDegree ? 'Degree' : 'Course'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.9rem', color: course.price > 0 ? 'var(--primary)' : 'var(--success)', fontWeight: 600 }}>
                        {course.price > 0 ? `${course.price} ₹` : '0 ₹ / Free'}
                      </span>
                    </div>
                    <h3 style={styles.cardTitle}>{course.title}</h3>
                    <p style={styles.cardDesc}>{course.description}</p>
                  </div>

                  <div style={styles.cardFooter}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>By: {course.author || course.creatorName}</span>
                    {isEnrolled ? (
                      <button 
                        onClick={() => handleOpenCourse(course.id)}
                        className="btn btn-primary"
                        style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                      >
                        Enter Course
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleStartCheckout(course)}
                        className="btn btn-secondary"
                        style={{ padding: '8px 16px', fontSize: '0.8rem', border: '1px solid var(--primary)', color: '#ffffff' }}
                      >
                        Enroll ({course.price > 0 ? `${course.price} ₹` : '0 ₹'})
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Materials Tab Grid */}
      {activeTab === 'materials' && (
        filteredMaterials.length === 0 ? (
          <div style={styles.noResults} className="glass-panel">
            <FileText size={44} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
            <h3>No materials found</h3>
            <p style={{ color: 'var(--text-muted)' }}>No reference documents match your filters.</p>
          </div>
        ) : (
          <div style={styles.grid} className="courses-dashboard-grid">
            {filteredMaterials.map(resource => (
              <div key={resource.id} className="glass-panel" style={styles.materialCard}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={styles.docIconWrapper}>
                    <FileText size={20} color="#f59e0b" />
                  </div>
                  <div style={{ overflow: 'hidden', textAlign: 'left' }}>
                    <h4 style={styles.materialTitle} title={resource.title}>{resource.title}</h4>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Subject: {resource.subjectTitle} (Semester {resource.semester})
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Type: <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{resource.type}</span>
                    </div>
                  </div>
                </div>

                <a 
                  href={resource.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '8px', fontSize: '0.8rem', gap: '6px', marginTop: '16px', textDecoration: 'none' }}
                >
                  <Download size={13} />
                  <span>Download file</span>
                </a>
              </div>
            ))}
          </div>
        )
      )}

      {/* ZERO PAYMENT CHECKOUT MODAL OVERLAY */}
      {checkoutCourse && (
        <div className="checkout-overlay">
          <div className="checkout-modal glass-panel animate-fade-in" style={{ background: '#0a0b10', border: '1px solid rgba(139,92,246,0.3)' }}>
            {!checkoutSuccess ? (
              <>
                <div className="payment-shield">
                  <ShieldCheck size={28} />
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>Secure Enrollment Checkout</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>You are enrolling in a university syllabus course.</p>
                
                {/* Billing Summary */}
                <div style={styles.checkoutReceipt}>
                  <div style={styles.receiptRow}>
                    <span>Course:</span>
                    <strong>{checkoutCourse.title}</strong>
                  </div>
                  <div style={styles.receiptRow}>
                    <span>Price Tier:</span>
                    <span>{checkoutCourse.price > 0 ? `${checkoutCourse.price} ₹` : '0 ₹ (Free Course)'}</span>
                  </div>
                  <div style={{ ...styles.receiptRow, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', marginTop: '10px' }}>
                    <strong>Total Amount Due:</strong>
                    <strong style={{ color: 'var(--success)' }}>{checkoutCourse.price > 0 ? `${checkoutCourse.price} ₹` : '0 ₹'}</strong>
                  </div>
                </div>

                <div style={styles.mockCardForm}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textAlign: 'left' }}>
                    💳 Sandbox Billing Info
                  </span>
                  <input type="text" className="form-input" value={`${currentUser.name}`} readOnly style={{ padding: '8px 12px', fontSize: '0.8rem', marginBottom: '8px', color: 'var(--text-secondary)' }} />
                  <input type="text" className="form-input" value="•••• •••• •••• 0000" readOnly style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }} />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button 
                    onClick={handleConfirmCheckout} 
                    className="btn btn-primary" 
                    style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
                    disabled={checkoutLoading}
                  >
                    {checkoutLoading ? <Loader size={16} className="spin-animation" /> : `Confirm & Enroll (${checkoutCourse.price > 0 ? `${checkoutCourse.price} ₹` : '0 ₹'})`}
                  </button>
                  <button 
                    onClick={() => setCheckoutCourse(null)} 
                    className="btn btn-secondary" 
                    style={{ padding: '10px', fontSize: '0.85rem' }}
                    disabled={checkoutLoading}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div style={styles.checkoutSuccessState}>
                <CheckCircle2 size={56} color="var(--success)" style={{ marginBottom: '16px' }} />
                <h3 style={{ fontSize: '1.3rem', color: '#ffffff' }}>Payment Successful!</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '6px' }}>
                  Receipt issued for {checkoutCourse.price > 0 ? `${checkoutCourse.price} ₹` : '0 ₹'}. Enrolling you in course...
                </p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  headerBox: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center'
  },
  searchWrapper: {
    position: 'relative',
    width: '100%',
    maxWidth: '560px',
    marginBottom: '16px'
  },
  searchIcon: {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-muted)'
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px 12px 46px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '0.9rem',
    fontFamily: 'var(--font-body)',
    transition: 'all 0.2s',
    outline: 'none',
    ':focus': {
      borderColor: 'var(--primary)',
      boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.15)'
    }
  },
  tabsRow: {
    display: 'flex',
    gap: '8px'
  },
  noResults: {
    padding: '80px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px'
  },
  card: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '230px',
    textAlign: 'left'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  cardTitle: {
    fontSize: '1.15rem',
    marginBottom: '8px',
    lineHeight: '1.3'
  },
  cardDesc: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '14px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    marginTop: '16px'
  },
  materialCard: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '160px'
  },
  docIconWrapper: {
    width: '38px',
    height: '38px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.04)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  materialTitle: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#ffffff',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    lineHeight: '1.3'
  },
  checkoutReceipt: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '10px',
    padding: '16px',
    margin: '20px 0',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontSize: '0.85rem'
  },
  receiptRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px'
  },
  mockCardForm: {
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: '10px',
    padding: '12px'
  },
  checkoutSuccessState: {
    padding: '20px 0'
  }
};
