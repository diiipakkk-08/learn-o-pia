import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { User, Mail, Award, Shield, FileText, CheckCircle2, Clock, LogOut, Play, BookOpen, Lock, Edit3, Link as LinkIcon, Phone, Building, Sparkles, Check, AlertCircle } from 'lucide-react';

export default function Profile({ setCurrentView, setSelectedPlaylistId }) {
  const { currentUser, courses, requestCreatorStatus, updateUserProfile, logout } = useDatabase();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit Profile Form State
  const [name, setName] = useState(currentUser?.name || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [college, setCollege] = useState(currentUser?.college || '');
  const [department, setDepartment] = useState(currentUser?.department || '');
  const [interests, setInterests] = useState(currentUser?.interests || '');
  const [idCardLink, setIdCardLink] = useState(currentUser?.idCardLink || '');

  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  if (!currentUser) return null;

  const handleRequestCreator = () => {
    setLoading(true);
    setTimeout(() => {
      requestCreatorStatus(currentUser.id);
      setLoading(false);
    }, 600);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess('');

    const res = await updateUserProfile(currentUser.id, {
      name,
      username,
      phone,
      college,
      department,
      interests,
      idCardLink
    });

    if (res.success) {
      setSaveSuccess('Profile details saved successfully!');
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(''), 3000);
    } else {
      setSaveError(res.error || 'Failed to save profile details.');
    }
  };

  // Filter courses user has purchased/enrolled in
  const myEnrolledCourses = courses.filter(c => currentUser.enrolledCourses?.includes(c.id));

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* Top Banner & Status */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={styles.avatarCircle}>
            <User size={36} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.4rem', margin: 0, color: '#ffffff' }}>{currentUser.name}</h2>
              {currentUser.isVerified && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '3px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 }}>
                  <CheckCircle2 size={13} /> Verified Student
                </span>
              )}
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{currentUser.username || '@student'} · {currentUser.email}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => setIsEditing(!isEditing)}>
            <Edit3 size={15} /> {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </button>
          <button onClick={logout} className="btn btn-secondary" style={{ color: 'var(--error)' }}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div style={{ padding: '12px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', color: '#10b981', marginBottom: '20px', textAlign: 'left', fontSize: '0.88rem' }}>
          <Check size={16} style={{ display: 'inline', marginRight: 6 }} /> {saveSuccess}
        </div>
      )}

      {/* Profile Edit Form / Overview Grid */}
      {isEditing ? (
        <form onSubmit={handleSaveProfile} className="glass-panel animate-fade-in" style={{ padding: '24px', textAlign: 'left', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={18} color="var(--primary)" /> Edit Profile & Verification Details
          </h3>

          {saveError && (
            <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#f87171', marginBottom: '16px', fontSize: '0.85rem' }}>
              <AlertCircle size={14} style={{ display: 'inline', marginRight: 6 }} /> {saveError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            {/* Full Name */}
            <div>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>
                Full Name {currentUser.isVerified && <span style={{ color: 'var(--text-muted)' }}>(Locked: Account Verified)</span>}
              </label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={currentUser.isVerified}
                style={{ opacity: currentUser.isVerified ? 0.6 : 1 }}
                required
              />
            </div>

            {/* Username */}
            <div>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>
                Unique Username {currentUser.isVerified && <span style={{ color: 'var(--text-muted)' }}>(Locked: Account Verified)</span>}
              </label>
              <input
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="@alex_carter"
                disabled={currentUser.isVerified}
                style={{ opacity: currentUser.isVerified ? 0.6 : 1 }}
                required
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>Phone Number</label>
              <input
                type="text"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
              />
            </div>

            {/* College Name */}
            <div>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>College / University Name</label>
              <input
                type="text"
                className="form-input"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="e.g. MAKAUT Campus"
              />
            </div>

            {/* Department */}
            <div>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>Department / Branch</label>
              <input
                type="text"
                className="form-input"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. CSE / IT / ECE"
              />
            </div>

            {/* Interests */}
            <div>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>Academic Interests</label>
              <input
                type="text"
                className="form-input"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="e.g. Web Development, Physics, AI"
              />
            </div>
          </div>

          {/* Verification Document Link */}
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '6px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield size={16} color="var(--primary)" /> Student ID Verification (College ID Drive Link)
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Paste a Google Drive or image URL of your college ID card for account verification. Verified students get a verified badge and locked username.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="url"
                className="form-input"
                placeholder="https://drive.google.com/file/d/..."
                value={idCardLink}
                onChange={(e) => setIdCardLink(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Profile Details
            </button>
          </div>
        </form>
      ) : null}

      <div className="profile-grid-layout">
        {/* LEFT COLUMN: Profile Summary Card */}
        <div className="glass-panel" style={styles.card}>
          <h3 style={{ fontSize: '1rem', color: '#ffffff', marginBottom: '14px', textAlign: 'left' }}>Profile Details</h3>

          <div style={styles.infoList}>
            <div style={styles.infoItem}>
              <User size={15} color="var(--text-muted)" />
              <span style={{ fontSize: '0.85rem' }}>Username: <strong>{currentUser.username || '@user'}</strong></span>
            </div>
            <div style={styles.infoItem}>
              <Mail size={15} color="var(--text-muted)" />
              <span style={{ fontSize: '0.85rem' }}>{currentUser.email}</span>
            </div>
            <div style={styles.infoItem}>
              <Phone size={15} color="var(--text-muted)" />
              <span style={{ fontSize: '0.85rem' }}>{currentUser.phone || 'Not provided'}</span>
            </div>
            <div style={styles.infoItem}>
              <Building size={15} color="var(--text-muted)" />
              <span style={{ fontSize: '0.85rem' }}>{currentUser.college || 'MAKAUT / University'}</span>
            </div>
            <div style={styles.infoItem}>
              <Sparkles size={15} color="var(--text-muted)" />
              <span style={{ fontSize: '0.85rem' }}>Interests: {currentUser.interests || 'Programming'}</span>
            </div>
          </div>

          {/* Verification Badge Box */}
          <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Verification Status</span>
            <div style={{ marginTop: '4px' }}>
              {currentUser.isVerified ? (
                <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={15} /> Account Verified
                </span>
              ) : currentUser.verificationStatus === 'pending' ? (
                <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={15} /> Verification Pending Admin Review
                </span>
              ) : (
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                  Unverified (Edit profile to submit ID link)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Creator Applications & Enrolled Courses */}
        <div style={styles.actionsColumn}>
          {/* Creator status application box */}
          {currentUser.role === 'learner' && (
            <div className="glass-panel" style={styles.overviewBox}>
              <h3 style={styles.boxTitle}>
                <Shield size={18} color="var(--primary)" />
                Instructor & Creator Portal Access
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'left', lineHeight: '1.5' }}>
                Want to build playlists, publish lectures, and upload study materials? Apply for Creator Studio privileges.
              </p>

              <div style={{ marginTop: '16px', textAlign: 'left' }}>
                {currentUser.creatorStatus === 'pending' ? (
                  <div style={styles.statusBoxPending}>
                    <Clock size={16} color="var(--warning)" />
                    <span>Application Submitted. Pending Admin approval.</span>
                  </div>
                ) : (
                  <button 
                    onClick={handleRequestCreator} 
                    disabled={loading} 
                    className="btn btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                  >
                    {loading ? 'Submitting Application…' : 'Apply for Creator Privileges'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Enrolled Courses List */}
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
                        </div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff', marginTop: '4px' }}>
                          {course.title}
                        </h4>
                      </div>
                      
                      <button 
                        onClick={() => handleEnterCourse(course.id)} 
                        className="btn btn-primary btn-sm"
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                      >
                        <Play size={12} /> Open Course
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box'
  },
  card: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left'
  },
  avatarCircle: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  infoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '12px'
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: 'var(--text-secondary)'
  },
  actionsColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  overviewBox: {
    padding: '24px'
  },
  boxTitle: {
    fontSize: '1.1rem',
    margin: '0 0 12px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  statusBoxPending: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    borderRadius: '8px',
    background: 'rgba(245, 158, 11, 0.15)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    color: 'var(--warning)',
    fontSize: '0.85rem'
  },
  enrolledCoursesList: {
    marginTop: '12px'
  },
  emptyEnrolled: {
    padding: '20px',
    textAlign: 'center'
  },
  enrolledGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '12px'
  },
  enrolledCourseCard: {
    padding: '16px',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'flex-start'
  }
};
