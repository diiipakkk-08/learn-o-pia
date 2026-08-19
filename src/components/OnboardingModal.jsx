import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { GraduationCap, School, BookOpen, Calendar, Phone, Heart, ArrowRight, ArrowLeft, User, Award, CheckCircle2 } from 'lucide-react';

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

export default function OnboardingModal({ isOpen, onComplete }) {
  const { currentUser, updateUserProfile } = useDatabase();

  // Wizard Step: 1 = Personal Info, 2 = Academic Info
  const [step, setStep] = useState(1);

  // Step 1: Personal Details
  const [fullName, setFullName] = useState(currentUser?.name || currentUser?.username || '');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState(() => {
    if (currentUser?.phone) {
      return currentUser.phone.replace(/^\+\d+\s*/, '');
    }
    return '';
  });
  const [dob, setDob] = useState(currentUser?.dob || '2004-05-15');

  // Step 2: Academic Details
  const [educationLevel, setEducationLevel] = useState(currentUser?.educationLevel || 'college');
  const [courseName, setCourseName] = useState(currentUser?.courseName || 'B.Tech Computer Science');
  const [institutionName, setInstitutionName] = useState(currentUser?.college || '');
  const [joiningYear, setJoiningYear] = useState(currentUser?.joiningYear || '2023');
  const [passingYear, setPassingYear] = useState(currentUser?.passingYear || '2027');
  const [interests, setInterests] = useState(currentUser?.interests || 'Programming, Physics & AI');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Auto-calculated total curriculum semesters
  const calculatedSemesters = Math.max(1, (parseInt(passingYear, 10) - parseInt(joiningYear, 10)) * 2);

  const handleNextStep = (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Please enter your Full Name.');
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.trim().length < 7) {
      setError('Please enter a valid mobile number (e.g. 10 digits).');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!institutionName.trim()) {
      setError('Please enter your School, College, or University name.');
      return;
    }

    setSubmitting(true);
    try {
      const fullPhone = `${countryCode} ${phoneNumber.trim()}`;
      const profileData = {
        name: fullName.trim(),
        username: fullName.trim(),
        phone: fullPhone,
        dob,
        educationLevel,
        courseName: courseName.trim(),
        college: institutionName.trim(),
        joiningYear,
        passingYear,
        totalSemesters: calculatedSemesters,
        interests: interests.trim(),
        onboardingCompleted: true
      };

      if (currentUser?.id) {
        localStorage.setItem(`learnopia_onboarding_done_${currentUser.id}`, 'true');
      }
      await updateUserProfile(currentUser?.id, profileData);
      if (onComplete) onComplete();
    } catch (err) {
      console.error('[Onboarding Error]', err);
      setError(err?.message || 'Failed to save onboarding details. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay} className="animate-fade-in">
      <div style={styles.modal} className="glass-panel">
        {/* Step Indicator Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: step === 1 ? 'var(--primary)' : '#10b981',
              color: '#ffffff', fontSize: '0.85rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {step === 1 ? '1' : '✓'}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: step === 1 ? '#ffffff' : 'var(--text-secondary)' }}>
              Personal Info
            </span>

            <span style={{ color: 'var(--text-muted)' }}>➔</span>

            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: step === 2 ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
              color: step === 2 ? '#ffffff' : 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              2
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: step === 2 ? '#ffffff' : 'var(--text-secondary)' }}>
              Academic Info
            </span>
          </div>
        </div>

        {/* Modal Main Header */}
        <div style={styles.header}>
          <div style={styles.iconCircle}>
            {step === 1 ? <User size={24} color="#ffffff" /> : <GraduationCap size={24} color="#ffffff" />}
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', margin: 0, color: '#ffffff' }}>
              {step === 1 ? 'Step 1: Personal Details' : 'Step 2: Academic Details'}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              {step === 1 ? 'Provide your basic contact information.' : 'Tell us about your educational background.'}
            </p>
          </div>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.83rem', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* STEP 1 FORM: PERSONAL DETAILS */}
        {step === 1 && (
          <form onSubmit={handleNextStep} style={styles.form}>
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>WhatsApp / Contact Number</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select
                  className="form-input"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  style={{ width: '135px', flexShrink: 0, padding: '10px 8px', fontSize: '0.83rem' }}
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
                  required
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Date of Birth</label>
              <input
                type="date"
                className="form-input"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', marginTop: '10px', fontSize: '0.92rem', gap: 8 }}
            >
              Continue to Academic Details <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* STEP 2 FORM: ACADEMIC DETAILS */}
        {step === 2 && (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Education Level</label>
              <select className="form-input" value={educationLevel} onChange={(e) => setEducationLevel(e.target.value)}>
                <option value="school">School Student (Up to Class 10)</option>
                <option value="higher_sec">Higher Secondary Student (Class 11 - 12)</option>
                <option value="college">College / University Student (Undergraduate)</option>
                <option value="postgrad">Postgraduate Student (Masters / PhD)</option>
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Course / Stream Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. B.Tech CS, Science Stream, B.Sc Physics"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>
                {educationLevel.includes('school') ? 'School Name' : 'College / University Name'}
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={educationLevel.includes('school') ? 'e.g. St. Xavier Senior Secondary' : 'e.g. Heritage Institute of Technology / MAKAUT'}
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Joining Year</label>
                <select className="form-input" value={joiningYear} onChange={(e) => setJoiningYear(e.target.value)}>
                  {[2020, 2021, 2022, 2023, 2024, 2025, 2026].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Passing Year</label>
                <select className="form-input" value={passingYear} onChange={(e) => setPassingYear(e.target.value)}>
                  {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, background: 'rgba(139,92,246,0.1)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(139,92,246,0.2)' }}>
              🎓 Total Curriculum Semesters: <strong>{calculatedSemesters} Semesters</strong> ({parseInt(passingYear, 10) - parseInt(joiningYear, 10)} Years)
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Interests & Study Goals</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Programming, Artificial Intelligence, Web Dev"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(1)}
                style={{ padding: '10px 14px', fontSize: '0.88rem' }}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ flex: 1, padding: '12px', fontSize: '0.92rem', gap: 8 }}
              >
                {submitting ? 'Saving Profile...' : 'Complete Profile & Start Learning'} <CheckCircle2 size={18} />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 10000,
    padding: '20px'
  },
  modal: {
    width: '100%',
    maxWidth: '500px',
    padding: '28px',
    borderRadius: '24px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
    textAlign: 'left'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '20px'
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: '14px',
    background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  }
};
