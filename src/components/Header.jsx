import React, { useState, useEffect } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { GraduationCap, LogOut, BookOpen, User, Info, Calendar, MessageSquare, Sparkles, Shield, Compass } from 'lucide-react';

export default function Header({
  currentView,
  setCurrentView,
  setSelectedPlaylistId,
  onLogoClick
}) {
  const { currentUser, logout } = useDatabase();
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isCreatorOrAdmin = currentUser && ((currentUser.role === 'creator' && currentUser.status === 'active') || currentUser.role === 'admin' || currentUser.role === 'owner');
  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'owner');
  const avatarInitial = currentUser && currentUser.name ? currentUser.name.charAt(0).toUpperCase() : '?';

  const handleBrandClick = () => {
    if (onLogoClick) {
      onLogoClick();
    } else {
      if (setSelectedPlaylistId) setSelectedPlaylistId(null);
      setCurrentView('landing');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* TOP NAVBAR */}
      <div style={{
        ...styles.header,
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        width: '100%'
      }} className="glass-panel">
        <div style={styles.left}>
          {/* Logo */}
          <div
            style={{ ...styles.logo, cursor: 'pointer' }}
            onClick={handleBrandClick}
            title="Return to Learn-o-pia Main Website"
          >
            <div style={styles.logoIcon}>
              <GraduationCap size={20} color="#ffffff" />
            </div>
            <span style={styles.logoText}>Learn-o-pia</span>
          </div>

          {/* Desktop Nav Links */}
          {!isMobile && currentUser && (
            <nav style={styles.nav}>
              <button
                onClick={() => setCurrentView('learning')}
                style={{
                  ...styles.navBtn,
                  background: (currentView === 'learning' || currentView === 'learning-player') ? 'rgba(255,255,255,0.05)' : 'transparent',
                  color: (currentView === 'learning' || currentView === 'learning-player') ? '#ffffff' : 'var(--text-secondary)'
                }}
              >
                <BookOpen size={15} /> Learning
              </button>

              <button
                onClick={() => setCurrentView('attendance')}
                style={{
                  ...styles.navBtn,
                  background: currentView === 'attendance' ? 'rgba(255,255,255,0.05)' : 'transparent',
                  color: currentView === 'attendance' ? '#ffffff' : 'var(--text-secondary)'
                }}
              >
                <Calendar size={15} /> Attendance
              </button>

              <button
                onClick={() => setCurrentView('discussions')}
                style={{
                  ...styles.navBtn,
                  background: currentView === 'discussions' ? 'rgba(255,255,255,0.05)' : 'transparent',
                  color: currentView === 'discussions' ? '#ffffff' : 'var(--text-secondary)'
                }}
              >
                <MessageSquare size={15} /> Discussions
              </button>

              {isCreatorOrAdmin && (
                <button
                  onClick={() => setCurrentView('studio')}
                  style={{
                    ...styles.navBtn,
                    background: currentView === 'studio' ? 'rgba(255,255,255,0.05)' : 'transparent',
                    color: currentView === 'studio' ? '#ffffff' : 'var(--text-secondary)'
                  }}
                >
                  <Sparkles size={15} color="#a78bfa" /> Studio
                </button>
              )}

              {isAdmin && (
                <button
                  onClick={() => setCurrentView('admin')}
                  style={{
                    ...styles.navBtn,
                    background: currentView === 'admin' ? 'rgba(255,255,255,0.05)' : 'transparent',
                    color: currentView === 'admin' ? '#ffffff' : 'var(--text-secondary)'
                  }}
                >
                  <Shield size={15} /> Admin Panel
                </button>
              )}

              <button
                onClick={() => setCurrentView('about')}
                style={{
                  ...styles.navBtn,
                  background: currentView === 'about' ? 'rgba(255,255,255,0.05)' : 'transparent',
                  color: currentView === 'about' ? '#ffffff' : 'var(--text-secondary)'
                }}
              >
                <Info size={15} /> About
              </button>
            </nav>
          )}
        </div>

        {/* Right Section: Mobile Profile Icon or Desktop User Profile Card */}
        <div>
          {isMobile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {currentUser ? (
                <button
                  onClick={() => setCurrentView('profile')}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  {currentUser.picture ? (
                    <img src={currentUser.picture} alt={currentUser.name} style={{ width: 34, height: 34, borderRadius: '50%', border: '1.5px solid var(--primary)' }} referrerPolicy="no-referrer" />
                  ) : (
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>
                      {avatarInitial}
                    </div>
                  )}
                </button>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={() => setCurrentView('auth')}>
                  Sign In
                </button>
              )}
            </div>
          ) : (
            <div style={styles.right}>
              {currentUser ? (
                <>
                  <button
                    onClick={() => setCurrentView('profile')}
                    style={{
                      ...styles.userInfoBtn,
                      background: currentView === 'profile' ? 'rgba(139,92,246,0.12)' : 'transparent',
                      borderColor: currentView === 'profile' ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.06)'
                    }}
                    title="View Profile"
                  >
                    {currentUser.picture ? (
                      <img src={currentUser.picture} alt={currentUser.name} style={styles.avatarImg} referrerPolicy="no-referrer" />
                    ) : (
                      <div style={styles.avatarInitial}>{avatarInitial}</div>
                    )}
                    <div style={styles.userText}>
                      <span style={styles.userName}>{currentUser.name}</span>
                      <span className={`badge badge-${currentUser.role}`} style={{ fontSize: '0.55rem', padding: '2px 6px', marginTop: '2px', display: 'inline-block', width: 'fit-content' }}>
                        {currentUser.role}
                      </span>
                    </div>
                  </button>

                  <button onClick={logout} style={styles.logoutBtn} title="Sign Out">
                    <LogOut size={15} />
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setCurrentView('auth')}>Sign In</button>
                  <button className="btn btn-primary btn-sm" onClick={() => setCurrentView('auth')}>Get Started</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MOBILE FLOATING CURVED RECTANGULAR NAVIGATION BAR (5 SECTIONS) */}
      {isMobile && currentUser && (
        <div style={styles.mobileFloatingNav}>
          {/* Section 1: Learning */}
          <button
            onClick={() => setCurrentView('learning')}
            style={{
              ...styles.mobileNavTab,
              color: (currentView === 'learning' || currentView === 'learning-player') ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            <BookOpen size={20} />
            <span style={styles.mobileTabLabel}>Learning</span>
          </button>

          {/* Section 2: Discussion */}
          <button
            onClick={() => setCurrentView('discussions')}
            style={{
              ...styles.mobileNavTab,
              color: currentView === 'discussions' ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            <MessageSquare size={20} />
            <span style={styles.mobileTabLabel}>Discussion</span>
          </button>

          {/* Section 3: Center Elevated Floating Circle Button - My Learning */}
          <button
            onClick={() => setCurrentView('learning')}
            style={styles.mobileCenterBtn}
            title="My Learning Workspace"
          >
            <div style={styles.mobileCenterCircle}>
              <Sparkles size={22} color="#ffffff" />
            </div>
            <span style={{ fontSize: '0.62rem', color: '#a78bfa', fontWeight: 700, marginTop: 2 }}>My Learning</span>
          </button>

          {/* Section 4: Attendance Sheet */}
          <button
            onClick={() => setCurrentView('attendance')}
            style={{
              ...styles.mobileNavTab,
              color: currentView === 'attendance' ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            <Calendar size={20} />
            <span style={styles.mobileTabLabel}>Attendance</span>
          </button>

          {/* Section 5: Profile */}
          <button
            onClick={() => setCurrentView('profile')}
            style={{
              ...styles.mobileNavTab,
              color: currentView === 'profile' ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            <User size={20} />
            <span style={styles.mobileTabLabel}>Profile</span>
          </button>
        </div>
      )}
    </>
  );
}

const styles = {
  header: {
    padding: '12px 24px',
    borderRadius: '16px',
    marginBottom: '20px',
    display: 'flex'
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  logoIcon: {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoText: {
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#ffffff',
    fontFamily: 'var(--font-heading)'
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  navBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '10px',
    border: 'none',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--font-heading)',
    transition: 'all 0.2s ease'
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  userInfoBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '6px 12px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.06)',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  avatarImg: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    objectFit: 'cover'
  },
  avatarInitial: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    color: '#ffffff',
    fontSize: '0.85rem'
  },
  userText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start'
  },
  userName: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: '#ffffff'
  },
  logoutBtn: {
    padding: '8px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  mobileFloatingNav: {
    position: 'fixed',
    bottom: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'calc(100% - 32px)',
    maxWidth: '440px',
    height: '62px',
    background: 'rgba(12, 13, 22, 0.92)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '32px',
    boxShadow: '0 12px 35px rgba(0,0,0,0.6), 0 0 20px rgba(139, 92, 246, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: '0 8px',
    zIndex: 9999
  },
  mobileNavTab: {
    background: 'none',
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: '6px 4px',
    flex: 1
  },
  mobileTabLabel: {
    fontSize: '0.62rem',
    marginTop: '2px',
    fontWeight: 600
  },
  mobileCenterBtn: {
    background: 'none',
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transform: 'translateY(-12px)',
    padding: 0,
    flex: 1
  },
  mobileCenterCircle: {
    width: '46px',
    height: '46px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 6px 20px rgba(139, 92, 246, 0.5), 0 0 15px rgba(168, 85, 247, 0.4)'
  }
};
