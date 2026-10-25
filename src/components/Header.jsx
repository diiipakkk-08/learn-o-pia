/**
 * Header.jsx
 * Top sticky navigation bar featuring brand identity, fuzzy search, theme toggling, notices, and user profile.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import {
  Search,
  Bell,
  User,
  Moon,
  Sun,
  LogOut,
  Sparkles,
  ShieldAlert,
  Info,
  X,
  ExternalLink,
  PanelLeft,
  BellRing
} from 'lucide-react';

export default function Header({
  currentView,
  setCurrentView,
  isSidebarCollapsed,
  onToggleSidebar,
  cinemaMode,
  setCinemaMode
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
  const [showAnnouncementsDropdown, setShowAnnouncementsDropdown] = useState(false);
  const profileMenuRef = useRef(null);
  const announcementsRef = useRef(null);

  const [notificationPermission, setNotificationPermission] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  const handleEnableNotifications = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
      } catch (err) {
        console.warn('Request notification permission error:', err);
      }
    }
  };

  useEffect(() => {
    const handleOpen = () => {
      setShowAnnouncementsDropdown(true);
      if (markAnnouncementsRead) markAnnouncementsRead();
    };
    window.addEventListener('learnopia_open_announcements', handleOpen);
    return () => window.removeEventListener('learnopia_open_announcements', handleOpen);
  }, [markAnnouncementsRead]);

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

  // Click outside listener for profile and announcements dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
      if (announcementsRef.current && !announcementsRef.current.contains(e.target)) {
        setShowAnnouncementsDropdown(false);
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
      ? 'Search documents, notes, or PDFs...'
      : currentView === 'marketplace'
      ? 'Search textbooks, lab kits, drafters, services...'
      : currentView === 'learning'
      ? 'Search courses & university subjects...'
      : 'Search Learnopia...';

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
      className="sticky top-0 z-40 px-3 sm:px-6 lg:px-8 h-14 flex items-center justify-between border-b backdrop-blur-md transition-colors gap-3"
      style={{
        backgroundColor: cinemaMode
          ? 'rgba(0, 0, 0, 0.92)'
          : 'rgba(247, 245, 240, 0.94)',
        borderColor: cinemaMode ? '#262626' : '#E4E0D8'
      }}
    >
      {/* Left: Brand Wordmark */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        <button
          onClick={() => setCurrentView && setCurrentView('landing')}
          title="Learnopia Home"
          aria-label="Learnopia Home"
          className="text-left focus:outline-none flex items-center gap-1.5 sm:gap-2.5 transition-opacity hover:opacity-85 cursor-pointer group"
        >
          <img
            src={cinemaMode ? '/learnopia-logo-dark-on.svg' : '/learnopia-logo-light-off.svg'}
            alt="Learnopia"
            className="w-6 h-6 sm:w-7 sm:h-7 object-contain shrink-0 group-hover:scale-105 transition-transform"
          />
          <span
            className="font-editorial text-lg sm:text-2xl lg:text-[26px] tracking-tight block leading-none font-bold"
            style={{ color: cinemaMode ? '#FFFFFF' : '#141413' }}
          >
            Learnopia
          </span>
        </button>
      </div>

      {/* Global Fuzzy Search Bar */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-2">
        <div
          className="w-full flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg border text-sm transition-all"
          style={{
            backgroundColor: cinemaMode ? '#121212' : '#EFECE6',
            borderColor: cinemaMode ? '#262626' : '#E2DDD3'
          }}
        >
          <Search size={15} style={{ color: cinemaMode ? '#FACC15' : '#8A8780' }} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={searchPlaceholder}
            value={globalSearchQuery || ''}
            onChange={handleSearchChange}
            className="w-full bg-transparent border-none text-xs sm:text-sm focus:outline-none placeholder:text-text-muted"
            style={{ color: cinemaMode ? '#FFFFFF' : '#141413' }}
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
              backgroundColor: cinemaMode ? '#1C1C1C' : '#E6E2DA',
              borderColor: cinemaMode ? '#262626' : '#CFCAC0',
              color: cinemaMode ? '#D4D4D8' : '#8A8780'
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
              <Sun size={18} strokeWidth={1.75} className="text-[#FACC15]" />
            ) : (
              <Moon size={18} strokeWidth={1.75} className="text-text-secondary hover:text-text-primary" />
            )}
          </button>
        )}

        {/* Announcements Bell Dropdown */}
        {currentUser && (
          <div className="relative" ref={announcementsRef}>
            <button
              onClick={() => {
                setShowAnnouncementsDropdown(!showAnnouncementsDropdown);
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

            {/* Anchored Notification Dropdown Menu */}
            {showAnnouncementsDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-border-subtle bg-surface p-3.5 shadow-modal z-50 animate-fade-in text-text-primary space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                  <div>
                    <span className="font-editorial text-lg tracking-tight block">
                      Academic Broadcasts
                    </span>
                    <span className="text-[10px] text-text-muted font-mono-tabular">
                      OFFICIAL CAMPUS & PLATFORM NOTICES
                    </span>
                  </div>
                  <button
                    onClick={() => setShowAnnouncementsDropdown(false)}
                    className="p-1 rounded text-text-muted hover:text-text-primary cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>

                {notificationPermission === 'default' && (
                  <div className="p-2.5 rounded-lg border border-accent-forest/30 bg-accent-forest/10 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-accent-forest">
                      <BellRing size={13} className="shrink-0" />
                      <span className="font-semibold text-[11px]">Enable desktop notifications</span>
                    </div>
                    <button
                      onClick={handleEnableNotifications}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent-forest text-white hover:opacity-90 transition-opacity cursor-pointer shadow-xs shrink-0"
                    >
                      Enable
                    </button>
                  </div>
                )}

                <div className="max-h-72 overflow-y-auto space-y-2.5 pr-0.5">
                  {announcements && announcements.length > 0 ? (
                    announcements.map((item, idx) => {
                      const linkUrl = item.link || item.resourceUrl;
                      return (
                        <div
                          key={item.id || idx}
                          className="p-3 rounded-lg border border-border-subtle bg-canvas space-y-1.5 text-left"
                        >
                          <div className="flex items-center justify-between text-[11px] text-text-muted font-mono-tabular">
                            <span className="font-semibold text-text-secondary">
                              {item.author || item.createdBy || 'Campus Admin'}
                            </span>
                            <span>
                              {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : (item.date || 'Recent')}
                            </span>
                          </div>
                          {item.title && (
                            <h5 className="text-xs font-bold text-text-primary leading-snug">
                              {item.title}
                            </h5>
                          )}
                          <p className="text-xs text-text-secondary font-medium leading-relaxed">
                            {item.message || item.text}
                          </p>
                          {linkUrl && (
                            <div className="pt-1">
                              <a
                                href={linkUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-accent-forest/10 text-accent-forest hover:bg-accent-forest/20 transition-colors shadow-xs"
                              >
                                <span>{item.resourceTitle || 'Open Attached Resource'}</span>
                                <ExternalLink size={11} />
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-text-muted text-xs">
                      No active announcements. Check back later for campus notices.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
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
                  <span>Profile</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentView('studio');
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover text-left transition-colors"
                >
                  <Sparkles size={15} />
                  <span>Studio</span>
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
                    <span>Admin Settings</span>
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
                  <span>About</span>
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
    </header>
  );
}
