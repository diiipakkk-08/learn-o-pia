/**
 * OnboardingModal.jsx -> Full-Page Student Workspace Initialization
 * Handles profile completion with structured qualification dropdowns,
 * mandatory field validations (phone, DOB, qualification), and zero pop-up blur.
 */

import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  User,
  Phone,
  Calendar,
  Briefcase,
  Building2,
  BookOpen,
  LogOut,
  Sparkles
} from 'lucide-react';
import { setPinnedSemester, setAcademicSemestersCount } from '../utils/workspaceFolders';

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

const EMPLOYMENT_OPTIONS = [
  { value: 'student_fulltime', label: 'Full-time Student' },
  { value: 'student_working', label: 'Student with Part-time Work / Internship' },
  { value: 'employed', label: 'Employed / Working Professional' },
  { value: 'self_employed', label: 'Self-Employed / Freelancer' },
  { value: 'exam_prep', label: 'Exam Aspirant (GATE, CAT, UPSC, Govt Exams)' },
  { value: 'job_seeker', label: 'Recent Graduate / Exploring Opportunities' }
];

const QUALIFICATION_LEVELS = [
  { value: 'school', label: 'School' },
  { value: 'diploma', label: 'Diploma / Polytechnic' },
  { value: 'undergraduate', label: 'Undergraduate (UG)' },
  { value: 'postgraduate', label: 'Postgraduate (PG)' }
];

const SCHOOL_CLASSES = [
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'
];

const UG_DEGREES = [
  'B.Tech / B.E. (Bachelor of Technology / Engineering)',
  'B.Sc (Bachelor of Science)',
  'BCA (Bachelor of Computer Applications)',
  'B.Com (Bachelor of Commerce)',
  'BBA (Bachelor of Business Administration)',
  'B.A. (Bachelor of Arts)',
  'B.Des (Bachelor of Design)',
  'MBBS / BDS (Medical / Dental)',
  'B.Pharm (Bachelor of Pharmacy)',
  'Other'
];

const UG_MAJORS = [
  'Computer Science & Engineering (CSE)',
  'Information Technology (IT)',
  'AI & Machine Learning / Data Science',
  'Electronics & Communication Engineering (ECE)',
  'Electrical Engineering (EE)',
  'Mechanical Engineering (ME)',
  'Civil Engineering (CE)',
  'Commerce & Accountancy',
  'Economics & Finance',
  'Business Administration & Management',
  'Physics / Chemistry / Mathematics',
  'Arts & Humanities',
  'Other'
];

const PG_DEGREES = [
  'M.Tech / M.E. (Master of Technology / Engineering)',
  'M.Sc (Master of Science)',
  'MCA (Master of Computer Applications)',
  'MBA (Master of Business Administration)',
  'M.Com (Master of Commerce)',
  'M.A. (Master of Arts)',
  'M.Des (Master of Design)',
  'MS (Master of Science by Research)',
  'MD / MS (Medical Postgraduate)',
  'Other'
];

const DIPLOMA_STREAMS = [
  'Computer Science & Engineering',
  'Information Technology',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Electronics & Telecommunication',
  'Automobile Engineering',
  'Pharmacy',
  'Other'
];

export default function OnboardingModal({ user, onComplete, cinemaMode, onToggleTheme }) {
  const { currentUser, updateUserProfile, logout } = useDatabase();
  const targetUser = user || currentUser;

  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Step 1: Personal Profile ──────────────────────────────────────────────
  const [fullName, setFullName] = useState(targetUser?.name || '');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState(() => {
    if (targetUser?.phone) {
      return targetUser.phone.replace(/^\+\d+\s*/, '');
    }
    return '';
  });
  const [dob, setDob] = useState(targetUser?.dob || '');
  const [employmentStatus, setEmploymentStatus] = useState(
    targetUser?.employmentStatus || 'student_fulltime'
  );

  // ── Step 2: Academic & Qualification ──────────────────────────────────────
  const [qualificationLevel, setQualificationLevel] = useState(
    targetUser?.qualificationLevel || 'undergraduate'
  );

  // School Specific
  const [schoolClass, setSchoolClass] = useState(targetUser?.schoolClass || 'Class 12');
  const [schoolBoard, setSchoolBoard] = useState(targetUser?.schoolBoard || 'CBSE');

  // Diploma Specific
  const [diplomaStream, setDiplomaStream] = useState(targetUser?.diplomaStream || DIPLOMA_STREAMS[0]);
  const [diplomaStreamCustom, setDiplomaStreamCustom] = useState('');
  const [diplomaYear, setDiplomaYear] = useState(targetUser?.diplomaYear || '2nd Year');

  // Undergraduate Specific
  const [ugDegree, setUgDegree] = useState(targetUser?.ugDegree || UG_DEGREES[0]);
  const [ugDegreeCustom, setUgDegreeCustom] = useState('');
  const [ugBranch, setUgBranch] = useState(targetUser?.ugBranch || UG_MAJORS[0]);
  const [ugBranchCustom, setUgBranchCustom] = useState('');

  // Postgraduate Specific
  const [pgDegree, setPgDegree] = useState(targetUser?.pgDegree || PG_DEGREES[0]);
  const [pgDegreeCustom, setPgDegreeCustom] = useState('');
  const [pgSpecialization, setPgSpecialization] = useState(targetUser?.pgSpecialization || '');

  // Common Academic Fields
  const [institutionName, setInstitutionName] = useState(targetUser?.college || '');
  const [currentSemester, setCurrentSemester] = useState(
    targetUser?.currentSemester || 'Semester 1'
  );
  const [joiningYear, setJoiningYear] = useState(targetUser?.joiningYear || '2023');
  const [passingYear, setPassingYear] = useState(targetUser?.passingYear || '2027');

  // ── Step 1 Validation ─────────────────────────────────────────────────────
  const handleStep1Next = (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || fullName.trim().length < 2) {
      setError('Please provide your legal full name (minimum 2 characters).');
      return;
    }

    const cleanPhone = phoneNumber.replace(/[\s-]/g, '');
    if (!cleanPhone) {
      setError('Phone number is required. Please enter your mobile number.');
      return;
    }
    if (!/^\d{7,15}$/.test(cleanPhone)) {
      setError('Please enter a valid phone number with digits only (7–15 digits).');
      return;
    }

    if (!dob) {
      setError('Date of birth is required. Please select your birth date.');
      return;
    }

    if (!employmentStatus) {
      setError('Please select your current employment or student status.');
      return;
    }

    setStep(2);
  };

  // ── Step 2 Submission ─────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!institutionName.trim()) {
      setError('Please specify your school, college, polytechnic, or university name.');
      return;
    }

    // Dynamic field validation
    if (qualificationLevel === 'school') {
      if (!schoolClass) {
        setError('Please select your school class.');
        return;
      }
      if (!schoolBoard.trim()) {
        setError('Please enter your school board (e.g. CBSE, ICSE, State Board).');
        return;
      }
    } else if (qualificationLevel === 'diploma') {
      if (diplomaStream === 'Other' && !diplomaStreamCustom.trim()) {
        setError('Please enter your diploma stream / branch.');
        return;
      }
    } else if (qualificationLevel === 'undergraduate') {
      if (ugDegree === 'Other' && !ugDegreeCustom.trim()) {
        setError('Please enter your undergraduate degree title.');
        return;
      }
      if (ugBranch === 'Other' && !ugBranchCustom.trim()) {
        setError('Please enter your undergraduate major / branch.');
        return;
      }
    } else if (qualificationLevel === 'postgraduate') {
      if (pgDegree === 'Other' && !pgDegreeCustom.trim()) {
        setError('Please enter your postgraduate degree title.');
        return;
      }
      if (!pgSpecialization.trim()) {
        setError('Please specify your postgraduate specialization / field.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const cleanPhone = phoneNumber.replace(/[\s-]/g, '');
      const fullPhone = `${countryCode} ${cleanPhone}`;

      // Derive clean display labels
      let finalCourseName = '';
      let finalDepartment = '';
      let calculatedTotalSemesters = 8;
      let targetSemesterNum = 1;

      if (qualificationLevel === 'school') {
        finalCourseName = `${schoolClass} (${schoolBoard.trim()})`;
        finalDepartment = 'School Secondary / Higher Secondary';
        calculatedTotalSemesters = 2;
        targetSemesterNum = 1;
      } else if (qualificationLevel === 'diploma') {
        const stream = diplomaStream === 'Other' ? diplomaStreamCustom.trim() : diplomaStream;
        finalCourseName = `Diploma in ${stream}`;
        finalDepartment = stream;
        calculatedTotalSemesters = 6;
        targetSemesterNum = diplomaYear.includes('1st') ? 1 : diplomaYear.includes('2nd') ? 3 : 5;
      } else if (qualificationLevel === 'undergraduate') {
        const deg = ugDegree === 'Other' ? ugDegreeCustom.trim() : ugDegree.split(' (')[0];
        const maj = ugBranch === 'Other' ? ugBranchCustom.trim() : ugBranch.split(' (')[0];
        finalCourseName = `${deg} in ${maj}`;
        finalDepartment = maj;
        const startY = parseInt(joiningYear, 10) || 2023;
        const endY = parseInt(passingYear, 10) || 2027;
        calculatedTotalSemesters = Math.max(2, Math.min(10, (endY - startY) * 2));
        const semMatch = currentSemester.match(/\d+/);
        targetSemesterNum = semMatch ? parseInt(semMatch[0], 10) : 1;
      } else if (qualificationLevel === 'postgraduate') {
        const deg = pgDegree === 'Other' ? pgDegreeCustom.trim() : pgDegree.split(' (')[0];
        finalCourseName = `${deg} in ${pgSpecialization.trim()}`;
        finalDepartment = pgSpecialization.trim();
        const startY = parseInt(joiningYear, 10) || 2023;
        const endY = parseInt(passingYear, 10) || 2025;
        calculatedTotalSemesters = Math.max(2, Math.min(6, (endY - startY) * 2));
        const semMatch = currentSemester.match(/\d+/);
        targetSemesterNum = semMatch ? parseInt(semMatch[0], 10) : 1;
      }

      const profilePayload = {
        name: fullName.trim(),
        phone: fullPhone,
        dob,
        employmentStatus,
        qualificationLevel,
        schoolClass: qualificationLevel === 'school' ? schoolClass : null,
        schoolBoard: qualificationLevel === 'school' ? schoolBoard.trim() : null,
        diplomaStream: qualificationLevel === 'diploma' ? (diplomaStream === 'Other' ? diplomaStreamCustom.trim() : diplomaStream) : null,
        ugDegree: qualificationLevel === 'undergraduate' ? (ugDegree === 'Other' ? ugDegreeCustom.trim() : ugDegree) : null,
        ugBranch: qualificationLevel === 'undergraduate' ? (ugBranch === 'Other' ? ugBranchCustom.trim() : ugBranch) : null,
        pgDegree: qualificationLevel === 'postgraduate' ? (pgDegree === 'Other' ? pgDegreeCustom.trim() : pgDegree) : null,
        pgSpecialization: qualificationLevel === 'postgraduate' ? pgSpecialization.trim() : null,
        courseName: finalCourseName,
        department: finalDepartment,
        college: institutionName.trim(),
        currentSemester,
        joiningYear,
        passingYear,
        totalSemesters: calculatedTotalSemesters,
        onboardingCompleted: true
      };

      if (targetUser?.id) {
        localStorage.setItem(`learnopia_onboarding_done_${targetUser.id}`, 'true');
        // Sync user pinned semester in workspace folders
        setAcademicSemestersCount(targetUser.id, calculatedTotalSemesters);
        setPinnedSemester(targetUser.id, `sem-${targetSemesterNum}`);
      }

      if (updateUserProfile && targetUser?.id) {
        await updateUserProfile(targetUser.id, profilePayload);
      }

      if (onComplete) onComplete();
    } catch (err) {
      console.error('[Onboarding Error]', err);
      setError(err?.message || 'Could not complete profile setup. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-text-primary flex flex-col justify-between animate-fade-in">
      {/* ── Top Header Bar ─────────────────────────────────────────────── */}
      <header className="w-full border-b border-border-subtle bg-surface/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-ink text-text-on-dark flex items-center justify-center font-bold text-base shadow-xs">
            L
          </div>
          <div>
            <h1 className="font-editorial text-lg sm:text-xl font-bold tracking-tight text-text-primary">
              Learnopia
            </h1>
            <p className="text-[11px] text-text-muted font-mono-tabular uppercase tracking-wider">
              Profile Setup & Workspace Setup
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-text-primary truncate max-w-[180px]">
              {targetUser?.name || 'New Learner'}
            </span>
            <span className="text-[10px] text-text-muted font-mono-tabular truncate max-w-[180px]">
              {targetUser?.email || ''}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Sign out and switch to another account?')) {
                if (logout) logout();
              }
            }}
            className="px-3 py-1.5 rounded-lg border border-border-subtle hover:bg-surface-hover text-text-secondary text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Sign out or switch Google account"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Switch Account</span>
          </button>
        </div>
      </header>

      {/* ── Main Form Page Body ────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        {/* Welcome Headline */}
        <div className="text-left space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-accent-forest/15 text-accent-forest border border-accent-forest/20">
            <Sparkles size={12} />
            <span>Official Workspace Onboarding</span>
          </div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            Let's Set Up Your Learning Profile
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary">
            Provide your verified contact details and academic background to personalize your courses, semester folders, and study tools.
          </p>
        </div>

        {/* Multi-step Breadcrumbs / Indicator */}
        <div className="grid grid-cols-2 gap-3 pb-2">
          <div
            className={`p-3.5 rounded-xl border text-left transition-all ${
              step === 1
                ? 'border-accent-ink bg-surface shadow-xs'
                : 'border-border-subtle bg-surface-sunken opacity-75'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono-tabular font-bold uppercase tracking-wider text-text-muted">
                Step 1 of 2
              </span>
              {step > 1 && <CheckCircle2 size={14} className="text-accent-forest" />}
            </div>
            <h3 className="text-sm font-bold text-text-primary mt-1 flex items-center gap-1.5">
              <User size={14} />
              <span>Personal Details</span>
            </h3>
            <p className="text-[11px] text-text-muted mt-0.5">
              Name, verified mobile, birth date & employment.
            </p>
          </div>

          <div
            className={`p-3.5 rounded-xl border text-left transition-all ${
              step === 2
                ? 'border-accent-ink bg-surface shadow-xs'
                : 'border-border-subtle bg-surface-sunken opacity-75'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono-tabular font-bold uppercase tracking-wider text-text-muted">
                Step 2 of 2
              </span>
              <GraduationCap size={14} className="text-text-muted" />
            </div>
            <h3 className="text-sm font-bold text-text-primary mt-1 flex items-center gap-1.5">
              <BookOpen size={14} />
              <span>Academic & Degree</span>
            </h3>
            <p className="text-[11px] text-text-muted mt-0.5">
              School, Diploma, UG, or PG qualification.
            </p>
          </div>
        </div>

        {/* Global Form Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs flex items-center gap-2.5 animate-fade-in text-left">
            <AlertCircle size={16} className="shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* ── STEP 1: PERSONAL INFORMATION ─────────────────────────────── */}
        {step === 1 && (
          <form onSubmit={handleStep1Next} className="bg-surface border border-border-subtle rounded-xl p-6 sm:p-8 space-y-5 text-left shadow-xs">
            <div className="border-b border-border-subtle pb-3">
              <h3 className="text-base font-bold text-text-primary">Personal Information</h3>
              <p className="text-xs text-text-muted">All fields are mandatory to secure and verify your student account.</p>
            </div>

            {/* Full Legal Name */}
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">
                Full Legal Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="e.g. Alex Carter"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-strong text-xs sm:text-sm bg-canvas text-text-primary focus:outline-none focus:border-border-strong"
                  required
                />
              </div>
            </div>

            {/* Mobile Phone Number (MANDATORY) */}
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">
                Mobile Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-border-strong text-xs sm:text-sm bg-canvas text-text-primary focus:outline-none font-mono-tabular shrink-0"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.name} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-strong text-xs sm:text-sm bg-canvas text-text-primary focus:outline-none font-mono-tabular"
                    required
                  />
                </div>
              </div>
              <p className="text-[11px] text-text-muted mt-1 font-mono-tabular">
                Used for account recovery, notifications, and campus notices.
              </p>
            </div>

            {/* Date of Birth (MANDATORY) */}
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-strong text-xs sm:text-sm bg-canvas text-text-primary focus:outline-none font-mono-tabular"
                  required
                />
              </div>
            </div>

            {/* Employment Status Dropdown */}
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">
                Current Employment / Student Status <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Briefcase size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <select
                  value={employmentStatus}
                  onChange={(e) => setEmploymentStatus(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-strong text-xs sm:text-sm bg-canvas text-text-primary focus:outline-none"
                  required
                >
                  {EMPLOYMENT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 1 Actions */}
            <div className="pt-4 border-t border-border-subtle flex items-center justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-accent-ink text-text-on-dark flex items-center gap-2 hover:opacity-95 cursor-pointer shadow-xs transition-opacity"
              >
                <span>Continue to Academic Profile</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 2: ACADEMIC & QUALIFICATION ─────────────────────────── */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="bg-surface border border-border-subtle rounded-xl p-6 sm:p-8 space-y-5 text-left shadow-xs">
            <div className="border-b border-border-subtle pb-3">
              <h3 className="text-base font-bold text-text-primary">Academic Qualifications</h3>
              <p className="text-xs text-text-muted">Select your highest qualification to configure relevant subjects and semester organizers.</p>
            </div>

            {/* Highest Qualification Level Dropdown */}
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">
                Highest Qualification Level <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <GraduationCap size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <select
                  value={qualificationLevel}
                  onChange={(e) => {
                    setQualificationLevel(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-strong text-xs sm:text-sm bg-canvas text-text-primary focus:outline-none font-semibold"
                  required
                >
                  {QUALIFICATION_LEVELS.map((q) => (
                    <option key={q.value} value={q.value}>
                      {q.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ── CASE A: SCHOOL ────────────────────────────────────────── */}
            {qualificationLevel === 'school' && (
              <div className="p-4 rounded-xl border border-border-subtle bg-surface-sunken space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-1">
                      School Class <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={schoolClass}
                      onChange={(e) => setSchoolClass(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border-strong text-xs bg-canvas text-text-primary focus:outline-none"
                      required
                    >
                      {SCHOOL_CLASSES.map((cls) => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-1">
                      Education Board <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CBSE, ICSE, State Board, IB"
                      value={schoolBoard}
                      onChange={(e) => setSchoolBoard(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border-strong text-xs bg-canvas text-text-primary focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── CASE B: DIPLOMA / POLYTECHNIC ─────────────────────────── */}
            {qualificationLevel === 'diploma' && (
              <div className="p-4 rounded-xl border border-border-subtle bg-surface-sunken space-y-4 animate-fade-in">
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    Diploma Discipline / Stream <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={diplomaStream}
                    onChange={(e) => setDiplomaStream(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-strong text-xs bg-canvas text-text-primary focus:outline-none"
                    required
                  >
                    {DIPLOMA_STREAMS.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                {diplomaStream === 'Other' && (
                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-1">
                      Specify Diploma Stream <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Printing Technology or Ceramic Engg"
                      value={diplomaStreamCustom}
                      onChange={(e) => setDiplomaStreamCustom(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border-strong text-xs bg-canvas text-text-primary focus:outline-none"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    Current Study Year / Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={diplomaYear}
                    onChange={(e) => setDiplomaYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-strong text-xs bg-canvas text-text-primary focus:outline-none"
                    required
                  >
                    <option value="1st Year">1st Year (Semesters 1 & 2)</option>
                    <option value="2nd Year">2nd Year (Semesters 3 & 4)</option>
                    <option value="3rd Year">3rd Year / Final Year (Semesters 5 & 6)</option>
                    <option value="Completed">Completed / Passed Out</option>
                  </select>
                </div>
              </div>
            )}

            {/* ── CASE C: UNDERGRADUATE (UG) ────────────────────────────── */}
            {qualificationLevel === 'undergraduate' && (
              <div className="p-4 rounded-xl border border-border-subtle bg-surface-sunken space-y-4 animate-fade-in">
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    Undergraduate Degree Program <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={ugDegree}
                    onChange={(e) => setUgDegree(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-strong text-xs bg-canvas text-text-primary focus:outline-none font-medium"
                    required
                  >
                    {UG_DEGREES.map((deg) => (
                      <option key={deg} value={deg}>{deg}</option>
                    ))}
                  </select>
                </div>

                {ugDegree === 'Other' && (
                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-1">
                      Specify Undergraduate Degree <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bachelor of Fine Arts (BFA)"
                      value={ugDegreeCustom}
                      onChange={(e) => setUgDegreeCustom(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border-strong text-xs bg-canvas text-text-primary focus:outline-none"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    Major / Branch / Specialization <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={ugBranch}
                    onChange={(e) => setUgBranch(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-strong text-xs bg-canvas text-text-primary focus:outline-none"
                    required
                  >
                    {UG_MAJORS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {ugBranch === 'Other' && (
                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-1">
                      Specify Major / Branch <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Aerospace Engineering or Biotechnology"
                      value={ugBranchCustom}
                      onChange={(e) => setUgBranchCustom(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border-strong text-xs bg-canvas text-text-primary focus:outline-none"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    Current Semester <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={currentSemester}
                    onChange={(e) => setCurrentSemester(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-strong text-xs bg-canvas text-text-primary focus:outline-none"
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={`Semester ${s}`}>Semester {s}</option>
                    ))}
                    <option value="Completed">Graduated / Alumni</option>
                  </select>
                </div>
              </div>
            )}

            {/* ── CASE D: POSTGRADUATE (PG) ─────────────────────────────── */}
            {qualificationLevel === 'postgraduate' && (
              <div className="p-4 rounded-xl border border-border-subtle bg-surface-sunken space-y-4 animate-fade-in">
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    Postgraduate Degree Program <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={pgDegree}
                    onChange={(e) => setPgDegree(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-strong text-xs bg-canvas text-text-primary focus:outline-none font-medium"
                    required
                  >
                    {PG_DEGREES.map((deg) => (
                      <option key={deg} value={deg}>{deg}</option>
                    ))}
                  </select>
                </div>

                {pgDegree === 'Other' && (
                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-1">
                      Specify Postgraduate Degree <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Master of Data Science (MDS)"
                      value={pgDegreeCustom}
                      onChange={(e) => setPgDegreeCustom(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border-strong text-xs bg-canvas text-text-primary focus:outline-none"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    Specialization / Research Discipline <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Artificial Intelligence, VLSI Design, Marketing, Finance"
                    value={pgSpecialization}
                    onChange={(e) => setPgSpecialization(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-strong text-xs bg-canvas text-text-primary focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    Current Semester <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={currentSemester}
                    onChange={(e) => setCurrentSemester(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-strong text-xs bg-canvas text-text-primary focus:outline-none"
                    required
                  >
                    {[1, 2, 3, 4].map((s) => (
                      <option key={s} value={`Semester ${s}`}>Semester {s}</option>
                    ))}
                    <option value="Completed">Graduated / Alumni</option>
                  </select>
                </div>
              </div>
            )}

            {/* Institution / College Name (All Qualifications) */}
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">
                School, Polytechnic, College or University Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="e.g. Maulana Abul Kalam Azad University of Technology (MAKAUT)"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-strong text-xs sm:text-sm bg-canvas text-text-primary focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Joining & Passing Years */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">
                  Admission Year <span className="text-red-500">*</span>
                </label>
                <select
                  value={joiningYear}
                  onChange={(e) => setJoiningYear(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border-strong text-xs sm:text-sm bg-canvas text-text-primary focus:outline-none font-mono-tabular"
                  required
                >
                  {[2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">
                  Expected Graduation <span className="text-red-500">*</span>
                </label>
                <select
                  value={passingYear}
                  onChange={(e) => setPassingYear(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border-strong text-xs sm:text-sm bg-canvas text-text-primary focus:outline-none font-mono-tabular"
                  required
                >
                  {[2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 2 Actions */}
            <div className="pt-4 border-t border-border-subtle flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl border border-border-subtle hover:bg-surface-hover text-xs font-semibold text-text-secondary flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Back to Personal Details</span>
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-accent-ink text-text-on-dark flex items-center gap-2 hover:opacity-95 cursor-pointer shadow-xs disabled:opacity-50 transition-opacity"
              >
                {submitting ? (
                  <span>Initializing Workspace...</span>
                ) : (
                  <>
                    <span>Complete Setup & Enter Learnopia</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="w-full py-4 px-6 border-t border-border-subtle text-center text-xs text-text-muted font-mono-tabular">
        Learnopia Student OS • Secure Academic Ecosystem
      </footer>
    </div>
  );
}
