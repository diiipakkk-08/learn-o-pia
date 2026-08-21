import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Users, BookOpen, ShieldCheck, Check, Ban, Award, FileText, Shield, X, ExternalLink, CheckCircle2, Heart, Video, Sliders, Clock, Sparkles } from 'lucide-react';

export default function AdminDashboard() {
  const { currentUser, users, courses, subjects, activityLogs, approveCreator, rejectCreator, makeAdmin, toggleUserStatus, changeUserRole, adminVerifyUser, adSettings, updateAdSettings } = useDatabase();
  const [activeTab, setActiveTab] = useState('verification');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Ad Settings Form State
  const [adEnabled, setAdEnabled] = useState(adSettings?.enabled !== false);
  const [adInterval, setAdInterval] = useState(adSettings?.intervalMinutes || 15);
  const [adSkipDelay, setAdSkipDelay] = useState(adSettings?.skipDelaySeconds || 10);
  const [adYoutubeUrl, setAdYoutubeUrl] = useState(adSettings?.youtubeUrl || '');
  const [adTitle, setAdTitle] = useState(adSettings?.title || "Support Learn-o-pia's Open Education Infrastructure");
  const [adMsg, setAdMsg] = useState(adSettings?.message || "Learn-o-pia is built by students, for students. Help us keep all engineering degree curricula, attendance algorithms, and YouTube lecture sync servers fast, open, and free for everyone!");
  const [adUrl, setAdUrl] = useState(adSettings?.targetUrl || "https://github.com/diiipakkk-08/learn-o-pia");
  const [adSavedToast, setAdSavedToast] = useState('');

  const handleSaveAds = (e) => {
    e.preventDefault();
    if (updateAdSettings) {
      updateAdSettings({
        enabled: adEnabled,
        intervalMinutes: parseInt(adInterval, 10) || 15,
        skipDelaySeconds: parseInt(adSkipDelay, 10) || 10,
        youtubeUrl: adYoutubeUrl.trim(),
        title: adTitle.trim(),
        message: adMsg.trim(),
        targetUrl: adUrl.trim()
      });
      setAdSavedToast('Community Ad & Video parameters updated and broadcast live!');
      setTimeout(() => setAdSavedToast(''), 4000);
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
  const pendingStudentVerifications = users.filter(u => u.verificationStatus === 'pending' || (u.idCardLink && !u.isVerified));

  const filteredUsers = users.filter(u => {
    if (!userSearchQuery.trim()) return true;
    const q = userSearchQuery.toLowerCase().trim();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.username && u.username.toLowerCase().includes(q));
  });

  return (
    <div className="animate-fade-in" style={styles.container}>
      {/* Metrics Header widgets */}
      <div className="admin-stats-grid">
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
            <BookOpen size={20} color="#8b5cf6" />
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
      <div className="admin-layout-grid">
        
        {/* Navigation Sidebar */}
        <div style={styles.sidebarPanel} className="glass-panel">
          <h4 style={styles.sidebarTitle}>Admin Panel Operations</h4>
          <div style={styles.sideTabs}>
            <button 
              onClick={() => setActiveTab('verification')}
              style={{
                ...styles.sideTab,
                background: activeTab === 'verification' ? 'rgba(255,255,255,0.03)' : 'transparent',
                borderLeftColor: activeTab === 'verification' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'verification' ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              <Award size={15} />
              Creator Queue ({pendingCreators.length})
            </button>

            <button 
              onClick={() => setActiveTab('student-verify')}
              style={{
                ...styles.sideTab,
                background: activeTab === 'student-verify' ? 'rgba(255,255,255,0.03)' : 'transparent',
                borderLeftColor: activeTab === 'student-verify' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'student-verify' ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              <ShieldCheck size={15} />
              ID Verification Queue ({pendingStudentVerifications.length})
            </button>
            
            <button 
              onClick={() => setActiveTab('directory')}
              style={{
                ...styles.sideTab,
                background: activeTab === 'directory' ? 'rgba(255,255,255,0.03)' : 'transparent',
                borderLeftColor: activeTab === 'directory' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'directory' ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              <Users size={15} />
              User Directories
            </button>

            <button 
              onClick={() => setActiveTab('ads')}
              style={{
                ...styles.sideTab,
                background: activeTab === 'ads' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                borderLeftColor: activeTab === 'ads' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'ads' ? '#c4b5fd' : 'var(--text-secondary)'
              }}
            >
              <Heart size={15} color="var(--primary)" />
              Ads & Pop-up Controls
            </button>
          </div>
        </div>

        {/* Console panel content */}
        <div className="glass-panel" style={styles.contentWorkspace}>
          
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
              <p style={styles.paneSub}>Review submitted identity cards & document Drive links. Approving a user grants their official designation badge and locks their profile credentials.</p>

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
                        <th style={styles.th}>Submitted Document</th>
                        <th style={styles.th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingStudentVerifications.map(student => (
                        <tr key={student.id} style={styles.tableRow}>
                          <td style={styles.td}>
                            <strong>{student.name}</strong>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{student.username || '@user'}</span>
                            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{student.email}</span>
                          </td>
                          <td style={styles.td}>
                            <span className="badge badge-learner" style={{ fontSize: '0.65rem', marginBottom: '4px', display: 'inline-block' }}>
                              {student.verificationType === 'professor' ? '👨‍🏫 Professor' : student.verificationType === 'creator' ? '✨ Creator' : '🎓 Student'}
                            </span>
                            <span style={{ display: 'block', fontSize: '0.8rem', color: '#ffffff' }}>{student.college || 'Institution not set'}</span>
                            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{student.department || ''}</span>
                          </td>
                          <td style={styles.td}>
                            <span style={{ fontSize: '0.8rem', color: '#ffffff' }}>{student.phone || 'No phone'}</span>
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
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => adminVerifyUser(student.id, 'verified')}
                                className="btn btn-primary"
                                style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '4px', background: 'var(--success)' }}
                              >
                                <Check size={12} /> Approve & Verify
                              </button>
                              <button
                                onClick={() => adminVerifyUser(student.id, 'rejected')}
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

          {/* TAB 3: User Directories */}
          {activeTab === 'directory' && (
            <div style={styles.pane}>
              <h3 style={styles.paneTitle}>User Directories</h3>
              <p style={styles.paneSub}>Promote accounts, toggle verification, suspend/activate users, and monitor directory.</p>
              
              {/* Search Box */}
              <div style={{ marginBottom: '16px', maxWidth: '340px' }}>
                <input 
                  type="text" 
                  placeholder="Search users by name, username or email..." 
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
                      <th style={styles.th}>Full Name & Handle</th>
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
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.username || '@user'}</span>
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

                            <button 
                              onClick={() => toggleUserStatus(user.id)}
                              className={`btn ${user.status === 'suspended' ? 'btn-primary' : 'btn-danger'}`}
                              style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                            >
                              {user.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Community Ads & Pop-up Configuration */}
          {activeTab === 'ads' && (
            <div style={styles.pane} className="animate-fade-in">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <h3 style={styles.paneTitle}>Community Support Ads & Pop-up Controls</h3>
                  <p style={styles.paneSub}>
                    Configure the purple header countdown bar, interval frequency, 10-second skip delay, video ads (YouTube URL), and donation links.
                  </p>
                </div>
              </div>

              {adSavedToast && (
                <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', marginBottom: '16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} /> {adSavedToast}
                </div>
              )}

              <form onSubmit={handleSaveAds} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Global Toggle Box */}
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff', display: 'block' }}>
                      Enable Community Ad / Donation System
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      When active, users without ad-free credits see the visual purple countdown bar and pop-up modal. Turn off to disable completely.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAdEnabled(!adEnabled)}
                    className={`btn ${adEnabled ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      background: adEnabled ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                      color: '#ffffff',
                      fontWeight: 700,
                      padding: '8px 16px',
                      fontSize: '0.82rem'
                    }}
                  >
                    {adEnabled ? '✔ Active (Broadcasting)' : 'Paused / Turned Off'}
                  </button>
                </div>

                {/* Interval & Skip Controls */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
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

                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
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
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
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
    maxWidth: '1350px',
    margin: '0 auto'
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
    color: '#ffffff',
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
    color: '#ffffff'
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
