import React, { useState, useEffect, useRef } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { GraduationCap, LogOut, BookOpen, Film, Shield, User, Menu, X, Search, Play, FileText } from 'lucide-react';
import { fuzzyMatch } from '../utils/fuzzySearch';

export default function Header({
  currentView,
  setCurrentView,
  setSelectedCourseId,
  setSelectedSubjectId,
  setSelectedPlaylistId,
  setSelectedVideoIndex
}) {
  const { currentUser, courses, logout } = useDatabase();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [menuOpen, setMenuOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

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

  // Handle outside click to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Instant Typo-Tolerant Search Logic
  useEffect(() => {
    if (!searchQuery.trim() || !courses) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }

    const q = searchQuery.trim();
    const results = [];

    (courses || []).forEach(c => {
      if (fuzzyMatch(q, c.title) || fuzzyMatch(q, c.department)) {
        results.push({ type: 'course', title: c.title, category: c.department || 'Course', courseId: c.id });
      }

      (c.subjects || []).forEach(s => {
        if (fuzzyMatch(q, s.title)) {
          results.push({ type: 'subject', title: s.title, category: `Subject in ${c.title}`, courseId: c.id, subjectId: s.id });
        }

        (s.playlists || []).forEach(p => {
          if (fuzzyMatch(q, p.title) || fuzzyMatch(q, p.description)) {
            results.push({ type: 'playlist', title: p.title, category: `Playlist in ${s.title}`, courseId: c.id, subjectId: s.id, playlistId: p.id });
          }

          (p.videos || []).forEach((v, vIdx) => {
            if (fuzzyMatch(q, v.title) || fuzzyMatch(q, v.description)) {
              results.push({
                type: 'video',
                title: v.title,
                category: `Lecture ${vIdx + 1} in ${p.title}`,
                courseId: c.id,
                subjectId: s.id,
                playlistId: p.id,
                videoIndex: vIdx
              });
            }
          });
        });
      });
    });

    setSearchResults(results.slice(0, 7)); // top 7 fuzzy matches
    setIsSearchOpen(true);
  }, [searchQuery, courses]);

  if (!currentUser) return null;

  const isCreatorOrAdmin = (currentUser.role === 'creator' && currentUser.status === 'active') || currentUser.role === 'admin' || currentUser.role === 'owner';
  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'owner';

  const avatarInitial = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : '?';

  const handleSelectResult = (item) => {
    setIsSearchOpen(false);
    setSearchQuery('');

    if (item.courseId && setSelectedCourseId) setSelectedCourseId(item.courseId);
    if (item.subjectId && setSelectedSubjectId) setSelectedSubjectId(item.subjectId);
    if (item.playlistId && setSelectedPlaylistId) setSelectedPlaylistId(item.playlistId);
    if (item.videoIndex !== undefined && setSelectedVideoIndex) setSelectedVideoIndex(item.videoIndex);

    setCurrentView('learning-player');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
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

      {/* Middle: Typo-Tolerant Global Search Bar */}
      {!isMobile && (
        <div ref={searchRef} style={{ position: 'relative', width: '100%', maxWidth: '380px', margin: '0 16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '6px 14px',
            transition: 'all 0.2s',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
          }}>
            <Search size={15} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search courses, lectures, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim() && setIsSearchOpen(true)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#ffffff',
                fontSize: '0.82rem',
                width: '100%'
              }}
            />
            {searchQuery && (
              <X size={14} color="var(--text-muted)" style={{ cursor: 'pointer' }} onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }} />
            )}
          </div>

          {/* Dropdown Floating Results */}
          {isSearchOpen && searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              background: '#12141e',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '12px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
              zIndex: 1000,
              padding: '8px 0',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '360px',
              overflowY: 'auto'
            }} className="glass-panel animate-fade-in">
              <div style={{ padding: '6px 14px 4px 14px', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>
                Smart Search Suggestions ({searchResults.length})
              </div>
              {searchResults.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectResult(item)}
                  style={{
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    borderBottom: idx === searchResults.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)',
                    transition: 'all 0.15s'
                  }}
                  className="lecture-item-hover"
                >
                  {item.type === 'video' ? <Play size={14} color="var(--primary)" /> : <BookOpen size={14} color="var(--secondary)" />}
                  <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: '0.84rem', color: '#ffffff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {item.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
    </div>
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
