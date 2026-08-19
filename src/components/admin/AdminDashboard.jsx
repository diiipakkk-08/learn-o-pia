import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Users, BookOpen, ShieldCheck, Check, Ban, Award, FileText, Shield, X, ExternalLink, CheckCircle2 } from 'lucide-react';

export default function AdminDashboard() {
  const { currentUser, users, courses, subjects, activityLogs, approveCreator, rejectCreator, makeAdmin, toggleUserStatus, changeUserRole, adminVerifyUser } = useDatabase();
  const [activeTab, setActiveTab] = useState('verification');
  const [userSearchQuery, setUserSearchQuery] = useState('');

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
