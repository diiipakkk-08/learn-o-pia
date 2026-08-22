import React, { useState, useEffect, useRef } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { GraduationCap, LogOut, BookOpen, User, Info, Calendar, MessageSquare, Sparkles, Shield, Compass, MoreHorizontal, ChevronDown, X, Search, FolderKanban } from 'lucide-react';

export default function Header({
  currentView,
  setCurrentView,
  setSelectedPlaylistId,
  onLogoClick
}) {
  const { currentUser, logout, globalSearchQuery, setGlobalSearchQuery } = useDatabase();
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const mobileMenuRef = useRef(null);

  const pageTitles = {
    'my-learning': 'My Learning',
    resources: 'Resources',
    'learning-player': 'Course',
    attendance: 'Attendance',
    studio: 'Studio',
    admin: 'Admin Panel',
    profile: 'Profile',
    about: 'About'
  };
  const activeTitle = pageTitles[currentView];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) setShowMobileMenu(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setShowMobileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const handleSearchChange = (e) => {
    const val = e.target.value;
    if (setGlobalSearchQuery) setGlobalSearchQuery(val);
    if (currentView !== 'resources' && val.trim().length > 0) {
      setCurrentView('resources');
    }
  };

  const mobileMenuItems = [
    { view: 'learning', icon: BookOpen, label: 'Learning', active: currentView === 'learning' || currentView === 'learning-player' },
    { view: 'my-learning', icon: Compass, label: 'My Learning', active: currentView === 'my-learning' },
    { view: 'resources', icon: FolderKanban, label: 'Resources', active: currentView === 'resources' || currentView === 'discussions' },
    { view: 'attendance', icon: Calendar, label: 'Attendance', active: currentView === 'attendance' },
    { view: 'studio', icon: Sparkles, label: 'Studio', active: currentView === 'studio', iconColor: '#a78bfa' },
    { view: 'profile', icon: User, label: 'Profile', active: currentView === 'profile' },
    ...(isAdmin ? [{ view: 'admin', icon: Shield, label: 'Admin Panel', active: currentView === 'admin' }] : []),
    { view: 'about', icon: Info, label: 'About', active: currentView === 'about' },
  ];

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
        width: '100%',
        gap: '12px'
      }} className="glass-panel">
        <div style={styles.left}>
          {/* Logo & Breadcrumb */}
          <div
            style={{ ...styles.logo, cursor: 'pointer' }}
            onClick={handleBrandClick}
            title="Return to Learn-o-pia Main Website"
          >
            <div style={styles.logoIcon}>
              <GraduationCap size={20} color="#ffffff" />
            </div>
            <span style={{ ...styles.logoText, whiteSpace: 'nowrap' }}>Learn-o-pia</span>
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
                <BookOpen size={15} /> Curricula
              </button>

              <button
                onClick={() => setCurrentView('my-learning')}
                style={{
                  ...styles.navBtn,
                  background: currentView === 'my-learning' ? 'rgba(255,255,255,0.05)' : 'transparent',
                  color: currentView === 'my-learning' ? '#ffffff' : 'var(--text-secondary)'
                }}
              >
                <Compass size={15} /> My Learning
              </button>

              <button
                onClick={() => setCurrentView('resources')}
                style={{
                  ...styles.navBtn,
                  background: (currentView === 'resources' || currentView === 'discussions') ? 'rgba(255,255,255,0.05)' : 'transparent',
                  color: (currentView === 'resources' || currentView === 'discussions') ? '#ffffff' : 'var(--text-secondary)'
                }}
              >
                <FolderKanban size={15} /> Resources
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
                onClick={() => setCurrentView('studio')}
                style={{
                  ...styles.navBtn,
                  background: currentView === 'studio' ? 'rgba(255,255,255,0.05)' : 'transparent',
                  color: currentView === 'studio' ? '#ffffff' : 'var(--text-secondary)'
                }}
              >
                <Sparkles size={15} color="#a78bfa" /> Studio
              </button>

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
                  background: (currentView === 'landing' || currentView === 'about') ? 'rgba(255,255,255,0.05)' : 'transparent',
                  color: (currentView === 'landing' || currentView === 'about') ? '#ffffff' : 'var(--text-secondary)'
                }}
              >
                <Info size={15} /> About
              </button>
            </nav>
          )}
        </div>

        {/* Right Section: Mobile & Desktop Profile Icon or User Profile Card */}
        <div>
          {isMobile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {currentUser ? (
                <button
                  onClick={() => setCurrentView('profile')}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  title="Profile & Settings"
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
                <button className="btn btn-primary btn-sm" onClick={() => setCurrentView('auth')}>
                  Sign In
                </button>
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
            <span style={styles.mobileTabLabel}>Curricula</span>
          </button>

          {/* Section 2: Resources */}
          <button
            onClick={() => setCurrentView('resources')}
            style={{
              ...styles.mobileNavTab,
              color: (currentView === 'resources' || currentView === 'discussions') ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            <FolderKanban size={20} />
            <span style={styles.mobileTabLabel}>Resources</span>
          </button>

          {/* Section 3: Center Elevated Floating Circle Button - My Learning */}
          <button
            onClick={() => setCurrentView('my-learning')}
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

          {/* Section 5: Studio */}
          <button
            onClick={() => setCurrentView('studio')}
            style={{
              ...styles.mobileNavTab,
              color: currentView === 'studio' ? '#a78bfa' : 'var(--text-muted)'
            }}
          >
            <Sparkles size={20} color={currentView === 'studio' ? '#a78bfa' : 'var(--text-muted)'} />
            <span style={styles.mobileTabLabel}>Studio</span>
          </button>
        </div>
      )}

      {/* MOBILE MORE MENU DROPDOWN */}
      {isMobile && currentUser && showMobileMenu && (
        <div
          ref={mobileMenuRef}
          style={styles.mobileMenuDropdown}
          className="glass-panel animate-fade-in"
        >
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.85rem' }}>More Options</span>
            <button onClick={() => setShowMobileMenu(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>
          <div style={{ padding: '8px' }}>
            {mobileMenuItems.map((item) => (
              <button
                key={item.view}
                onClick={() => { setCurrentView(item.view); setShowMobileMenu(false); }}
                style={{
                  ...styles.mobileMenuItem,
                  background: item.active ? 'rgba(139,92,246,0.15)' : 'transparent',
                  borderColor: item.active ? 'rgba(139,92,246,0.4)' : 'transparent',
                  color: item.active ? 'var(--primary)' : '#ffffff',
                }}
              >
                <item.icon size={18} color={item.iconColor || (item.active ? 'var(--primary)' : 'var(--text-secondary)')} />
                <span style={{ fontSize: '0.85rem', fontWeight: item.active ? 600 : 500 }}>{item.label}</span>
              </button>
            ))}
            <button
              onClick={logout}
              style={{
                ...styles.mobileMenuItem,
                color: '#ef4444',
                marginTop: '8px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                paddingTop: '12px',
              }}
            >
              <LogOut size={18} />
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Sign Out</span>
            </button>
          </div>
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
  },
  mobileMenuDropdown: {
    position: 'fixed',
    bottom: '88px',
    right: '16px',
    width: '280px',
    maxWidth: 'calc(100vw - 32px)',
    background: 'rgba(12, 13, 22, 0.95)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '20px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.7), 0 0 30px rgba(139, 92, 246, 0.3)',
    zIndex: 10000,
    overflow: 'hidden'
  },
  mobileMenuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid transparent',
    background: 'transparent',
    color: '#ffffff',
    fontSize: '0.88rem',
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
    fontFamily: 'var(--font-body)'
  }
};
