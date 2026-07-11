import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Users, BookOpen, ShieldCheck, Check, Ban, Award, FileText, Shield, X } from 'lucide-react';

export default function AdminDashboard() {
  const { users, courses, subjects, activityLogs, approveCreator, rejectCreator, makeAdmin, toggleUserStatus } = useDatabase();
  const [activeTab, setActiveTab] = useState('verification');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Filter lists
  const pendingCreators = users.filter(u => u.creatorStatus === 'pending');
  const learners = users.filter(u => u.role === 'learner');
  const admins = users.filter(u => u.role === 'admin');

  // Compute metrics
  const totalCourses = courses.length;
  const totalVideos = subjects.reduce((acc, s) => {
    const plVideos = s.playlists ? s.playlists.reduce((sum, pl) => sum + pl.videos.length, 0) : 0;
    return acc + plVideos;
  }, 0);
  const totalUsers = users.length;

  return (
    <div className="animate-fade-in" style={styles.container}>
      
      {/* Metrics Header widgets */}
      <div style={styles.statsGrid}>
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
            <span style={styles.statLabel}>Pending Verification</span>
            <ShieldCheck size={20} color="#f59e0b" />
          </div>
          <div style={styles.statVal}>{pendingCreators.length}</div>
          <div style={styles.statFooter}>
            <span style={{ color: pendingCreators.length > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
              {pendingCreators.length > 0 ? 'Educators awaiting clearance' : 'No tasks pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Admin Console */}
      <div style={styles.layoutGrid}>
        
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
              Pending Creators ({pendingCreators.length})
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
              onClick={() => setActiveTab('logs')}
              style={{
                ...styles.sideTab,
                background: activeTab === 'logs' ? 'rgba(255,255,255,0.03)' : 'transparent',
                borderLeftColor: activeTab === 'logs' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'logs' ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              <FileText size={15} />
              Activity Logs ({activityLogs?.length || 0})
            </button>
          </div>
        </div>

        {/* Console panel content */}
        <div className="glass-panel" style={styles.contentWorkspace}>
          
          {/* TAB 1: Verification Queue */}
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
                            <span className="badge badge-creator" style={{ fontSize: '0.6rem' }}>{creator.status}</span>
                          </td>
                          <td style={styles.td}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                onClick={() => approveCreator(creator.id)}
                                className="btn btn-primary"
                                style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '4px', background: 'var(--success)' }}
                              >
                                <Check size={12} />
                                Approve
                              </button>
                              <button 
                                onClick={() => rejectCreator(creator.id)}
                                className="btn btn-danger"
                                style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '4px' }}
                              >
                                <X size={12} />
                                Reject
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

          {/* TAB 2: User Directories */}
          {activeTab === 'directory' && (
            <div style={styles.pane}>
              <h3 style={styles.paneTitle}>User Directories</h3>
              <p style={styles.paneSub}>Promote accounts to admin status, suspend/activate users, and monitor accounts directory.</p>
              
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
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Operations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter(u => 
                        u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                        u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
                      )
                      .map(u => (
                        <tr key={u.id} style={styles.tableRow}>
                          <td style={styles.td}><strong>{u.name}</strong></td>
                          <td style={styles.td}>{u.email}</td>
                          <td style={styles.td}>
                            <span className={`badge badge-${u.role}`} style={{ fontSize: '0.6rem' }}>{u.role}</span>
                          </td>
                          <td style={styles.td}>
                            <span style={{ 
                              fontSize: '0.75rem', 
                              color: u.status === 'active' ? 'var(--success)' : u.status === 'pending' ? 'var(--warning)' : u.status === 'rejected' ? 'var(--text-muted)' : 'var(--error)' 
                            }}>
                              ● {u.status}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {/* Make Admin Button */}
                              {u.role !== 'admin' && (
                                <button
                                  onClick={() => makeAdmin(u.id)}
                                  className="btn btn-primary"
                                  style={{ padding: '6px 10px', fontSize: '0.7rem', gap: '4px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: 'none' }}
                                  title="Promote user to Administrator status"
                                >
                                  <Shield size={10} />
                                  Make Admin
                                </button>
                              )}

                              {/* Suspend Toggle */}
                              {u.role !== 'admin' && (
                                <button 
                                  onClick={() => toggleUserStatus(u.id)}
                                  className={u.status === 'active' ? 'btn btn-danger' : 'btn btn-secondary'}
                                  style={{ padding: '6px 10px', fontSize: '0.7rem', gap: '4px' }}
                                  disabled={u.status === 'pending'}
                                >
                                  {u.status === 'active' ? (
                                    <>
                                      <Ban size={10} />
                                      Suspend
                                    </>
                                  ) : (
                                    <>
                                      <Check size={10} />
                                      Activate
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Real Platform Activity Logs */}
          {activeTab === 'logs' && (
            <div style={styles.pane}>
              <h3 style={styles.paneTitle}>Platform Activity Logs</h3>
              <p style={styles.paneSub}>A chronological trace of user signups, creator status approvals, and course creations.</p>
              
              <div style={styles.logsContainer}>
                {(!activityLogs || activityLogs.length === 0) ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No activity logged yet.</p>
                ) : (
                  activityLogs.map(log => (
                    <div key={log.id} style={styles.logItem}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#ffffff', lineHeight: '1.4' }}>{log.event}</p>
                    </div>
                  ))
                )}
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
    gap: '24px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px'
  },
  statCard: {
    padding: '20px',
    textAlign: 'left'
  },
  statHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px'
  },
  statLabel: {
    color: 'var(--text-secondary)',
    fontSize: '0.8rem',
    fontWeight: 600,
    textTransform: 'uppercase'
  },
  statVal: {
    fontSize: '2.2rem',
    fontWeight: 800,
    fontFamily: 'var(--font-heading)',
    marginBottom: '6px',
    color: '#ffffff'
  },
  statFooter: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)'
  },
  layoutGrid: {
    display: 'grid',
    gridTemplateColumns: '260px 1fr',
    gap: '24px',
    alignItems: 'start',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr'
    }
  },
  sidebarPanel: {
    padding: '20px',
    textAlign: 'left'
  },
  sidebarTitle: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    marginBottom: '16px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  sideTabs: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  sideTab: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    border: 'none',
    borderLeft: '3px solid transparent',
    background: 'transparent',
    cursor: 'pointer',
    fontFamily: 'var(--font-heading)',
    fontSize: '0.85rem',
    fontWeight: 500,
    borderRadius: '0 6px 6px 0',
    transition: 'all 0.15s',
    textAlign: 'left'
  },
  contentWorkspace: {
    padding: '24px',
    minHeight: '400px'
  },
  pane: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left'
  },
  paneTitle: {
    fontSize: '1.2rem',
    marginBottom: '4px'
  },
  paneSub: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    marginBottom: '20px'
  },
  tableWrapper: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.85rem'
  },
  tableRowHead: {
    borderBottom: '2px solid rgba(255,255,255,0.08)'
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    color: 'var(--text-secondary)',
    fontWeight: 600
  },
  tableRow: {
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    transition: 'background 0.15s'
  },
  td: {
    padding: '12px 16px',
    color: 'var(--text-primary)'
  },
  emptyVerification: {
    padding: '40px 10px',
    textAlign: 'center'
  },
  logsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxHeight: '450px',
    overflowY: 'auto',
    paddingRight: '6px'
  },
  logItem: {
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: '8px',
    textAlign: 'left'
  }
};
