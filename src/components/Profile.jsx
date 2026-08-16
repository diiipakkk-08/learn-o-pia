import React, { useState } from 'react';
import { useDatabase, getUserDesignation } from '../context/DatabaseContext';
import { User, Mail, Award, Shield, FileText, CheckCircle2, Clock, LogOut, Play, BookOpen, Lock, Edit3, Link as LinkIcon, Phone, Building, Sparkles, Check, AlertCircle, KeyRound, Scale } from 'lucide-react';
import TermsModal from './TermsModal';

export default function Profile({ setCurrentView, setSelectedPlaylistId }) {
  const { currentUser, courses, setPasswordForUser, updateUserProfile, logout } = useDatabase();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordBox, setShowPasswordBox] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Edit Profile Form State
  const [name, setName] = useState(currentUser?.name || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [college, setCollege] = useState(currentUser?.college || '');
  const [department, setDepartment] = useState(currentUser?.department || '');
  const [interests, setInterests] = useState(currentUser?.interests || '');
  const [verificationType, setVerificationType] = useState(currentUser?.verificationType || 'student');
  const [idCardLink, setIdCardLink] = useState(currentUser?.idCardLink || '');

  // Password Management State
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passError, setPassError] = useState('');

  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  if (!currentUser) return null;

  const formattedDesignation = getUserDesignation(currentUser);

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
      verificationType,
      idCardLink
    });

    if (res.success) {
      setSaveSuccess('Profile details and verification request submitted successfully!');
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(''), 3500);
    } else {
      setSaveError(res.error || 'Failed to save profile details.');
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassMsg('');

    if (!newPass || newPass.length < 6) {
      setPassError('Password must be at least 6 characters long.');
      return;
    }

    if (newPass !== confirmPass) {
      setPassError('Passwords do not match.');
      return;
    }

    await setPasswordForUser(currentUser.id, newPass);
    setPassMsg('Password saved! You can now log in using email/username and this password.');
    setNewPass('');
    setConfirmPass('');
    setTimeout(() => setPassMsg(''), 4000);
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.4rem', margin: 0, color: '#ffffff' }}>{formattedDesignation}</h2>
              {currentUser.isVerified ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '3px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 }}>
                  <CheckCircle2 size={13} /> {currentUser.verificationType === 'professor' ? 'Verified Professor' : currentUser.verificationType === 'creator' ? 'Verified Creator' : 'Verified Student'}
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', padding: '3px 8px', borderRadius: '999px', fontSize: '0.72rem' }}>
                  Unverified Account
                </span>
              )}
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{currentUser.username || '@user'} · {currentUser.email}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => setIsEditing(!isEditing)}>
            <Edit3 size={15} /> {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </button>
          <button className="btn btn-secondary" onClick={() => setShowPasswordBox(!showPasswordBox)}>
            <KeyRound size={15} /> {currentUser.password ? 'Change Password' : 'Set Password'}
          </button>
          <button className="btn btn-secondary" onClick={() => setShowTermsModal(true)}>
            <Scale size={15} color="var(--primary)" /> Policies & Terms
          </button>
          <button onClick={logout} className="btn btn-secondary" style={{ color: 'var(--error)' }}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </div>

      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />

      {saveSuccess && (
        <div style={{ padding: '12px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', color: '#10b981', marginBottom: '20px', textAlign: 'left', fontSize: '0.88rem' }}>
          <Check size={16} style={{ display: 'inline', marginRight: 6 }} /> {saveSuccess}
        </div>
      )}

      {/* PASSWORD LINKING & CHANGE PASSWORD BOX */}
      {showPasswordBox && (
        <form onSubmit={handleSavePassword} className="glass-panel animate-fade-in" style={{ padding: '20px', textAlign: 'left', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1rem', color: '#ffffff', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <KeyRound size={18} color="var(--primary)" /> {currentUser.password ? 'Change Password' : 'Set Password & Enable Password Login'}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            {currentUser.password
              ? 'Update your password for standard email/username sign-in.'
              : 'Logged in with Google? Set a password here to enable logging in via username/email + password on any browser!'}
          </p>

          {passError && (
            <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#f87171', marginBottom: '12px', fontSize: '0.83rem' }}>
              <AlertCircle size={14} style={{ display: 'inline', marginRight: 6 }} /> {passError}
            </div>
          )}

          {passMsg && (
            <div style={{ padding: '8px 12px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: '#34d399', marginBottom: '12px', fontSize: '0.83rem' }}>
              <Check size={14} style={{ display: 'inline', marginRight: 6 }} /> {passMsg}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="At least 6 characters"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>Confirm Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Re-enter new password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-sm">
            Save Password Settings
          </button>
        </form>
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

          {/* Verification Option Selection */}
          <div style={{ padding: '18px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '6px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield size={16} color="var(--primary)" /> Account Verification Type & ID Document Link
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Selecting a verification category awards your designation badge (e.g., <strong>St. Deepak Shaw</strong>, <strong>Prof. Deepak Shaw</strong>, or <strong>Creator. Deepak Shaw</strong>) and unlocks discussion thread creation and Studio access upon admin approval.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', background: verificationType === 'student' ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.02)', border: verificationType === 'student' ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', fontSize: '0.82rem' }}>
                <input type="radio" name="verifType" value="student" checked={verificationType === 'student'} onChange={() => setVerificationType('student')} />
                <span>🎓 Student Verification (St.)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', background: verificationType === 'professor' ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.02)', border: verificationType === 'professor' ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', fontSize: '0.82rem' }}>
                <input type="radio" name="verifType" value="professor" checked={verificationType === 'professor'} onChange={() => setVerificationType('professor')} />
                <span>👨‍🏫 Professor Verification (Prof.)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', background: verificationType === 'creator' ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.02)', border: verificationType === 'creator' ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', fontSize: '0.82rem' }}>
                <input type="radio" name="verifType" value="creator" checked={verificationType === 'creator'} onChange={() => setVerificationType('creator')} />
                <span>✨ Creator Verification (Creator.)</span>
              </label>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>Verification Document / ID Card Drive Link</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://drive.google.com/file/d/..."
                value={idCardLink}
                onChange={(e) => setIdCardLink(e.target.value)}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                {verificationType === 'student' && 'Upload student ID card link.'}
                {verificationType === 'professor' && 'Upload faculty designation or university ID document link.'}
                {verificationType === 'creator' && 'Upload YouTube channel / portfolio link explaining your educator status.'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Submit Profile Details & Verification
            </button>
          </div>
        </form>
      ) : null}

      <div className="profile-grid-layout">
        {/* LEFT COLUMN: Profile Summary Card */}
        <div className="glass-panel" style={styles.card}>
          <h3 style={{ fontSize: '1rem', color: '#ffffff', marginBottom: '14px', textAlign: 'left' }}>Profile Information</h3>

          <div style={styles.infoList}>
            <div style={styles.infoItem}>
              <User size={15} color="var(--text-muted)" />
              <span style={{ fontSize: '0.85rem' }}>Designation: <strong>{formattedDesignation}</strong></span>
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
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Verification Clearance</span>
            <div style={{ marginTop: '4px' }}>
              {currentUser.isVerified ? (
                <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={15} /> Verified {currentUser.verificationType === 'professor' ? 'Professor' : currentUser.verificationType === 'creator' ? 'Creator' : 'Student'}
                </span>
              ) : currentUser.verificationStatus === 'pending' ? (
                <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={15} /> Verification Pending Admin Review
                </span>
              ) : (
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                  Unverified Account (Click Edit Profile to opt for verification)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Enrolled Courses */}
        <div style={styles.actionsColumn}>
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
                        onClick={() => {
                          setSelectedPlaylistId(course.id);
                          setCurrentView('learning-player');
                        }} 
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
    width: '60px',
    height: '60px',
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
