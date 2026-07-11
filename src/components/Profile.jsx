import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { User, Mail, Award, Shield, FileText, CheckCircle2, Clock, LogOut, Play, BookOpen, X } from 'lucide-react';

export default function Profile({ setCurrentView, setSelectedPlaylistId }) {
  const { currentUser, courses, requestCreatorStatus, logout } = useDatabase();
  const [loading, setLoading] = useState(false);

  if (!currentUser) return null;

  const handleRequestCreator = () => {
    setLoading(true);
    setTimeout(() => {
      requestCreatorStatus(currentUser.id);
      setLoading(false);
    }, 600);
  };

  const handleEnterCourse = (courseId) => {
    setSelectedPlaylistId(courseId);
    setCurrentView('learning-player');
  };

  // Filter courses user has purchased/enrolled in
  const myEnrolledCourses = courses.filter(c => currentUser.enrolledCourses?.includes(c.id));

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.grid}>
        
        {/* LEFT COLUMN: User Card */}
        <div className="glass-panel" style={styles.card}>
          <div style={styles.avatarCircle}>
            <User size={40} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '1.4rem', marginTop: '16px' }}>{currentUser.name}</h2>
          <span className={`badge badge-${currentUser.role}`} style={{ marginTop: '8px' }}>
            {currentUser.role}
          </span>

          <div style={styles.infoList}>
            <div style={styles.infoItem}>
              <Mail size={16} color="var(--text-muted)" />
              <span style={{ fontSize: '0.85rem' }}>{currentUser.email}</span>
            </div>
            <div style={styles.infoItem}>
              <Award size={16} color="var(--text-muted)" />
              <span style={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>Status: {currentUser.status}</span>
            </div>
          </div>

          <button onClick={logout} style={styles.logoutBtn} className="btn">
            <LogOut size={16} />
            Sign Out Account
          </button>
        </div>

        {/* RIGHT COLUMN: Role Actions, Creator Applications & Enrolled Courses */}
        <div style={styles.actionsColumn}>
          
          {/* Section 1: Enrolled Courses List */}
          <div className="glass-panel" style={styles.overviewBox}>
            <h3 style={styles.boxTitle}>
              <BookOpen size={18} color="var(--primary)" />
              My Enrolled Curricula ({myEnrolledCourses.length})
            </h3>
            
            <div style={styles.enrolledCoursesList}>
              {myEnrolledCourses.length === 0 ? (
                <div style={styles.emptyEnrolled}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    You have not enrolled in any degree programs or standard courses yet.
                  </p>
                  <button 
                    onClick={() => setCurrentView('learning')} 
                    className="btn btn-primary"
                    style={{ marginTop: '12px', padding: '8px 16px', fontSize: '0.8rem' }}
                  >
                    Browse Curricula
                  </button>
                </div>
              ) : (
                <div style={styles.enrolledGrid}>
                  {myEnrolledCourses.map(course => (
                    <div key={course.id} style={styles.enrolledCourseCard}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="badge badge-learner" style={{ fontSize: '0.6rem' }}>
                            {course.department}
                          </span>
                          <span style={{ fontSize: '0.65rem', color: course.isDegree ? 'var(--primary)' : 'var(--secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                            {course.isDegree ? 'Degree Program' : 'Standard Course'}
                          </span>
                        </div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff', marginTop: '4px' }}>
                          {course.title}
                        </h4>
                      </div>
                      
                      <button 
                        onClick={() => handleEnterCourse(course.id)}
                        className="btn btn-primary"
                        style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '4px' }}
                      >
                        <Play size={10} fill="#ffffff" />
                        Enter
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Role Overview message */}
          <div className="glass-panel" style={styles.overviewBox}>
            <h3 style={styles.boxTitle}>
              {(currentUser.role === 'admin' || currentUser.role === 'owner') ? (
                <>
                  <Shield size={18} color="var(--success)" />
                  {currentUser.role === 'owner' ? 'System Platform Owner Access' : 'System Administrator Access'}
                </>
              ) : currentUser.role === 'creator' && currentUser.status === 'active' ? (
                <>
                  <CheckCircle2 size={18} color="var(--primary)" />
                  Verified Creator Status
                </>
              ) : (
                <>
                  <FileText size={18} color="var(--secondary)" />
                  Learn-o-pia Student Account
                </>
              )}
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginTop: '10px' }}>
              {(currentUser.role === 'admin' || currentUser.role === 'owner') && 
                (currentUser.role === 'owner' 
                  ? 'You are the Owner of this learning portal. You have complete control over the system database, including the power to promote, demote, or suspend administrators and creators, and manage all courses.'
                  : 'You have administrative control over the system database. Use the Admin Panel to verify pending creator registrations, manage student directory access, and promote learners. You can also manage courses in the Studio.')}
              {currentUser.role === 'creator' && currentUser.status === 'active' && 
                'Welcome! Your creator credentials are fully verified. You can now use the Studio tab to compile standard courses, add embedded lecture playlists, and attach reference notes.'}
              {currentUser.role === 'creator' && currentUser.status === 'pending' && 
                'Your application has been registered. Our system administrator is currently auditing your details. You will unlock course creation immediately upon their approval.'}
              {currentUser.role === 'learner' && 
                'As a Learner, you have open access to all curricula created by university educators. You can search courses, enroll in playlists, download resource notes, and play video streams in a distraction-free screen.'}
            </p>
          </div>

          {/* Section 3: Application Triggers for Learners */}
          {currentUser.role === 'learner' && !currentUser.creatorStatus && (
            <div className="glass-panel" style={styles.applicationBox}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Creator Enrollment</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '16px' }}>
                Are you a university professor, teaching assistant, or subject matter expert? Request Creator permissions to publish your own custom course playlists.
              </p>
              
              <button 
                onClick={handleRequestCreator} 
                className="btn btn-primary"
                disabled={loading}
                style={{ padding: '10px 20px', fontSize: '0.85rem' }}
              >
                {loading ? 'Submitting...' : 'Apply for Creator Clearance'}
              </button>
            </div>
          )}

          {/* Section 4: Pending Notification for requested creator */}
          {currentUser.role === 'learner' && currentUser.creatorStatus === 'pending' && (
            <div className="glass-panel" style={{ ...styles.applicationBox, border: '1px dashed var(--warning)', background: 'rgba(245, 158, 11, 0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--warning)', marginBottom: '8px' }}>
                <Clock size={20} />
                <h3 style={{ fontSize: '1.1rem', color: 'var(--warning)', margin: 0 }}>Application Pending</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Your request is waiting on administrator audit. You will unlock course creation immediately upon approval.
              </p>
            </div>
          )}

          {/* Section 5: Rejected Notification with Retry Button */}
          {currentUser.role === 'learner' && currentUser.creatorStatus === 'rejected' && (
            <div className="glass-panel animate-fade-in" style={{ ...styles.applicationBox, border: '1px dashed var(--error)', background: 'rgba(239, 68, 68, 0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--error)', marginBottom: '8px' }}>
                <X size={20} />
                <h3 style={{ fontSize: '1.1rem', color: 'var(--error)', margin: 0 }}>Application Rejected</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '14px' }}>
                Unfortunately, your application for Creator clearance was rejected by the administrator. You can update your details or try resubmitting below.
              </p>
              <button 
                onClick={handleRequestCreator}
                className="btn btn-primary"
                disabled={loading}
                style={{ padding: '8px 16px', fontSize: '0.8rem' }}
              >
                {loading ? 'Submitting...' : 'Retry Application'}
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '10px 0'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '320px 1fr',
    gap: '24px',
    alignItems: 'start',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr'
    }
  },
  card: {
    padding: '30px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center'
  },
  avatarCircle: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 20px var(--primary-glow)'
  },
  infoList: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    margin: '24px 0',
    paddingTop: '20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)'
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: 'var(--text-secondary)',
    textAlign: 'left'
  },
  logoutBtn: {
    width: '100%',
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    color: '#fca5a5',
    padding: '10px 0',
    borderRadius: '8px',
    fontSize: '0.85rem',
    cursor: 'pointer',
    gap: '8px',
    ':hover': {
      background: '#ef4444',
      color: '#ffffff'
    }
  },
  actionsColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    textAlign: 'left'
  },
  overviewBox: {
    padding: '24px'
  },
  boxTitle: {
    fontSize: '1.15rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: '10px'
  },
  applicationBox: {
    padding: '24px'
  },
  enrolledCoursesList: {
    marginTop: '16px'
  },
  emptyEnrolled: {
    padding: '20px 0',
    textAlign: 'center'
  },
  enrolledGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  enrolledCourseCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '10px',
    gap: '16px'
  }
};
