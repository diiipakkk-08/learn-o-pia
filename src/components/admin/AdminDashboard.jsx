/**
 * AdminDashboard.jsx
 * Administrator command console for verifying student profiles, moderating creator privileges,
 * configuring platform banners/ads, publishing notices, and generating campus shared routines.
 */

import React, { useState, useEffect } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import {
  Users, BookOpen, ShieldCheck, Check, Award, Shield, X,
  ExternalLink, CheckCircle2, Heart, Video, Sliders, Clock, Sparkles,
  PowerOff, Power, Eye, Calendar, Copy, Trash2, CalendarDays, BookCheck,
  AlertCircle, RefreshCw, Megaphone
} from 'lucide-react';

export default function AdminDashboard() {
  const {
    currentUser,
    users,
    courses,
    subjects,
    approveCreator,
    rejectCreator,
    makeAdmin,
    toggleUserStatus,
    changeUserRole,
    adminVerifyUser,
    adSettings,
    updateAdSettings,
    createSharedRoutine,
    getAllSharedRoutines,
    deleteSharedRoutine,
    broadcastAnnouncement,
    announcements
  } = useDatabase();
  const [activeTab, setActiveTab] = useState('verification');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Inspect Verification Modal State
  const [selectedInspectStudent, setSelectedInspectStudent] = useState(null);

  // Admin Routine Generator State
  const [sharedRoutinesList, setSharedRoutinesList] = useState([]);
  const [sharedRoutinesLoading, setSharedRoutinesLoading] = useState(false);
  const [routineTitle, setRoutineTitle] = useState('CSE 3rd Sem Morning Routine');
  const [routineSemesterStart, setRoutineSemesterStart] = useState('2026-06-30');
  const [routineJsonInput, setRoutineJsonInput] = useState('');
  const [routineGenCode, setRoutineGenCode] = useState('');
  const [routineGenError, setRoutineGenError] = useState('');
  const [copiedRoutineId, setCopiedRoutineId] = useState('');
  const [routineSuccessToast, setRoutineSuccessToast] = useState('');

  // Ad Settings Form State
  const [adEnabled, setAdEnabled] = useState(adSettings?.enabled !== false);
  const [adInterval, setAdInterval] = useState(adSettings?.intervalMinutes || 15);
  const [adSkipDelay, setAdSkipDelay] = useState(adSettings?.skipDelaySeconds || 10);
  const [adYoutubeUrl, setAdYoutubeUrl] = useState(adSettings?.youtubeUrl || '');
  const [adTitle, setAdTitle] = useState(adSettings?.title || "Support Learn-o-pia's Open Education Infrastructure");
  const [adMsg, setAdMsg] = useState(adSettings?.message || "Learn-o-pia is built by students, for students. Help us keep all engineering degree curricula, attendance algorithms, and YouTube lecture sync servers fast, open, and free for everyone!");
  const [adUrl, setAdUrl] = useState(adSettings?.targetUrl || "https://github.com/diiipakkk-08/learn-o-pia");
  const [adSavedToast, setAdSavedToast] = useState('');

  // Announcement Broadcaster Form State
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annResourceTitle, setAnnResourceTitle] = useState('');
  const [annResourceUrl, setAnnResourceUrl] = useState('');
  const [annToast, setAnnToast] = useState('');

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    if (!annTitle.trim() || !annMessage.trim()) return;

    if (broadcastAnnouncement) {
      await broadcastAnnouncement({
        title: annTitle.trim(),
        message: annMessage.trim(),
        resourceTitle: annResourceTitle.trim(),
        resourceUrl: annResourceUrl.trim()
      });

      setAnnToast('📢 Announcement broadcasted! Linked resources auto-synced to Resources section.');
      setAnnTitle('');
      setAnnMessage('');
      setAnnResourceTitle('');
      setAnnResourceUrl('');
      setTimeout(() => setAnnToast(''), 4500);
    }
  };

  // Sync state when remote adSettings from Supabase changes
  useEffect(() => {
    if (adSettings) {
      setAdEnabled(adSettings.enabled !== false);
      setAdInterval(adSettings.intervalMinutes || 15);
      setAdSkipDelay(adSettings.skipDelaySeconds || 10);
      setAdYoutubeUrl(adSettings.youtubeUrl || '');
      setAdTitle(adSettings.title || "Support Learn-o-pia's Open Education Infrastructure");
      setAdMsg(adSettings.message || "Learn-o-pia is built by students, for students. Help us keep all engineering degree curricula, attendance algorithms, and YouTube lecture sync servers fast, open, and free for everyone!");
      setAdUrl(adSettings.targetUrl || "https://github.com/diiipakkk-08/learn-o-pia");
    }
  }, [adSettings]);

  const handleToggleAdSystemForever = async (targetState) => {
    setAdEnabled(targetState);
    if (updateAdSettings) {
      await updateAdSettings({
        enabled: targetState,
        intervalMinutes: parseInt(adInterval, 10) || 15,
        skipDelaySeconds: parseInt(adSkipDelay, 10) || 10,
        youtubeUrl: adYoutubeUrl.trim(),
        title: adTitle.trim(),
        message: adMsg.trim(),
        targetUrl: adUrl.trim()
      });
      setAdSavedToast(targetState ? '🟢 Ad System is now ENABLED and saved to Supabase!' : '🛑 Ad System is now COMPLETELY TURNED OFF FOREVER and saved to Supabase!');
      setTimeout(() => setAdSavedToast(''), 4500);
    }
  };

  const handleSaveAds = async (e) => {
    e.preventDefault();
    if (updateAdSettings) {
      await updateAdSettings({
        enabled: adEnabled,
        intervalMinutes: parseInt(adInterval, 10) || 15,
        skipDelaySeconds: parseInt(adSkipDelay, 10) || 10,
        youtubeUrl: adYoutubeUrl.trim(),
        title: adTitle.trim(),
        message: adMsg.trim(),
        targetUrl: adUrl.trim()
      });
      setAdSavedToast('✅ Community Ad & Video parameters updated and saved to Supabase!');
      setTimeout(() => setAdSavedToast(''), 4000);
    }
  };

  const loadAllRoutines = async () => {
    if (getAllSharedRoutines) {
      setSharedRoutinesLoading(true);
      try {
        const list = await getAllSharedRoutines();
        setSharedRoutinesList(list || []);
      } catch (e) {
        console.warn('Load routines err:', e);
      } finally {
        setSharedRoutinesLoading(false);
      }
    }
  };

  useEffect(() => {
    if (activeTab === 'routines') {
      loadAllRoutines();
    }
  }, [activeTab]);

  const handleGenerateRoutine = async (e) => {
    e.preventDefault();
    setRoutineGenError('');
    if (!routineJsonInput.trim()) return;

    try {
      let parsed;
      try {
        parsed = JSON.parse(routineJsonInput.trim());
      } catch {
        throw new Error('Invalid JSON format. Please check for proper brackets and quotation marks.');
      }

      const routineObj = parsed.routine || parsed.weeklySchedule || parsed.timetable || parsed;
      if (!routineObj || typeof routineObj !== 'object') {
        throw new Error('JSON payload must contain routine day schedules (e.g. Monday, Tuesday).');
      }

      const semDate = parsed.semester_start_date || parsed.semesterStartDate || routineSemesterStart || null;
      const title = parsed.title || routineTitle.trim() || 'Curated Class Schedule';

      const code = await createSharedRoutine(routineObj, semDate, title);
      setRoutineGenCode(code);
      setRoutineSuccessToast(`✅ Routine generated successfully with ID: ${code}`);
      setTimeout(() => setRoutineSuccessToast(''), 4500);
      await loadAllRoutines();
    } catch (err) {
      setRoutineGenError(err.message || 'Failed to validate routine JSON.');
    }
  };

  const handleDeleteSharedRoutine = async (code) => {
    if (deleteSharedRoutine) {
      await deleteSharedRoutine(code);
      await loadAllRoutines();
    }
  };

  const totalCourses = courses.length;
  const totalVideos = subjects.reduce((acc, s) => {
    const plVideos = s.playlists ? s.playlists.reduce((sum, pl) => sum + pl.videos.length, 0) : 0;
    return acc + plVideos;
  }, 0);
  const totalUsers = users.length;
  const learners = users.filter(u => u.role === 'learner');
  const admins = users.filter(u => u.role === 'admin' || u.role === 'owner');
  const pendingCreators = users.filter(u => u.creatorStatus === 'pending' || (u.role === 'creator' && u.status === 'pending'));
  const pendingStudentVerifications = users.filter(u => u.verificationStatus === 'pending');

  const filteredUsers = users.filter(u => {
    if (!userSearchQuery.trim()) return true;
    const q = userSearchQuery.toLowerCase().trim();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 animate-fade-in" style={styles.container}>
      {/* Metrics Header widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
        <div className="glass-panel" style={styles.statCard}>
          <div style={styles.statHeader}>
            <span style={styles.statLabel}>Total Accounts</span>
            <Users size={20} color="#3b82f6" />
          </div>
          <div style={styles.statVal}>{totalUsers}</div>
          <div style={styles.statFooter}>
            <span>{learners.length} Students | {admins.length} Admins</span>
          </div>
        </div>

        <div className="glass-panel" style={styles.statCard}>
          <div style={styles.statHeader}>
            <span style={styles.statLabel}>Degree Programs</span>
            <BookOpen size={20} color="var(--primary)" />
          </div>
          <div style={styles.statVal}>{totalCourses}</div>
          <div style={styles.statFooter}>
            <span>{totalVideos} video lectures published</span>
          </div>
        </div>

        <div className="glass-panel" style={styles.statCard}>
          <div style={styles.statHeader}>
            <span style={styles.statLabel}>Pending ID Verifications</span>
            <ShieldCheck size={20} color="#f59e0b" />
          </div>
          <div style={styles.statVal}>{pendingStudentVerifications.length}</div>
          <div style={styles.statFooter}>
            <span style={{ color: pendingStudentVerifications.length > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
              {pendingStudentVerifications.length > 0 ? 'Student ID cards awaiting review' : 'All accounts verified'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Admin Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Navigation Sidebar */}
        <div className="glass-panel p-4 lg:col-span-4 xl:col-span-3">
          <h4 style={styles.sidebarTitle}>Admin Panel Operations</h4>
          <div className="flex flex-col gap-1.5">
            <button 
              onClick={() => setActiveTab('verification')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-mono-tabular transition-all text-left cursor-pointer ${
                activeTab === 'verification'
                  ? 'bg-accent-ink text-text-on-dark font-bold shadow-xs'
                  : 'bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary border border-border-subtle font-medium'
              }`}
            >
              <Award size={15} className="shrink-0" />
              <span>Creator Queue ({pendingCreators.length})</span>
            </button>

            <button 
              onClick={() => setActiveTab('student-verify')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-mono-tabular transition-all text-left cursor-pointer ${
                activeTab === 'student-verify'
                  ? 'bg-accent-ink text-text-on-dark font-bold shadow-xs'
                  : 'bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary border border-border-subtle font-medium'
              }`}
            >
              <ShieldCheck size={15} className="shrink-0" />
              <span>ID Verification Queue ({pendingStudentVerifications.length})</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('directory')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-mono-tabular transition-all text-left cursor-pointer ${
                activeTab === 'directory'
                  ? 'bg-accent-ink text-text-on-dark font-bold shadow-xs'
                  : 'bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary border border-border-subtle font-medium'
              }`}
            >
              <Users size={15} className="shrink-0" />
              <span>User Directories</span>
            </button>

            <button 
              onClick={() => setActiveTab('routines')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-mono-tabular transition-all text-left cursor-pointer ${
                activeTab === 'routines'
                  ? 'bg-accent-ink text-text-on-dark font-bold shadow-xs'
                  : 'bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary border border-border-subtle font-medium'
              }`}
            >
              <CalendarDays size={15} className="shrink-0" />
              <span>Routine Generator ({sharedRoutinesList.length})</span>
            </button>

            <button 
              onClick={() => setActiveTab('ads')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-mono-tabular transition-all text-left cursor-pointer ${
                activeTab === 'ads'
                  ? 'bg-accent-ink text-text-on-dark font-bold shadow-xs'
                  : 'bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary border border-border-subtle font-medium'
              }`}
            >
              <Heart size={15} className="shrink-0" />
              <span>Ads & Pop-up Controls</span>
            </button>

            <button 
              onClick={() => setActiveTab('announcements')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-mono-tabular transition-all text-left cursor-pointer ${
                activeTab === 'announcements'
                  ? 'bg-accent-ink text-text-on-dark font-bold shadow-xs'
                  : 'bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary border border-border-subtle font-medium'
              }`}
            >
              <Megaphone size={15} className="shrink-0" />
              <span>Announcements & Broadcasts ({announcements?.length || 0})</span>
            </button>
          </div>
        </div>
      {/* Console panel content */}
        <div className="glass-panel p-6 lg:col-span-8 xl:col-span-9" style={styles.contentWorkspace}>
          
          {/* TAB 1: Creator Verification Queue */}
          {activeTab === 'verification' && (
            <div style={styles.pane}>
              <h3 style={styles.paneTitle}>Creator Verification Queue</h3>
              <p style={styles.paneSub}>Authorize learner accounts requesting verified Educator status to unlock the Studio tab.</p>
              
              <div style={styles.tableWrapper}>
                {pendingCreators.length === 0 ? (
                  <div style={styles.emptyVerification}>
                    <ShieldCheck size={36} color="var(--success)" style={{ marginBottom: '8px' }} />
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Queue Clear</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>All creator registrations are active and cleared.</p>
                  </div>
                ) : (
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.tableRowHead}>
                        <th style={styles.th}>Name</th>
                        <th style={styles.th}>Email</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingCreators.map(creator => (
                        <tr key={creator.id} style={styles.tableRow}>
                          <td style={styles.td}><strong>{creator.name}</strong></td>
                          <td style={styles.td}>{creator.email}</td>
                          <td style={styles.td}>
                            <span className="badge badge-creator" style={{ fontSize: '0.65rem', textTransform: 'capitalize' }}>
                              {creator.creatorStatus || creator.status}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                onClick={() => approveCreator(creator.id)}
                                className="btn btn-primary"
                                style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '4px', background: 'var(--success)' }}
                              >
                                <Check size={12} /> Approve
                              </button>
                              <button 
                                onClick={() => rejectCreator(creator.id)}
                                className="btn btn-danger"
                                style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '4px' }}
                              >
                                <X size={12} /> Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Identity Document Verification Queue */}
          {activeTab === 'student-verify' && (
            <div style={styles.pane}>
              <h3 style={styles.paneTitle}>Identity Document Verification Queue</h3>
              <p style={styles.paneSub}>Review submitted identity cards & document Drive links. Inspect user profile data against their uploaded ID card to ensure authenticity before approving or rejecting.</p>

              <div style={styles.tableWrapper}>
                {pendingStudentVerifications.length === 0 ? (
                  <div style={styles.emptyVerification}>
                    <CheckCircle2 size={36} color="var(--success)" style={{ marginBottom: '8px' }} />
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Queue Clear</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>No identity verification requests currently awaiting review.</p>
                  </div>
                ) : (
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.tableRowHead}>
                        <th style={styles.th}>Applicant</th>
                        <th style={styles.th}>Type & Institution</th>
                        <th style={styles.th}>Contact</th>
                        <th style={styles.th}>Submitted ID Document</th>
                        <th style={styles.th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingStudentVerifications.map(student => (
                        <tr key={student.id} style={styles.tableRow}>
                          <td style={styles.td}>
                            <strong>{student.name}</strong>
                            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{student.email}</span>
                          </td>
                          <td style={styles.td}>
                            <span className="badge badge-learner" style={{ fontSize: '0.65rem', marginBottom: '4px', display: 'inline-block' }}>
                              {student.verificationType === 'professor' ? '👨‍🏫 Professor' : student.verificationType === 'creator' ? '✨ Creator' : '🎓 Student'}
                            </span>
                            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-primary)' }}>{student.college || 'Institution not set'}</span>
                            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{student.department || ''}</span>
                          </td>
                          <td style={styles.td}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{student.phone || 'No phone'}</span>
                          </td>
                          <td style={styles.td}>
                            {student.idCardLink ? (
                              <a
                                href={student.idCardLink}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--primary)' }}
                              >
                                <ExternalLink size={13} /> View ID Link ↗
                              </a>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No link provided</span>
                            )}
                          </td>
                          <td style={styles.td}>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              <button
                                onClick={() => setSelectedInspectStudent(student)}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '4px', color: '#38bdf8' }}
                                title="Inspect all profile details alongside ID card proof"
                              >
                                <Eye size={13} /> Inspect & Verify
                              </button>
                              <button
                                onClick={() => adminVerifyUser(student.id, 'verified')}
                                className="btn btn-primary btn-sm"
                                style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '4px', background: 'var(--success)' }}
                              >
                                <Check size={12} /> Approve
                              </button>
                              <button
                                onClick={() => adminVerifyUser(student.id, 'rejected')}
                                className="btn btn-danger btn-sm"
                                style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '4px' }}
                              >
                                <X size={12} /> Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* INSPECT PROFILE & ID PROOF MODAL */}
              {selectedInspectStudent && (
                <div style={{
                  position: 'fixed',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(0, 0, 0, 0.88)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10000,
                  padding: '20px',
                  overflowY: 'auto'
                }} className="animate-fade-in">
                  <div className="glass-panel" style={{ maxWidth: '720px', width: '100%', padding: '26px', borderRadius: '24px', textAlign: 'left', maxHeight: '90vh', overflowY: 'auto', margin: 'auto' }}>
                    
                    {/* Modal Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '12px', background: '#EFECE6', border: '1px solid #CFCAC0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ShieldCheck size={22} color="var(--accent-forest, #1E5631)" />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-primary)' }}>Identity Verification Inspection</h3>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Compare applicant's submitted data against their institutional document proof</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedInspectStudent(null)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                      >
                        <X size={20} />
                      </button>
                    </div>

                    {/* Inspection Content Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                      
                      {/* Left Column: Academic & Personal Data */}
                      <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
                        <h4 style={{ fontSize: '0.85rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <BookOpen size={14} /> Profile Credentials
                        </h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                          <div>
                            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Full Legal Name</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{selectedInspectStudent.name || 'Not provided'}</strong>
                          </div>

                          <div>
                            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Account Email</span>
                            <span style={{ color: 'var(--text-primary)' }}>{selectedInspectStudent.email}</span>
                          </div>

                          <div>
                            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Contact Number</span>
                            <span style={{ color: 'var(--text-primary)' }}>{selectedInspectStudent.phone || 'No phone number'}</span>
                          </div>

                          <div>
                            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Date of Birth</span>
                            <span style={{ color: 'var(--text-primary)' }}>{selectedInspectStudent.dob || 'Not specified'}</span>
                          </div>

                          <div>
                            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Education Level</span>
                            <span style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{selectedInspectStudent.educationLevel || 'College / University'}</span>
                          </div>

                          <div>
                            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Course / Stream</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{selectedInspectStudent.courseName || 'Not specified'}</strong>
                          </div>

                          <div>
                            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>College / University Name</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{selectedInspectStudent.college || 'Institution not specified'}</strong>
                          </div>

                          <div>
                            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Department / Branch</span>
                            <span style={{ color: 'var(--text-primary)' }}>{selectedInspectStudent.department || 'Not specified'}</span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div>
                              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Joining Year</span>
                              <span style={{ color: 'var(--text-primary)' }}>{selectedInspectStudent.joiningYear || 'N/A'}</span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Passing Year</span>
                              <span style={{ color: 'var(--text-primary)' }}>{selectedInspectStudent.passingYear || 'N/A'}</span>
                            </div>
                          </div>

                          <div>
                            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Total Curriculum Semesters</span>
                            <span style={{ color: 'var(--text-primary)' }}>{selectedInspectStudent.totalSemesters || 8} Semesters</span>
                          </div>

                          <div>
                            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Target Exam / Interests</span>
                            <span style={{ color: 'var(--text-primary)' }}>{selectedInspectStudent.interests || 'None specified'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: ID Card Proof & Verification Guideline */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        
                        <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
                          <h4 style={{ fontSize: '0.85rem', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Shield size={14} /> Verification Request Details
                          </h4>

                          <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div>
                              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Requested Verification Role</span>
                              <span className="badge badge-learner" style={{ fontSize: '0.75rem', marginTop: 4, display: 'inline-block' }}>
                                {selectedInspectStudent.verificationType === 'professor' ? '👨‍🏫 Professor / Faculty' : selectedInspectStudent.verificationType === 'creator' ? '✨ Creator' : '🎓 Verified Student'}
                              </span>
                            </div>

                            <div>
                              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', marginBottom: 4 }}>Submitted ID Card / Document Link</span>
                              {selectedInspectStudent.idCardLink ? (
                                <a
                                  href={selectedInspectStudent.idCardLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn btn-primary"
                                  style={{ padding: '8px 14px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center' }}
                                >
                                  <ExternalLink size={14} /> Open ID Card Link in New Tab ↗
                                </a>
                              ) : (
                                <div style={{ padding: '10px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', color: '#f87171', fontSize: '0.78rem' }}>
                                  ⚠️ No document link provided by the user.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={{ padding: '14px', background: 'rgba(20, 20, 19, 0.06)', borderRadius: '14px', border: '1px solid rgba(20, 20, 19, 0.06)', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                          <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>💡 Verification Guide:</strong>
                          Check that the student's Full Name, College Name, and Course Match what is displayed on their institutional identity card or grade card document.
                        </div>

                      </div>
                    </div>

                    {/* Modal Decision Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', flexWrap: 'wrap', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedInspectStudent(null)}
                        className="btn btn-secondary"
                        style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                      >
                        Cancel
                      </button>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={async () => {
                            await adminVerifyUser(selectedInspectStudent.id, 'rejected');
                            setSelectedInspectStudent(null);
                          }}
                          className="btn btn-danger"
                          style={{ padding: '8px 16px', fontSize: '0.85rem', gap: 6 }}
                        >
                          <X size={15} /> Reject Verification
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            await adminVerifyUser(selectedInspectStudent.id, 'verified');
                            setSelectedInspectStudent(null);
                          }}
                          className="btn btn-primary"
                          style={{ padding: '8px 18px', fontSize: '0.85rem', gap: 6, background: 'var(--success)' }}
                        >
                          <Check size={15} /> Approve & Verify Student
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: User Directories */}
          {activeTab === 'directory' && (
            <div style={styles.pane}>
              <h3 style={styles.paneTitle}>User Directories</h3>
              <p style={styles.paneSub}>Promote accounts, toggle verification, suspend/activate users, and monitor directory.</p>
              
              {/* Search Box */}
              <div style={{ marginBottom: '16px', maxWidth: '340px' }}>
                <input 
                  type="text" 
                  placeholder="Search users by name or email..." 
                  value={userSearchQuery} 
                  onChange={(e) => setUserSearchQuery(e.target.value)} 
                  className="form-input"
                  style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableRowHead}>
                      <th style={styles.th}>Full Name</th>
                      <th style={styles.th}>Email Address</th>
                      <th style={styles.th}>Role</th>
                      <th style={styles.th}>Verified Status</th>
                      <th style={styles.th}>Operations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id} style={styles.tableRow}>
                        <td style={styles.td}>
                          <strong>{user.name}</strong>
                        </td>
                        <td style={styles.td}>{user.email}</td>
                        <td style={styles.td}>
                          <span className={`badge badge-${user.role}`} style={{ fontSize: '0.65rem', textTransform: 'capitalize' }}>
                            {user.role}
                          </span>
                        </td>
                        <td style={styles.td}>
                          {user.isVerified ? (
                            <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.78rem' }}>✔ Verified</span>
                          ) : (
                            <button
                              onClick={() => adminVerifyUser(user.id, 'verified')}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                            >
                              Verify Account
                            </button>
                          )}
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {user.role !== 'admin' && user.role !== 'owner' && (
                              <button 
                                onClick={() => makeAdmin(user.id)}
                                className="btn btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                              >
                                Promote Admin
                              </button>
                            )}

                            {user.role === 'admin' && currentUser?.role === 'owner' && (
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button 
                                  onClick={() => changeUserRole(user.id, 'learner')}
                                  className="btn btn-secondary"
                                  style={{ padding: '4px 8px', fontSize: '0.72rem', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                                  title="Demote Admin to Learner role"
                                >
                                  Demote to Learner
                                </button>
                                <button 
                                  onClick={() => changeUserRole(user.id, 'creator')}
                                  className="btn btn-secondary"
                                  style={{ padding: '4px 8px', fontSize: '0.72rem', color: '#fbbf24', borderColor: 'rgba(251, 191, 36, 0.3)' }}
                                  title="Demote Admin to Creator role"
                                >
                                  Demote to Creator
                                </button>
                              </div>
                            )}

                            {user.role !== 'owner' && (
                              <button 
                                onClick={() => toggleUserStatus(user.id)}
                                className={`btn ${user.status === 'suspended' ? 'btn-primary' : 'btn-danger'}`}
                                style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                              >
                                {user.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Curriculum Routine Generator & Shared Codes */}
          {activeTab === 'routines' && (
            <div style={styles.pane} className="animate-fade-in">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <h3 style={styles.paneTitle}>Curriculum Routine Generator & Shared Codes</h3>
                  <p style={styles.paneSub}>
                    Generate official class routines and timetable templates for batches and students. Generates a unique 6-character Routine ID and JSON that students can import with 1 click — completely isolated from your personal attendance logger.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadAllRoutines}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '6px 12px', fontSize: '0.78rem', gap: 6 }}
                >
                  <RefreshCw size={13} className={sharedRoutinesLoading ? 'animate-spin' : ''} /> Refresh Routines
                </button>
              </div>

              {routineSuccessToast && (
                <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', color: '#34d399', marginBottom: '16px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={18} /> {routineSuccessToast}
                </div>
              )}

              {routineGenError && (
                <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171', marginBottom: '16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={18} /> {routineGenError}
                </div>
              )}

              {/* TWO COLUMN WORKSPACE */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                
                {/* COLUMN 1: Routine Generator Form */}
                <div style={{ padding: '20px', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CalendarDays size={18} color="var(--primary)" /> Generate New Routine ID
                  </h4>

                  <form onSubmit={handleGenerateRoutine} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Routine Title / Batch Identifier</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. MAKAUT CSE 4th Sem (Sec A)"
                        value={routineTitle}
                        onChange={e => setRoutineTitle(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Semester Official Start Date</label>
                      <input
                        type="date"
                        className="form-input"
                        value={routineSemesterStart}
                        onChange={e => setRoutineSemesterStart(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <label className="form-label" style={{ fontSize: '0.78rem', margin: 0 }}>Timetable Schedule JSON</label>
                        <button
                          type="button"
                          onClick={() => {
                            setRoutineJsonInput(JSON.stringify({
                              Monday: [
                                { subject: "Data Structures & Algorithms", startTime24: "09:30", durationHours: 1, durationMins: 30, room: "Lab 3" },
                                { subject: "Database Management Systems", startTime24: "11:15", durationHours: 1, durationMins: 0, room: "Room 402" }
                              ],
                              Tuesday: [
                                { subject: "Computer Organization & Architecture", startTime24: "10:00", durationHours: 1, durationMins: 0, room: "Room 201" },
                                { subject: "Formal Language & Automata Theory", startTime24: "11:15", durationHours: 1, durationMins: 0, room: "Room 201" }
                              ],
                              Wednesday: [
                                { subject: "Discrete Mathematics", startTime24: "09:00", durationHours: 1, durationMins: 30, room: "Room 105" },
                                { subject: "Object Oriented Programming (Java)", startTime24: "11:00", durationHours: 1, durationMins: 30, room: "Software Lab 2" }
                              ],
                              Thursday: [
                                { subject: "Operating Systems", startTime24: "10:30", durationHours: 1, durationMins: 30, room: "Room 304" },
                                { subject: "Design & Analysis of Algorithms", startTime24: "13:00", durationHours: 2, durationMins: 0, room: "Room 304" }
                              ],
                              Friday: [
                                { subject: "Software Engineering", startTime24: "10:00", durationHours: 1, durationMins: 0, room: "Room 302" },
                                { subject: "Web Development Lab", startTime24: "14:00", durationHours: 2, durationMins: 0, room: "Web Lab 1" }
                              ],
                              Saturday: [],
                              Sunday: []
                            }, null, 2));
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.7rem', padding: '2px 8px', color: 'var(--primary)' }}
                        >
                          Fill Sample Timetable
                        </button>
                      </div>
                      <textarea
                        className="form-input"
                        rows={10}
                        placeholder="Paste weekly routine JSON..."
                        value={routineJsonInput}
                        onChange={e => setRoutineJsonInput(e.target.value)}
                        style={{ fontFamily: 'monospace', fontSize: '0.75rem', resize: 'vertical' }}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ padding: '10px 18px', fontSize: '0.88rem', gap: 6 }}
                    >
                      <Sparkles size={16} /> Validate & Generate Routine ID
                    </button>
                  </form>

                  {/* GENERATED ID DISPLAY BOX */}
                  {routineGenCode && (
                    <div style={{ marginTop: '16px', padding: '18px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '14px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#34d399', fontWeight: 700 }}>
                        Shareable Routine ID
                      </span>
                      <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.12em', margin: '6px 0', fontFamily: 'monospace' }}>
                        {routineGenCode}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 12 }}>
                        Students can enter this ID under Attendance Tracker ➔ Weekly Routine ➔ Import Classmate's Routine.
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(routineGenCode);
                          setCopiedRoutineId(routineGenCode);
                          setTimeout(() => setCopiedRoutineId(''), 3000);
                        }}
                        className="btn btn-primary btn-sm"
                        style={{ padding: '6px 14px', fontSize: '0.8rem', gap: 6, margin: '0 auto' }}
                      >
                        {copiedRoutineId === routineGenCode ? <Check size={14} /> : <Copy size={14} />}
                        {copiedRoutineId === routineGenCode ? 'Copied ID!' : 'Copy Routine ID'}
                      </button>
                    </div>
                  )}
                </div>

                {/* COLUMN 2: Active Shared Routines Database */}
                <div style={{ padding: '20px', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <BookCheck size={18} color="#38bdf8" /> Published Routines ({sharedRoutinesList.length})
                    </h4>
                  </div>

                  {sharedRoutinesList.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Calendar size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
                      <p style={{ fontSize: '0.82rem', margin: 0 }}>No shared routines published yet.</p>
                      <p style={{ fontSize: '0.75rem', marginTop: 4 }}>Generate one using the form on the left!</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '480px', overflowY: 'auto' }}>
                      {sharedRoutinesList.map(item => (
                        <div
                          key={item.share_code || item.id}
                          style={{
                            padding: '14px',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px'
                          }}
                        >
                          <div>
                            <strong style={{ color: 'var(--text-primary)', fontSize: '0.88rem', display: 'block' }}>
                              {item.title || 'Curated Routine'}
                            </strong>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                              <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 800, background: 'rgba(20, 20, 19, 0.06)', padding: '2px 8px', borderRadius: '6px' }}>
                                {item.share_code}
                              </span>
                              {item.semester_start_date && (
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  Starts: {item.semester_start_date}
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(item.share_code);
                                setCopiedRoutineId(item.share_code);
                                setTimeout(() => setCopiedRoutineId(''), 3000);
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '6px 10px', fontSize: '0.75rem', gap: 4 }}
                              title="Copy Routine Code"
                            >
                              {copiedRoutineId === item.share_code ? <Check size={13} /> : <Copy size={13} />}
                              {copiedRoutineId === item.share_code ? 'Copied' : 'Copy'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteSharedRoutine(item.share_code)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '6px 10px', fontSize: '0.75rem', color: '#f87171' }}
                              title="Delete Routine"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 5: Community Ads & Pop-up Configuration */}
          {activeTab === 'ads' && (
            <div style={styles.pane} className="animate-fade-in">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <h3 style={styles.paneTitle}>Community Support Ads & Pop-up Controls</h3>
                  <p style={styles.paneSub}>
                    Configure the purple header countdown bar, interval frequency, 10-second skip delay, video ads (YouTube URL), and global on/off state.
                  </p>
                </div>
              </div>

              {adSavedToast && (
                <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', color: '#34d399', marginBottom: '16px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 8 }} className="animate-fade-in">
                  <CheckCircle2 size={18} /> {adSavedToast}
                </div>
              )}

              {/* MASTER CONTROL CARD (Turn Off Forever / Turn On) */}
              <div style={{
                padding: '20px',
                background: adEnabled ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                borderRadius: '16px',
                border: adEnabled ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ maxWidth: '560px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: adEnabled ? '#10b981' : '#ef4444',
                      boxShadow: adEnabled ? '0 0 10px #10b981' : '0 0 10px #ef4444'
                    }} />
                    <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {adEnabled ? 'Ad System is Active & Broadcasting' : 'Ad System is Completely TURNED OFF FOREVER'}
                    </strong>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', lineHeight: 1.4 }}>
                    {adEnabled
                      ? 'When active, logged-in learners without credits see the top purple countdown bar and pop-up modal. Click the button on the right to disable completely.'
                      : 'All ads, countdown progress bars, and donation pop-ups are completely silenced across the entire platform. No user will see any ads.'}
                  </span>
                </div>

                <div>
                  {adEnabled ? (
                    <button
                      type="button"
                      onClick={() => handleToggleAdSystemForever(false)}
                      className="btn"
                      style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                        color: '#f87171',
                        padding: '10px 20px',
                        fontWeight: 700,
                        fontSize: '0.86rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        cursor: 'pointer',
                        borderRadius: '10px'
                      }}
                      title="Turn off the ad system forever"
                    >
                      <PowerOff size={16} /> Turn Off Ads Forever (Disable Completely)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleAdSystemForever(true)}
                      className="btn"
                      style={{
                        background: 'rgba(16, 185, 129, 0.2)',
                        border: '1px solid rgba(16, 185, 129, 0.5)',
                        color: '#34d399',
                        padding: '10px 20px',
                        fontWeight: 700,
                        fontSize: '0.86rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        cursor: 'pointer',
                        borderRadius: '10px'
                      }}
                      title="Turn on the ad system"
                    >
                      <Power size={16} /> ▶ Turn On Ad System Live
                    </button>
                  )}
                </div>
              </div>

              <form onSubmit={handleSaveAds} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Interval & Skip Controls */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                  <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={14} color="var(--primary)" /> Ad Frequency Interval (Minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      className="form-input"
                      value={adInterval}
                      onChange={e => setAdInterval(e.target.value)}
                      style={{ marginTop: '8px' }}
                      required
                    />
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                      {[5, 15, 30, 60].map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setAdInterval(m)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                        >
                          {m}m
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sliders size={14} color="var(--primary)" /> Skip Button Delay (Seconds)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      className="form-input"
                      value={adSkipDelay}
                      onChange={e => setAdSkipDelay(e.target.value)}
                      style={{ marginTop: '8px' }}
                      required
                    />
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                      {[5, 10, 15, 20].map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setAdSkipDelay(s)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                        >
                          {s}s
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Video Ad YouTube Link */}
                <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Video size={14} color="var(--primary)" /> YouTube Video Ad / Sponsor Link (Optional)
                  </label>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 8px 0' }}>
                    If provided, this video will autoplay in the ad modal when it triggers (background learning videos pause automatically).
                  </p>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                    value={adYoutubeUrl}
                    onChange={e => setAdYoutubeUrl(e.target.value)}
                  />
                </div>

                {/* Pop-up Text & Target URL */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Ad Pop-up Headline / Title</label>
                    <input
                      type="text"
                      className="form-input"
                      value={adTitle}
                      onChange={e => setAdTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Ad Message Body</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={adMsg}
                      onChange={e => setAdMsg(e.target.value)}
                      style={{ resize: 'vertical' }}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Support / Donation / External URL</label>
                    <input
                      type="url"
                      className="form-input"
                      value={adUrl}
                      onChange={e => setAdUrl(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{
                      padding: '10px 20px',
                      fontSize: '0.88rem'
                    }}
                  >
                    💾 Save & Broadcast Ad Settings
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 6: Announcements & Resource Broadcaster */}
          {activeTab === 'announcements' && (
            <div style={styles.pane}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                <div>
                  <h3 style={styles.paneTitle}>Announcements & Resource Broadcaster</h3>
                  <p style={styles.paneSub}>
                    Broadcast platform notifications to the Header Bell Icon. Linking a resource link automatically appends it into the Resources section.
                  </p>
                </div>
              </div>

              {annToast && (
                <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', color: '#34d399', marginBottom: '16px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 8 }} className="animate-fade-in">
                  <CheckCircle2 size={18} /> {annToast}
                </div>
              )}

              {/* BROADCAST FORM */}
              <form onSubmit={handleBroadcastSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid rgba(20, 20, 19, 0.06)', marginBottom: '24px' }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Megaphone size={16} color="var(--primary)" /> Send Broadcast Announcement
                </h4>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Announcement Headline / Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Mid-term Exam Schedule & Revision Notes Released"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Announcement Message *</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="Provide details about the update, event, or release..."
                    value={annMessage}
                    onChange={(e) => setAnnMessage(e.target.value)}
                    style={{ resize: 'vertical' }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Attach Resource Title (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Physics Formula Sheet PDF"
                      value={annResourceTitle}
                      onChange={(e) => setAnnResourceTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Attach Resource Link / URL (Optional)</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="e.g. https://example.com/physics-notes.pdf"
                      value={annResourceUrl}
                      onChange={(e) => setAnnResourceUrl(e.target.value)}
                    />
                  </div>
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                  💡 Attaching a link will automatically publish a new entry into the <strong>Resources</strong> section for all learners!
                </p>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '0.85rem', gap: '6px' }}>
                    <Megaphone size={14} /> Send Broadcast
                  </button>
                </div>
              </form>

              {/* RECENT BROADCAST HISTORY */}
              <div>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '12px', fontWeight: 700 }}>
                  Recent Broadcast Notifications ({announcements?.length || 0})
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(!announcements || announcements.length === 0) ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No announcements sent yet.</p>
                  ) : (
                    announcements.map((ann) => (
                      <div key={ann.id} style={{ padding: '14px 16px', borderRadius: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{ann.title}</strong>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {new Date(ann.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 6px 0' }}>{ann.message}</p>
                        {ann.resourceUrl && (
                          <span style={{ fontSize: '0.72rem', color: '#a78bfa', fontWeight: 600 }}>
                            🔗 Linked Resource: {ann.resourceTitle || ann.resourceUrl}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    width: '100%'
  },
  statCard: {
    padding: '20px',
    textAlign: 'left'
  },
  statHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  statLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    fontWeight: 600
  },
  statVal: {
    fontSize: '2rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: '8px 0'
  },
  statFooter: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)'
  },
  sidebarPanel: {
    padding: '16px',
    textAlign: 'left'
  },
  sidebarTitle: {
    fontSize: '0.85rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-secondary)',
    margin: '0 0 12px 0'
  },
  sideTabs: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  sideTab: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    borderRadius: '8px',
    border: 'none',
    borderLeft: '3px solid transparent',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 500,
    fontFamily: 'var(--font-heading)',
    textAlign: 'left',
    transition: 'all 0.15s ease'
  },
  contentWorkspace: {
    padding: '24px',
    textAlign: 'left'
  },
  pane: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  paneTitle: {
    fontSize: '1.2rem',
    margin: 0,
    color: 'var(--text-primary)'
  },
  paneSub: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    margin: '0 0 16px 0'
  },
  tableWrapper: {
    overflowX: 'auto',
    width: '100%'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  tableRowHead: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
  },
  th: {
    padding: '10px 12px',
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    fontWeight: 600,
    textTransform: 'uppercase'
  },
  tableRow: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
  },
  td: {
    padding: '12px',
    fontSize: '0.85rem',
    color: 'var(--text-primary)'
  },
  emptyVerification: {
    padding: '40px 20px',
    textAlign: 'center'
  }
};
