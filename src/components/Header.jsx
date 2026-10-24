import React, { useState, useEffect, useRef } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import {
  Search,
  Bell,
  User,
  PanelLeftOpen,
  PanelLeftClose,
  Moon,
  Sun,
  LogOut,
  Sparkles,
  ShieldAlert,
  Info,
  BookOpen,
  X,
  FileText
} from 'lucide-react';

export default function Header({
  currentView,
  setCurrentView,
  setSelectedPlaylistId,
  isSidebarCollapsed,
  onToggleSidebar,
  cinemaMode,
  setCinemaMode,
  onTriggerAdModal
}) {
  const {
    currentUser,
    logout,
    globalSearchQuery,
    setGlobalSearchQuery,
    announcements,
    unreadAnnouncementsCount,
    markAnnouncementsRead
  } = useDatabase();

  const searchInputRef = useRef(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);
  const profileMenuRef = useRef(null);

  const isPlayerView = currentView === 'learning-player';

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === '\\' || e.key === 'b') &&
        onToggleSidebar
      ) {
        e.preventDefault();
        onToggleSidebar();
        return;
      }

      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleSidebar]);

  // Click outside listener for profile dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset search query when navigating between distinct sections
  const prevViewRef = useRef(currentView);
  useEffect(() => {
    if (prevViewRef.current !== currentView) {
      if (setGlobalSearchQuery) setGlobalSearchQuery('');
      prevViewRef.current = currentView;
    }
  }, [currentView, setGlobalSearchQuery]);

  const searchPlaceholder =
    currentView === 'resources' || currentView === 'discussions'
      ? 'Search documents, PDFs, or study notes...'
      : currentView === 'marketplace'
      ? 'Search textbooks, lab kits, drafters, services...'
      : currentView === 'learning'
      ? 'Search courses, subjects, or engineering topics...'
      : 'Search Learn-O-Pia courses...';

  const handleSearchChange = (e) => {
    const val = e.target.value;
    if (setGlobalSearchQuery) setGlobalSearchQuery(val);
    if (val.trim().length > 0 && currentView !== 'learning' && currentView !== 'resources' && currentView !== 'marketplace') {
      setCurrentView('learning');
    }
  };

  const userInitials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'owner');

  return (
    <header
      className="sticky top-0 z-30 px-3 sm:px-6 lg:px-8 h-14 flex items-center justify-between border-b backdrop-blur-md transition-colors gap-3"
      style={{
        backgroundColor: cinemaMode
          ? 'rgba(20, 20, 19, 0.94)'
          : 'rgba(247, 245, 240, 0.94)',
        borderColor: cinemaMode ? '#2E2E2B' : '#E4E0D8'
      }}
    >
      {/* Left: Brand Wordmark (Clean Logo) */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setCurrentView(currentUser ? 'my-learning' : 'landing')}
          className="text-left focus:outline-none flex items-center gap-2 transition-opacity hover:opacity-85"
        >
          <span
            className="font-editorial text-2xl lg:text-[26px] tracking-tight block leading-none"
            style={{ color: cinemaMode ? '#F2EFE9' : '#141413' }}
          >
            Learn-O-Pia
          </span>
        </button>
      </div>

      {/* Global Fuzzy Search Bar */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-2">
        <div
          className="w-full flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg border text-sm transition-all"
          style={{
            backgroundColor: cinemaMode ? '#222220' : '#EFECE6',
            borderColor: cinemaMode ? '#2E2E2B' : '#E2DDD3'
          }}
        >
          <Search size={15} style={{ color: '#8A8780' }} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={searchPlaceholder}
            value={globalSearchQuery || ''}
            onChange={handleSearchChange}
            className="w-full bg-transparent border-none text-xs sm:text-sm focus:outline-none placeholder:text-text-muted"
            style={{ color: cinemaMode ? '#F2EFE9' : '#141413' }}
          />
          {globalSearchQuery && (
            <button
              onClick={() => setGlobalSearchQuery && setGlobalSearchQuery('')}
              className="p-0.5 rounded text-text-muted hover:text-text-primary"
            >
              <X size={14} />
            </button>
          )}
          <kbd
            className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono-tabular font-medium rounded border"
            style={{
              backgroundColor: cinemaMode ? '#1C1C1A' : '#E6E2DA',
              borderColor: cinemaMode ? '#2E2E2B' : '#CFCAC0',
              color: '#8A8780'
            }}
          >
            /
          </kbd>
        </div>
      </div>

      {/* Right Actions: Theme Toggle + Announcements + Profile */}
      <div className="flex items-center gap-2">
        {/* Day / Night / Cinema Focus Mode Toggle (Icon Only) */}
        {setCinemaMode && (
          <button
            onClick={() => setCinemaMode(!cinemaMode)}
            className="p-2 rounded-full hover:bg-surface-hover text-text-primary transition-colors cursor-pointer"
            title={cinemaMode ? 'Switch to Light Mode' : 'Switch to Dim Mode'}
            aria-label="Toggle theme mode"
          >
            {cinemaMode ? (
              <Sun size={18} strokeWidth={1.75} className="text-accent-amber" />
            ) : (
              <Moon size={18} strokeWidth={1.75} className="text-text-secondary hover:text-text-primary" />
            )}
          </button>
        )}

        {/* Announcements Bell */}
        {currentUser && (
          <button
            onClick={() => {
              setShowAnnouncementsModal(!showAnnouncementsModal);
              if (markAnnouncementsRead) markAnnouncementsRead();
            }}
            className="relative p-2 rounded-full hover:bg-surface-hover text-text-primary transition-colors cursor-pointer"
            title="Academic Notices & Updates"
            aria-label="Announcements"
          >
            <Bell size={18} strokeWidth={1.75} />
            {unreadAnnouncementsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-forest ring-2 ring-canvas" />
            )}
          </button>
        )}

        {/* User Profile Trigger (Icon Only) */}
        {currentUser ? (
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border border-border-strong bg-subtle text-text-primary hover:border-accent-forest hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
              title="Student Profile & Settings"
              aria-label="User Profile"
            >
              {userInitials}
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border-subtle bg-surface p-1.5 shadow-modal z-50 animate-fade-in text-text-primary">
                <div className="px-3 py-2 border-b border-border-subtle mb-1">
                  <div className="font-semibold text-xs text-text-primary truncate">
                    {currentUser.name || 'Student Account'}
                  </div>
                  <div className="text-[11px] text-text-muted truncate font-mono-tabular">
                    {currentUser.email}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setCurrentView('profile');
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover text-left transition-colors"
                >
                  <User size={15} />
                  <span>Profile & Academic Settings</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentView('studio');
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover text-left transition-colors"
                >
                  <Sparkles size={15} />
                  <span>Creator Studio</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => {
                      setCurrentView('admin');
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover text-left transition-colors"
                  >
                    <ShieldAlert size={15} />
                    <span>Admin Moderation Panel</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setCurrentView('about');
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover text-left transition-colors"
                >
                  <Info size={15} />
                  <span>About & Mission</span>
                </button>

                <div className="border-t border-border-subtle my-1" />

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    if (logout) logout();
                    setCurrentView('landing');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-accent-danger hover:bg-accent-danger-bg text-left"
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView('auth')}
              className="px-3.5 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary"
            >
              Sign In
            </button>
            <button
              onClick={() => setCurrentView('auth')}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark transition-all hover:opacity-95"
            >
              Get Started
            </button>
          </div>
        )}
      </div>

      {/* Announcements Modal / Drawer */}
      {showAnnouncementsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-border-subtle bg-surface p-6 shadow-modal space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div>
                <span className="font-editorial text-2xl tracking-tight block">
                  Academic Broadcasts
                </span>
                <span className="text-xs text-text-muted font-mono-tabular">
                  OFFICIAL CAMPUS & PLATFORM NOTICES
                </span>
              </div>
              <button
                onClick={() => setShowAnnouncementsModal(false)}
                className="p-1 rounded text-text-muted hover:text-text-primary"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-3">
              {announcements && announcements.length > 0 ? (
                announcements.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3.5 rounded-lg border border-border-subtle bg-canvas space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs text-text-muted font-mono-tabular">
                      <span>{item.author || 'Dean of Academics'}</span>
                      <span>{item.date || 'Recent'}</span>
                    </div>
                    <p className="text-sm text-text-primary font-medium leading-relaxed">
                      {item.title || item.message || item.text}
                    </p>
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-accent-forest hover:underline inline-block mt-1"
                      >
                        Open attached document &rarr;
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-text-muted text-xs">
                  No active announcements. Check back later for campus notices.
                </div>
              )}
            </div>

            <button
              onClick={() => setShowAnnouncementsModal(false)}
              className="w-full py-2.5 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark hover:opacity-95"
            >
              Dismiss Notices
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
