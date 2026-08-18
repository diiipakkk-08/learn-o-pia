import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { GraduationCap, School, BookOpen, Calendar, Phone, Heart, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function OnboardingModal({ isOpen, onComplete }) {
  const { currentUser, updateUserProfile } = useDatabase();

  const [educationLevel, setEducationLevel] = useState('college'); // 'school' | 'college' | 'competitive'
  const [institutionName, setInstitutionName] = useState(currentUser?.college || '');
  const [passingYear, setPassingYear] = useState(currentUser?.passingYear || '2027');
  const [dob, setDob] = useState(currentUser?.dob || '2004-05-15');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [targetExam, setTargetExam] = useState(currentUser?.targetExam || 'JEE / NEET');
  const [interests, setInterests] = useState(currentUser?.interests || 'Programming, Physics & AI');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!institutionName.trim()) {
      setError('Please enter your School, College, or Institute name.');
      return;
    }

    if (!phone.trim() || phone.trim().length < 8) {
      setError('Please enter a valid WhatsApp or contact number.');
      return;
    }

    setSubmitting(true);
    try {
      const profileData = {
        educationLevel,
        college: institutionName.trim(),
        passingYear,
        dob,
        phone: phone.trim(),
        targetExam: educationLevel === 'competitive' ? targetExam : null,
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
        <div style={styles.header}>
          <div style={styles.iconCircle}>
            <GraduationCap size={24} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', margin: 0, color: '#ffffff' }}>Complete Your Learner Profile</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Please provide your educational details to personalize your workspace.
            </p>
          </div>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.83rem', marginBottom: '16px', textAlign: 'left' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Education Level Selector */}
          <div>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>I am a...</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <button
                type="button"
                className={`btn ${educationLevel === 'college' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setEducationLevel('college')}
                style={{ fontSize: '0.78rem', padding: '8px 4px', flexDirection: 'column', gap: 4 }}
              >
                <GraduationCap size={16} /> College Student
              </button>
              <button
                type="button"
                className={`btn ${educationLevel === 'school' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setEducationLevel('school')}
                style={{ fontSize: '0.78rem', padding: '8px 4px', flexDirection: 'column', gap: 4 }}
              >
                <School size={16} /> School Student
              </button>
              <button
                type="button"
                className={`btn ${educationLevel === 'competitive' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setEducationLevel('competitive')}
                style={{ fontSize: '0.78rem', padding: '8px 4px', flexDirection: 'column', gap: 4 }}
              >
                <BookOpen size={16} /> Competitive Exam
              </button>
            </div>
          </div>

          {/* School / College Name */}
          <div>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>
              {educationLevel === 'school' ? 'School Name' : educationLevel === 'college' ? 'College / University Name' : 'Coaching Institute / Self-Study'}
            </label>
            <input
              type="text"
              className="form-input"
              placeholder={educationLevel === 'school' ? 'e.g. St. Xavier Senior Secondary' : 'e.g. MAKAUT / Heritage Institute of Technology'}
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              required
            />
          </div>

          {/* Target Exam (if competitive) */}
          {educationLevel === 'competitive' && (
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Target Examination</label>
              <select className="form-input" value={targetExam} onChange={(e) => setTargetExam(e.target.value)}>
                <option value="JEE Main & Advanced">JEE Main & Advanced</option>
                <option value="NEET Medical">NEET Medical</option>
                <option value="GATE CS / Engineering">GATE CS / Engineering</option>
                <option value="UPSC Civil Services">UPSC Civil Services</option>
                <option value="CAT / MBA Entrance">CAT / MBA Entrance</option>
                <option value="Other Competitive Exam">Other Competitive Exam</option>
              </select>
            </div>
          )}

          {/* Passing Year & Date of Birth */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Passing / Target Year</label>
              <select className="form-input" value={passingYear} onChange={(e) => setPassingYear(e.target.value)}>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2028">2028</option>
                <option value="2029">2029</option>
                <option value="2030+">2030+</option>
              </select>
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
          </div>

          {/* WhatsApp / Contact Number */}
          <div>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>WhatsApp / Contact Number</label>
            <div style={{ position: 'relative' }}>
              <Phone size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 12 }} />
              <input
                type="tel"
                className="form-input"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ paddingLeft: '38px' }}
                required
              />
            </div>
          </div>

          {/* Learning Interests */}
          <div>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Interests & Study Goals</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Data Structures, Web Dev, Organic Chemistry, Self-Development"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '10px', fontSize: '0.95rem', gap: 8 }}
          >
            {submitting ? 'Saving Profile Details…' : 'Save Details & Continue to Platform'} <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '20px'
  },
  modal: {
    width: '100%',
    maxWidth: '520px',
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
