import React, { useState, useEffect } from 'react';
import { useDatabase, getUserDesignation } from '../context/DatabaseContext';
import { User, Mail, Award, Shield, FileText, CheckCircle2, Clock, LogOut, Play, BookOpen, Lock, Edit3, Link as LinkIcon, Phone, Building, Sparkles, Check, AlertCircle, KeyRound, Scale, Trash2, AlertTriangle, GraduationCap, Calendar, ExternalLink, MessageSquare, Info, ChevronDown, ChevronUp } from 'lucide-react';
import TermsModal from './TermsModal';

const COUNTRY_CODES = [
  { flag: '🇮🇳', name: 'India', code: '+91' },
  { flag: '🇺🇸', name: 'USA', code: '+1' },
  { flag: '🇬🇧', name: 'UK', code: '+44' },
  { flag: '🇨🇦', name: 'Canada', code: '+1' },
  { flag: '🇦🇺', name: 'Australia', code: '+61' },
  { flag: '🇦🇪', name: 'UAE', code: '+971' },
  { flag: '🇸🇬', name: 'Singapore', code: '+65' },
  { flag: '🇩🇪', name: 'Germany', code: '+49' },
  { flag: '🇫🇷', name: 'France', code: '+33' },
  { flag: '🇧🇩', name: 'Bangladesh', code: '+880' },
  { flag: '🇳🇵', name: 'Nepal', code: '+977' },
  { flag: '🇵🇰', name: 'Pakistan', code: '+92' },
  { flag: '🇱🇰', name: 'Sri Lanka', code: '+94' },
  { flag: '🇳🇬', name: 'Nigeria', code: '+234' },
  { flag: '🇰🇪', name: 'Kenya', code: '+254' },
  { flag: '🇿🇦', name: 'South Africa', code: '+27' },
  { flag: '🇸🇦', name: 'Saudi Arabia', code: '+966' },
  { flag: '🇧🇷', name: 'Brazil', code: '+55' },
  { flag: '🇯🇵', name: 'Japan', code: '+81' }
];

export default function Profile({ setCurrentView, setSelectedPlaylistId }) {
  const { currentUser, courses, setPasswordForUser, updateUserProfile, logout, deleteUserAccount, unverifyUser } = useDatabase();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordBox, setShowPasswordBox] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUnverifyConfirmModal, setShowUnverifyConfirmModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const [showNavMenu, setShowNavMenu] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Edit Profile Form State
  const [name, setName] = useState(currentUser?.name || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState(() => {
    if (currentUser?.phone) {
      return currentUser.phone.replace(/^\+\d+\s*/, '');
    }
    return '';
  });
  const [dob, setDob] = useState(currentUser?.dob || '');
  const [educationLevel, setEducationLevel] = useState(currentUser?.educationLevel || 'college');
  const [courseName, setCourseName] = useState(currentUser?.courseName || '');
  const [college, setCollege] = useState(currentUser?.college || '');
  const [department, setDepartment] = useState(currentUser?.department || '');
  const [joiningYear, setJoiningYear] = useState(currentUser?.joiningYear || '2023');
  const [passingYear, setPassingYear] = useState(currentUser?.passingYear || '2027');
  const [interests, setInterests] = useState(currentUser?.interests || '');
  const [verificationType, setVerificationType] = useState(currentUser?.verificationType || 'student');
  const [idCardLink, setIdCardLink] = useState(currentUser?.idCardLink || '');

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setUsername(currentUser.username || '');
      if (currentUser.phone) {
        setPhoneNumber(currentUser.phone.replace(/^\+\d+\s*/, ''));
      }
      setDob(currentUser.dob || '');
      setEducationLevel(currentUser.educationLevel || 'college');
      setCourseName(currentUser.courseName || '');
      setCollege(currentUser.college || '');
      setDepartment(currentUser.department || '');
      setJoiningYear(currentUser.joiningYear || '2023');
      setPassingYear(currentUser.passingYear || '2027');
      setInterests(currentUser.interests || '');
      setVerificationType(currentUser.verificationType || 'student');
      setIdCardLink(currentUser.idCardLink || '');
    }
  }, [currentUser]);

  // Password Management State
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passError, setPassError] = useState('');

  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  if (!currentUser) return null;

  const formattedDesignation = getUserDesignation(currentUser);
  const calculatedSemesters = Math.max(1, (parseInt(passingYear, 10) - parseInt(joiningYear, 10)) * 2);

  const handleSaveProfile = async (e, isRequestingVerification = false) => {
    if (e && e.preventDefault) e.preventDefault();
    setSaveError('');
    setSaveSuccess('');

    if (isRequestingVerification && !idCardLink.trim()) {
      setSaveError('Please provide your ID card / Document Drive link to submit for verification.');
      return;
    }

    const fullPhone = phoneNumber.trim() ? `${countryCode} ${phoneNumber.trim()}` : (currentUser?.phone || '');
    const newVerifStatus = isRequestingVerification 
      ? 'pending' 
      : (currentUser.isVerified ? 'verified' : (currentUser?.verificationStatus === 'pending' ? 'pending' : 'none'));

    const res = await updateUserProfile(currentUser.id, {
      name,
      phone: fullPhone,
      dob,
      educationLevel,
      courseName,
      college,
      department,
      joiningYear,
      passingYear,
      totalSemesters: calculatedSemesters,
      interests,
      verificationType,
      idCardLink,
      verificationStatus: newVerifStatus
    });

    if (res.success) {
      setSaveSuccess(isRequestingVerification 
        ? 'Profile details and verification request submitted to admin successfully!' 
        : 'Profile details saved successfully!');
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(''), 3500);
    } else {
      setSaveError(res.error || 'Failed to save profile details.');
    }
  };

  const handleConfirmUnverify = async () => {
    if (unverifyUser) {
      await unverifyUser(currentUser.id);
    }
    setShowUnverifyConfirmModal(false);
    setIsEditing(true);
    setSaveSuccess('Account unverified. All credentials are now unlocked for editing.');
    setTimeout(() => setSaveSuccess(''), 4000);
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

  const handleConfirmDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      if (deleteUserAccount) {
        await deleteUserAccount(currentUser?.id);
      } else {
        await logout();
      }
      if (setCurrentView) setCurrentView('dashboard');
    } catch (err) {
      console.error('[Delete Account Error]', err);
    } finally {
      setDeletingAccount(false);
      setShowDeleteModal(false);
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
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{currentUser.email}</span>
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
            <KeyRound size={18} color="var(--primary)" /> {currentUser.password ? 'Change Password' : 'Set Password & Enable Direct Sign-In'}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            {currentUser.password
              ? 'Update your password for standard email and password sign-in.'
              : 'Logged in with Google? Set a password here to enable logging in via email and password on any device!'}
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

      {/* Profile Edit Form Drawer */}
      {isEditing ? (
        <form onSubmit={handleSaveProfile} className="glass-panel animate-fade-in" style={{ padding: '24px', marginBottom: '24px', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit3 size={18} color="var(--primary)" /> Edit Profile & Academic Credentials
            </h3>
            <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary btn-sm">
              Cancel
            </button>
          </div>

          {currentUser.isVerified && (
            <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: '#34d399', marginBottom: '16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={16} /> <strong>Verified Account:</strong> Your core identity details (Name, Phone, College, Verification Type) are locked. Click "Request Un-verification & Edit Details" above if you wish to reset verification and update them.
            </div>
          )}

          {saveError && (
            <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#f87171', marginBottom: '16px', fontSize: '0.85rem' }}>
              <AlertCircle size={14} style={{ display: 'inline', marginRight: 6 }} /> {saveError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            {/* Full Name */}
            <div>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>
                Full Name {currentUser.isVerified && <span style={{ color: 'var(--text-muted)' }}>(Locked)</span>}
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

            {/* WhatsApp / Phone Number with Country Code Dropdown */}
            <div>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>
                WhatsApp / Contact Number {currentUser.isVerified && <span style={{ color: 'var(--text-muted)' }}>(Locked)</span>}
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select
                  className="form-input"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  disabled={currentUser.isVerified}
                  style={{ width: '130px', flexShrink: 0, padding: '10px 8px', fontSize: '0.82rem', opacity: currentUser.isVerified ? 0.6 : 1 }}
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.name + c.code} value={c.code}>
                      {c.flag} {c.code} ({c.name})
                    </option>
                  ))}
                </select>

                <input
                  type="tel"
                  className="form-input"
                  placeholder="10-digit mobile number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  maxLength={12}
                  disabled={currentUser.isVerified}
                  style={{ flex: 1, opacity: currentUser.isVerified ? 0.6 : 1 }}
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>
                Date of Birth (DOB)
              </label>
              <input
                type="date"
                className="form-input"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                disabled={currentUser.isVerified}
                style={{ opacity: currentUser.isVerified ? 0.6 : 1 }}
              />
            </div>

            {/* Education Level */}
            <div>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>
                Current Education Level
              </label>
              <select
                className="form-input"
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                disabled={currentUser.isVerified}
                style={{ opacity: currentUser.isVerified ? 0.6 : 1 }}
              >
                <option value="school">School Student (Class 6-10)</option>
                <option value="higher_sec">Higher Secondary (Class 11-12)</option>
                <option value="college">College / University Student</option>
                <option value="postgrad">Postgraduate / Researcher</option>
              </select>
            </div>

            {/* Course / Stream */}
            <div>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>
                Course / Stream Name {currentUser.isVerified && <span style={{ color: 'var(--text-muted)' }}>(Locked)</span>}
              </label>
              <input
                type="text"
                className="form-input"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g. B.Tech Computer Science"
                disabled={currentUser.isVerified}
                style={{ opacity: currentUser.isVerified ? 0.6 : 1 }}
              />
            </div>

            {/* College Name */}
            <div>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>
                College / School / University Name {currentUser.isVerified && <span style={{ color: 'var(--text-muted)' }}>(Locked)</span>}
              </label>
              <input
                type="text"
                className="form-input"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="e.g. MAKAUT Campus"
                disabled={currentUser.isVerified}
                style={{ opacity: currentUser.isVerified ? 0.6 : 1 }}
              />
            </div>

            {/* Academic Tenure: Joining & Passing Year */}
            <div>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>
                Academic Tenure (Joining → Passing Year)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <select
                  className="form-input"
                  value={joiningYear}
                  onChange={(e) => setJoiningYear(e.target.value)}
                  disabled={currentUser.isVerified}
                  style={{ opacity: currentUser.isVerified ? 0.6 : 1 }}
                >
                  {[2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028].map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
                <select
                  className="form-input"
                  value={passingYear}
                  onChange={(e) => setPassingYear(e.target.value)}
                  disabled={currentUser.isVerified}
                  style={{ opacity: currentUser.isVerified ? 0.6 : 1 }}
                >
                  {[2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032].map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Calculated Curriculum: {calculatedSemesters} Semesters
              </span>
            </div>

            {/* Interests */}
            <div>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>Academic Interests & Goals</label>
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
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', background: verificationType === 'student' ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.02)', border: verificationType === 'student' ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.06)', cursor: currentUser.isVerified ? 'not-allowed' : 'pointer', fontSize: '0.82rem', opacity: currentUser.isVerified ? 0.6 : 1 }}>
                <input type="radio" name="verifType" value="student" checked={verificationType === 'student'} onChange={() => !currentUser.isVerified && setVerificationType('student')} disabled={currentUser.isVerified} />
                <span>🎓 Student Verification (St.)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', background: verificationType === 'professor' ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.02)', border: verificationType === 'professor' ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.06)', cursor: currentUser.isVerified ? 'not-allowed' : 'pointer', fontSize: '0.82rem', opacity: currentUser.isVerified ? 0.6 : 1 }}>
                <input type="radio" name="verifType" value="professor" checked={verificationType === 'professor'} onChange={() => !currentUser.isVerified && setVerificationType('professor')} disabled={currentUser.isVerified} />
                <span>👨‍🏫 Professor Verification (Prof.)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', background: verificationType === 'creator' ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.02)', border: verificationType === 'creator' ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.06)', cursor: currentUser.isVerified ? 'not-allowed' : 'pointer', fontSize: '0.82rem', opacity: currentUser.isVerified ? 0.6 : 1 }}>
                <input type="radio" name="verifType" value="creator" checked={verificationType === 'creator'} onChange={() => !currentUser.isVerified && setVerificationType('creator')} disabled={currentUser.isVerified} />
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
                disabled={currentUser.isVerified}
                style={{ opacity: currentUser.isVerified ? 0.6 : 1 }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                {verificationType === 'student' && 'Upload student ID card link.'}
                {verificationType === 'professor' && 'Upload faculty designation or university ID document link.'}
                {verificationType === 'creator' && 'Upload YouTube channel / portfolio link explaining your educator status.'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </button>

            {!currentUser.isVerified && (
              <button
                type="button"
                onClick={(e) => handleSaveProfile(e, false)}
                className="btn btn-secondary"
                style={{ borderColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}
              >
                💾 Save Details
              </button>
            )}

            <button
              type="button"
              onClick={(e) => handleSaveProfile(e, true)}
              className="btn btn-primary"
              style={{ gap: 6 }}
            >
              <Shield size={15} /> {currentUser.isVerified ? 'Save & Re-verify' : 'Save & Submit for Verification'}
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
            {currentUser.dob && (
              <div style={styles.infoItem}>
                <Calendar size={15} color="var(--text-muted)" />
                <span style={{ fontSize: '0.85rem' }}>DOB: {currentUser.dob}</span>
              </div>
            )}
            <div style={styles.infoItem}>
              <GraduationCap size={15} color="var(--text-muted)" />
              <span style={{ fontSize: '0.85rem' }}>
                Level: <strong style={{ textTransform: 'capitalize' }}>{currentUser.educationLevel?.replace('_', ' ') || 'Undergraduate'}</strong>
                {currentUser.courseName && ` · ${currentUser.courseName}`}
              </span>
            </div>
            <div style={styles.infoItem}>
              <Building size={15} color="var(--text-muted)" />
              <span style={{ fontSize: '0.85rem' }}>{currentUser.college || 'Institution not specified'}</span>
            </div>
            {(currentUser.joiningYear || currentUser.passingYear) && (
              <div style={styles.infoItem}>
                <Clock size={15} color="var(--text-muted)" />
                <span style={{ fontSize: '0.85rem' }}>
                  Tenure: {currentUser.joiningYear || '2023'} – {currentUser.passingYear || '2027'} ({currentUser.totalSemesters || 8} Semesters)
                </span>
              </div>
            )}
            <div style={styles.infoItem}>
              <Sparkles size={15} color="var(--text-muted)" />
              <span style={{ fontSize: '0.85rem' }}>Interests: {currentUser.interests || 'Programming & Technology'}</span>
            </div>
            {currentUser.idCardLink && (
              <div style={styles.infoItem}>
                <LinkIcon size={15} color="var(--text-muted)" />
                <a
                  href={currentUser.idCardLink}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '0.82rem', color: 'var(--primary)', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  Submitted Document Link <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>

          {/* Verification Badge Box */}
          <div style={{ marginTop: '20px', padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Verification Clearance</span>
            <div style={{ marginTop: '6px' }}>
              {currentUser.isVerified || currentUser.verificationStatus === 'verified' ? (
                <div style={{ color: '#10b981', fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={16} /> Verified {currentUser.verificationType === 'professor' ? 'Professor (Prof.)' : currentUser.verificationType === 'creator' ? 'Creator (Creator.)' : 'Student (St.)'}
                </div>
              ) : currentUser.verificationStatus === 'pending' ? (
                <div>
                  <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={16} /> Verification Pending Admin Review
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                    Your document link was submitted and is currently in the verification queue for admin approval.
                  </p>
                </div>
              ) : currentUser.verificationStatus === 'rejected' ? (
                <div>
                  <div style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertCircle size={16} /> Verification Request Canceled / Rejected
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 8px 0' }}>
                    Your previous verification document was rejected by an administrator. Please review your details and re-apply.
                  </p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.78rem', padding: '5px 10px', color: 'var(--primary)', borderColor: 'var(--primary)' }}
                  >
                    🔄 Re-apply for Verification
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 6 }}>
                    Unverified Account
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.78rem', padding: '5px 10px' }}
                  >
                    🛡️ Apply for Verification
                  </button>
                </div>
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

      {isMobile && (
        <div className="glass-panel" style={{ padding: '20px', marginTop: '24px', textAlign: 'left' }}>
          <h3 style={{ fontSize: '1rem', color: '#ffffff', marginBottom: '14px', fontWeight: 700 }}>
            Account Quick Navigation
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => setCurrentView('learning')}
              style={styles.mobileNavItem}
            >
              <BookOpen size={20} color="var(--primary)" />
              <span>Learning Dashboard</span>
            </button>
            <button
              onClick={() => setCurrentView('attendance')}
              style={styles.mobileNavItem}
            >
              <Calendar size={20} color="#10b981" />
              <span>Attendance Tracker</span>
            </button>
            <button
              onClick={() => setCurrentView('discussions')}
              style={styles.mobileNavItem}
            >
              <MessageSquare size={20} color="#f59e0b" />
              <span>Discussions Stream</span>
            </button>
            {((currentUser.role === 'creator' && currentUser.status === 'active') || currentUser.role === 'admin' || currentUser.role === 'owner') && (
              <button
                onClick={() => setCurrentView('studio')}
                style={styles.mobileNavItem}
              >
                <Sparkles size={20} color="#a78bfa" />
                <span>Creator Studio Workspace</span>
              </button>
            )}
            {(currentUser.role === 'admin' || currentUser.role === 'owner') && (
              <button
                onClick={() => setCurrentView('admin')}
                style={styles.mobileNavItem}
              >
                <Shield size={20} color="#ef4444" />
                <span>Admin Management Panel</span>
              </button>
            )}
            <button
              onClick={() => setCurrentView('landing')}
              style={styles.mobileNavItem}
            >
              <ExternalLink size={20} color="var(--text-muted)" />
              <span>About & Landing Page</span>
            </button>
            <button
              onClick={logout}
              style={{ ...styles.mobileNavItem, color: '#ef4444', marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* UN-VERIFY CONFIRMATION MODAL */}
      <div className="glass-panel" style={{ padding: '24px', marginTop: '24px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.03)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', textAlign: 'left' }}>
        <div>
          <h4 style={{ color: '#f87171', margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trash2 size={18} /> Danger Zone: Delete Account
          </h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '6px 0 0 0' }}>
            Permanently delete your account, enrolled courses, attendance routines, and learning progress. This action cannot be reversed.
          </p>
        </div>
        <button onClick={() => setShowDeleteModal(true)} className="btn" style={{ background: '#ef4444', color: '#ffffff', fontWeight: 600, padding: '10px 18px', borderRadius: '12px', border: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Trash2 size={16} /> Delete Account
        </button>
      </div>

      {/* UN-VERIFY CONFIRMATION MODAL */}
      {showUnverifyConfirmModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '20px'
        }} className="animate-fade-in">
          <div className="glass-panel" style={{
            maxWidth: '500px', width: '100%', padding: '28px', borderRadius: '24px',
            border: '1px solid rgba(245, 158, 11, 0.5)', background: 'rgba(20, 16, 10, 0.95)', textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '10px', borderRadius: '14px' }}>
                <AlertTriangle size={28} color="#f59e0b" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', margin: 0, color: '#ffffff' }}>Unlock & Edit Verified Credentials?</h3>
                <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600 }}>🔓 Reset Verification to Unverified</span>
              </div>
            </div>

            <div style={{
              padding: '14px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.25)', color: 'var(--text-secondary)',
              fontSize: '0.83rem', lineHeight: 1.6, marginBottom: '18px'
            }}>
              Your account currently holds verified credentials. To change your Name, Username, Institution, or other details, your verified badge will be removed and status changed to <strong>Unverified</strong>.
              <br /><br />
              All fields will be unlocked immediately so you can make changes and submit a new document link for re-verification.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowUnverifyConfirmModal(false)}>
                Cancel
              </button>
              <button
                onClick={handleConfirmUnverify}
                className="btn"
                style={{ background: '#f59e0b', color: '#000000', fontWeight: 700, padding: '10px 18px', borderRadius: '12px', border: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Check size={16} /> Yes, Unlock & Edit Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CENTERED CRITICAL DELETE ACCOUNT WARNING MODAL */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '20px'
        }} className="animate-fade-in">
          <div className="glass-panel" style={{
            maxWidth: '500px', width: '100%', padding: '28px', borderRadius: '24px',
            border: '1px solid rgba(239, 68, 68, 0.5)', background: 'rgba(18, 14, 24, 0.95)', textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '14px' }}>
                <AlertTriangle size={28} color="#ef4444" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', margin: 0, color: '#ffffff' }}>Permanently Delete Account?</h3>
                <span style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: 600 }}>⚠️ Irreversible Action</span>
              </div>
            </div>

            <div style={{
              padding: '14px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)', color: 'var(--text-secondary)',
              fontSize: '0.83rem', lineHeight: 1.6, marginBottom: '18px'
            }}>
              Deleting your account will <strong>PERMANENTLY ERASE all your profile details, enrolled courses, attendance routines, and discussion records</strong>.
              <br /><br />
              🚨 You will be logged out immediately and will NOT be able to recover this data.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel & Keep Account
              </button>
              <button
                onClick={handleConfirmDeleteAccount}
                disabled={deletingAccount}
                className="btn"
                style={{ background: '#ef4444', color: '#ffffff', fontWeight: 700, padding: '10px 18px', borderRadius: '12px', border: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Trash2 size={16} /> {deletingAccount ? 'Deleting...' : 'Yes, Permanently Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
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
  },
  mobileNavSection: {
    padding: '16px',
    borderRadius: '16px',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    background: 'rgba(139, 92, 246, 0.05)'
  },
  mobileNavToggle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    background: 'none',
    border: 'none',
    color: '#ffffff',
    cursor: 'pointer',
    padding: '8px 0',
    fontFamily: 'var(--font-body)'
  },
  mobileNavMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255,255,255,0.08)'
  },
  mobileNavItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    color: '#ffffff',
    fontSize: '0.88rem',
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
    fontFamily: 'var(--font-body)'
  }
};
