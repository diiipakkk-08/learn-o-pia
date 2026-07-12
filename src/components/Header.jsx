import React, { useState, useEffect } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { GraduationCap, LogOut, BookOpen, Film, Shield, User, Menu, X } from 'lucide-react';

export default function Header({
  currentView,
  setCurrentView,
  setSelectedPlaylistId,
  setSelectedVideoIndex
}) {
  const { currentUser, logout } = useDatabase();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!currentUser) return null;

  const isCreatorOrAdmin = (currentUser.role === 'creator' && currentUser.status === 'active') || currentUser.role === 'admin' || currentUser.role === 'owner';
  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'owner';

  const avatarInitial = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : '?';

  return (
    <header style={{ ...styles.header, position: 'relative' }} className="glass-panel">
      <div style={styles.left}>
        {/* Logo */}
        <div style={styles.logo} onClick={() => setCurrentView('learning')}>
          <div style={styles.logoIcon}>
            <GraduationCap size={20} color="#ffffff" />
          </div>
          <span style={styles.logoText}>Learn-o-pia</span>
        </div>

        {/* Desktop Nav */}
        {!isMobile && (
          <nav style={styles.nav}>
            <button
              onClick={() => setCurrentView('learning')}
              style={{
                ...styles.navBtn,
                background: (currentView === 'learning' || currentView === 'learning-player') ? 'rgba(255,255,255,0.05)' : 'transparent',
                color: (currentView === 'learning' || currentView === 'learning-player') ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              <BookOpen size={15} />
              Learning
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
                <Film size={15} />
                Studio
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
                <Shield size={15} />
                Admin Panel
              </button>
            )}
          </nav>
        )}
      </div>

      {/* Desktop User Options */}
      {!isMobile && (
        <div style={styles.right}>
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
        </div>
      )}

      {/* Mobile Hamburger toggle */}
      {isMobile && (
        <button 
          onClick={() => setMenuOpen(!menuOpen)} 
          style={{
            background: 'transparent',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '8px'
          }}
          title="Toggle Menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      )}

      {/* Mobile drop down drawer menu */}
      {isMobile && menuOpen && (
        <div style={styles.mobileDropdown} className="glass-panel animate-fade-in">
          <button
            onClick={() => { setCurrentView('learning'); setMenuOpen(false); }}
            style={{
              ...styles.mobileMenuBtn,
              background: (currentView === 'learning' || currentView === 'learning-player') ? 'rgba(255,255,255,0.05)' : 'transparent',
              color: (currentView === 'learning' || currentView === 'learning-player') ? '#ffffff' : 'var(--text-secondary)'
            }}
          >
            <BookOpen size={16} />
            Learning
          </button>

          {isCreatorOrAdmin && (
            <button
              onClick={() => { setCurrentView('studio'); setMenuOpen(false); }}
              style={{
                ...styles.mobileMenuBtn,
                background: currentView === 'studio' ? 'rgba(255,255,255,0.05)' : 'transparent',
                color: currentView === 'studio' ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              <Film size={16} />
              Studio
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => { setCurrentView('admin'); setMenuOpen(false); }}
              style={{
                ...styles.mobileMenuBtn,
                background: currentView === 'admin' ? 'rgba(255,255,255,0.05)' : 'transparent',
                color: currentView === 'admin' ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              <Shield size={16} />
              Admin Panel
            </button>
          )}

          <button
            onClick={() => { setCurrentView('profile'); setMenuOpen(false); }}
            style={{
              ...styles.mobileMenuBtn,
              background: currentView === 'profile' ? 'rgba(255,255,255,0.05)' : 'transparent',
              color: currentView === 'profile' ? '#ffffff' : 'var(--text-secondary)'
            }}
          >
            <User size={16} />
            Account
          </button>

          <div style={styles.mobileProfileDivider} />

          <div style={styles.mobileProfileRow}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {currentUser.picture ? (
                <img src={currentUser.picture} alt={currentUser.name} style={styles.avatarImg} referrerPolicy="no-referrer" />
              ) : (
                <div style={styles.avatarInitial}>{avatarInitial}</div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>{currentUser.name}</span>
                <span className={`badge badge-${currentUser.role}`} style={{ fontSize: '0.55rem', padding: '2px 6px', marginTop: '2px', display: 'inline-block', width: 'fit-content' }}>
                  {currentUser.role}
                </span>
              </div>
            </div>
            <button onClick={() => { logout(); setMenuOpen(false); }} style={styles.logoutBtn} title="Sign Out">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

const styles = {
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 24px', borderRadius: '0 0 16px 16px',
    borderTop: 'none', borderLeft: 'none', borderRight: 'none',
    background: 'rgba(17,18,28,0.85)',
    marginBottom: '20px', position: 'sticky', top: 0, zIndex: 200
  },
  left: { display: 'flex', alignItems: 'center', gap: '32px' },
  logo: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' },
  logoIcon: {
    width: '32px', height: '32px', borderRadius: '8px',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 10px rgba(139,92,246,0.3)'
  },
  logoText: {
    fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.2rem',
    background: 'linear-gradient(135deg, #ffffff 30%, #a78bfa 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.01em'
  },
  nav: { display: 'flex', alignItems: 'center', gap: '4px' },
  navBtn: {
    display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
    background: 'transparent', border: 'none', cursor: 'pointer',
    fontSize: '0.85rem', fontWeight: 500, fontFamily: 'var(--font-heading)',
    borderRadius: '8px', transition: 'all 0.2s'
  },
  right: { display: 'flex', alignItems: 'center', gap: '10px' },
  userInfoBtn: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '6px 12px', borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.06)',
    background: 'transparent', cursor: 'pointer', transition: 'all 0.2s'
  },
  avatarImg: { width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(139,92,246,0.4)', flexShrink: 0 },
  avatarInitial: {
    width: '30px', height: '30px', borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.8rem', fontWeight: 700, color: '#fff', flexShrink: 0
  },
  userText: { display: 'flex', flexDirection: 'column', textAlign: 'left' },
  userName: { fontSize: '0.82rem', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap' },
  logoutBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
    color: '#fca5a5', width: '34px', height: '34px', borderRadius: '8px',
    cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0
  },
  mobileDropdown: {
    position: 'absolute',
    top: '100%',
    left: '10px',
    right: '10px',
    background: 'rgba(17,18,28,0.95)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    marginTop: '5px'
  },
  mobileMenuBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    fontWeight: 500,
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    transition: 'all 0.2s'
  },
  mobileProfileDivider: {
    height: '1px',
    background: 'rgba(255, 255, 255, 0.08)',
    margin: '4px 0'
  },
  mobileProfileRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px'
  }
};
