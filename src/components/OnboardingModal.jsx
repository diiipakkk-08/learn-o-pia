/**
 * OnboardingModal.jsx
 * Multi-step student workspace initialization wizard for new user profiles.
 */

import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { ArrowRight, ArrowLeft, CheckCircle2, Eye, EyeOff, AlertCircle } from 'lucide-react';

const COUNTRY_CODES = [
  { flag: '🇮🇳', name: 'India', code: '+91' },
  { flag: '🇺🇸', name: 'USA', code: '+1' },
  { flag: '🇬🇧', name: 'UK', code: '+44' },
  { flag: '🇨🇦', name: 'Canada', code: '+1' },
  { flag: '🇦🇺', name: 'Australia', code: '+61' },
  { flag: '🇸🇬', name: 'Singapore', code: '+65' },
  { flag: '🇩🇪', name: 'Germany', code: '+49' },
  { flag: '🇦🇪', name: 'UAE', code: '+971' }
];

export default function OnboardingModal({ user, onComplete }) {
  const { currentUser, updateUserProfile } = useDatabase();
  const targetUser = user || currentUser;

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState(targetUser?.name || '');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState(() => {
    if (targetUser?.phone) {
      return targetUser.phone.replace(/^\+\d+\s*/, '');
    }
    return '';
  });
  const [dob, setDob] = useState(targetUser?.dob || '');

  // Step 2
  const educationLevel = targetUser?.educationLevel || 'college';
  const [courseName, setCourseName] = useState(targetUser?.courseName || '');
  const [institutionName, setInstitutionName] = useState(targetUser?.college || '');
  const [joiningYear, setJoiningYear] = useState(targetUser?.joiningYear || '2023');
  const [passingYear, setPassingYear] = useState(targetUser?.passingYear || '2027');
  const interests = targetUser?.interests || '';

  // Step 3
  const [password, setPassword] = useState(targetUser?.password || '');
  const [confirmPassword, setConfirmPassword] = useState(targetUser?.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const calculatedSemesters = Math.max(1, (parseInt(passingYear, 10) - parseInt(joiningYear, 10)) * 2);

  const handleStep1Next = (e) => {
    e.preventDefault();
    setError('');
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    setStep(2);
  };

  const handleStep2Next = (e) => {
    e.preventDefault();
    setError('');
    if (!courseName.trim()) {
      setError('Please enter your course or major.');
      return;
    }
    if (!institutionName.trim()) {
      setError('Please enter your university or college name.');
      return;
    }
    setStep(3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const enteredPass = password.trim();
    if (enteredPass && enteredPass.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (enteredPass && enteredPass !== confirmPassword.trim()) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const fullPhone = phoneNumber.trim() ? `${countryCode} ${phoneNumber.trim()}` : '';
      const profileData = {
        name: fullName.trim(),
        phone: fullPhone,
        dob,
        educationLevel,
        courseName: courseName.trim(),
        college: institutionName.trim(),
        joiningYear,
        passingYear,
        totalSemesters: calculatedSemesters,
        interests: interests.trim(),
        password: enteredPass || targetUser?.password || '',
        onboardingCompleted: true
      };

      if (targetUser?.id) {
        localStorage.setItem(`learnopia_onboarding_done_${targetUser.id}`, 'true');
      }

      if (updateUserProfile && targetUser?.id) {
        await updateUserProfile(targetUser.id, profileData);
      }
      if (onComplete) onComplete();
    } catch (err) {
      console.error('[Onboarding Error]', err);
      setError(err?.message || 'Could not save profile details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-border-subtle bg-surface p-6 sm:p-8 shadow-modal space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div>
            <span className="font-editorial text-2xl tracking-tight block">
              Student Workspace Setup
            </span>
            <span className="text-xs text-text-muted font-mono-tabular uppercase">
              STEP {step} OF 3 • {step === 1 ? 'PERSONAL' : step === 2 ? 'ACADEMIC' : 'SECURITY'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-6 h-1.5 rounded-full transition-all ${
                  s === step ? 'bg-accent-ink w-8' : s < step ? 'bg-accent-forest' : 'bg-[#E6E2DA]'
                }`}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-[#F8C8C8] bg-accent-danger-bg text-accent-danger text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: PERSONAL DETAILS */}
        {step === 1 && (
          <form onSubmit={handleStep1Next} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1 font-mono-tabular">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Alex Carter"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border-strong text-xs sm:text-sm bg-canvas focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1 font-mono-tabular">
                Phone Number (Optional)
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="px-2.5 py-2.5 rounded-lg border border-border-strong text-xs sm:text-sm bg-canvas focus:outline-none font-mono-tabular"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.name} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-lg border border-border-strong text-xs sm:text-sm bg-canvas focus:outline-none font-mono-tabular"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1 font-mono-tabular">
                Date of Birth (Optional)
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border-strong text-xs sm:text-sm bg-canvas focus:outline-none font-mono-tabular"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark flex items-center justify-center gap-2 hover:opacity-95"
            >
              <span>Continue to Academic Info</span>
              <ArrowRight size={14} />
            </button>
          </form>
        )}

        {/* STEP 2: ACADEMIC DETAILS */}
        {step === 2 && (
          <form onSubmit={handleStep2Next} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1 font-mono-tabular">
                Course / Degree / Major
              </label>
              <input
                type="text"
                placeholder="e.g. B.Tech Computer Science & Engineering"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border-strong text-xs sm:text-sm bg-canvas focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1 font-mono-tabular">
                College / University Name
              </label>
              <input
                type="text"
                placeholder="e.g. Stanford University or MIT"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border-strong text-xs sm:text-sm bg-canvas focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1 font-mono-tabular">
                  Joining Year
                </label>
                <input
                  type="number"
                  value={joiningYear}
                  onChange={(e) => setJoiningYear(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border-strong text-xs sm:text-sm bg-canvas focus:outline-none font-mono-tabular"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1 font-mono-tabular">
                  Graduation Year
                </label>
                <input
                  type="number"
                  value={passingYear}
                  onChange={(e) => setPassingYear(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border-strong text-xs sm:text-sm bg-canvas focus:outline-none font-mono-tabular"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-lg border border-border-strong text-xs font-semibold flex items-center gap-1.5"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark flex items-center justify-center gap-2 hover:opacity-95"
              >
                <span>Continue to Security</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: SECURITY & FINISH */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1 font-mono-tabular">
                Workspace Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-border-strong text-xs sm:text-sm bg-canvas focus:outline-none font-mono-tabular"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1 font-mono-tabular">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border-strong text-xs sm:text-sm bg-canvas focus:outline-none font-mono-tabular"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2.5 rounded-lg border border-border-strong text-xs font-semibold flex items-center gap-1.5"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50"
              >
                {submitting ? 'Setting up workspace...' : 'Complete Setup & Launch'}
                <CheckCircle2 size={14} />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
