import React from 'react';
import {
  LayoutGrid,
  BookOpen,
  Calendar,
  FileText,
  Users,
  Play,
  Sparkles,
  Pin,
  ShieldAlert,
  PanelLeftClose,
  Info
} from 'lucide-react';
import { useDatabase } from '../context/DatabaseContext';

export default function Sidebar({
  currentView,
  setCurrentView,
  cinemaMode = false,
  isCollapsed,
  setIsCollapsed,
  onOpenAdModal,
  onOpenProfile
}) {
  const { currentUser } = useDatabase();
  const isPlayerView = currentView === 'learning-player';

  const NAV_ITEMS = [
    { id: 'my-learning', label: 'Dashboard', icon: LayoutGrid },
    { id: 'learning', label: 'Courses', icon: BookOpen },
    { id: 'attendance', label: 'Attendance Tracker', icon: Calendar },
    { id: 'resources', label: 'Resources View', icon: FileText },
    { id: 'studio', label: 'Creator Studio', icon: Users },
  ];

  const isAdminOrOwner = currentUser && (currentUser.role === 'admin' || currentUser.role === 'owner');

  const userInitials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'DS';

  return (
    <aside
      className={`hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 select-none z-40 transition-all duration-300 ease-in-out ${
        isCollapsed ? '-translate-x-full pointer-events-none' : 'translate-x-0'
      }`}
      style={{
        backgroundColor: cinemaMode && isPlayerView ? '#1C1C1A' : '#EFECE6',
        borderRight: `1px solid ${cinemaMode && isPlayerView ? '#2E2E2B' : '#E2DDD3'}`
      }}
    >
      {/* Brand Wordmark & Collapse Button */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button
          onClick={() => setCurrentView('my-learning')}
          className="text-left group focus:outline-none"
        >
          <span
            className="font-editorial text-3xl tracking-tight block leading-none transition-colors"
            style={{ color: cinemaMode && isPlayerView ? '#F2EFE9' : '#141413' }}
          >
            Learn-O-Pia
          </span>
          <span
            className="text-[11px] font-medium tracking-wider uppercase mt-1.5 block font-mono-tabular"
            style={{ color: '#8A8780' }}
          >
            Academic Studio • Web & App
          </span>
        </button>

        {/* Hide / Collapse Sidebar Button */}
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1.5 rounded-lg transition-colors hover:bg-black/5 active:scale-95"
          style={{ color: cinemaMode && isPlayerView ? '#A8A59E' : '#575550' }}
          title="Collapse sidebar (Ctrl + \)"
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose size={18} strokeWidth={1.75} />
        </button>
      </div>

      {/* Primary Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentView === item.id || (currentView === 'learning-player' && item.id === 'learning');

            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-all relative text-left"
                style={{
                  backgroundColor: isActive
                    ? cinemaMode && isPlayerView
                      ? '#2A2A27'
                      : '#E2DDD3'
                    : 'transparent',
                  color: isActive
                    ? cinemaMode && isPlayerView
                      ? '#F2EFE9'
                      : '#141413'
                    : cinemaMode && isPlayerView
                    ? '#A8A59E'
                    : '#575550',
                  fontWeight: isActive ? 600 : 500
                }}
              >
                {isActive && (
                  <span
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r"
                    style={{ backgroundColor: '#1E5631' }}
                  />
                )}
                <Icon
                  size={18}
                  strokeWidth={1.75}
                  style={{
                    color: isActive
                      ? '#1E5631'
                      : cinemaMode && isPlayerView
                      ? '#A8A59E'
                      : '#575550'
                  }}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Views & Quick Modes */}
        <div
          className="pt-4 mt-4 border-t"
          style={{ borderColor: cinemaMode && isPlayerView ? '#2E2E2B' : '#E2DDD3' }}
        >
          <span
            className="px-3.5 text-[11px] font-semibold uppercase tracking-wider block mb-1.5 font-mono-tabular"
            style={{ color: '#8A8780' }}
          >
            Quick Actions
          </span>

          <button
            onClick={() => setCurrentView('landing')}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium transition-all text-left"
            style={{
              backgroundColor: currentView === 'landing' ? '#E2DDD3' : 'transparent',
              color: cinemaMode && isPlayerView ? '#F2EFE9' : '#575550'
            }}
          >
            <Sparkles size={15} strokeWidth={1.75} />
            <span>Public Home</span>
          </button>

          <button
            onClick={() => setCurrentView('about')}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium transition-all text-left"
            style={{
              backgroundColor: currentView === 'about' ? '#E2DDD3' : 'transparent',
              color: cinemaMode && isPlayerView ? '#F2EFE9' : '#575550'
            }}
          >
            <Info size={15} strokeWidth={1.75} />
            <span>About Learn-O-Pia</span>
          </button>

          {/* Admin Moderation Button (Only for Admins) */}
          {isAdminOrOwner && (
            <button
              onClick={() => setCurrentView('admin')}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium transition-all text-left"
              style={{
                backgroundColor: currentView === 'admin' ? '#E2DDD3' : 'transparent',
                color: cinemaMode && isPlayerView ? '#F2EFE9' : '#575550'
              }}
            >
              <div className="flex items-center gap-3">
                <ShieldAlert size={15} strokeWidth={1.75} />
                <span>Admin Panel</span>
              </div>
              <span className="text-[10px] font-mono-tabular font-bold px-1.5 py-0.5 rounded bg-black/5 text-accent-forest">
                STAFF
              </span>
            </button>
          )}
        </div>
      </nav>

      {/* Pinned Student Profile Card */}
      {currentUser && (
        <div
          onClick={onOpenProfile || (() => setCurrentView('profile'))}
          className="p-3 mx-2 mb-2 rounded-lg border flex items-center justify-between cursor-pointer hover:bg-black/5 transition-colors"
          style={{
            borderColor: cinemaMode && isPlayerView ? '#2E2E2B' : '#E2DDD3',
            backgroundColor: cinemaMode && isPlayerView ? '#222220' : 'transparent'
          }}
          title="View Student Profile & Settings"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border"
              style={{
                backgroundColor: '#DFDBD2',
                borderColor: '#CFCAC0',
                color: '#141413'
              }}
            >
              {userInitials}
            </div>
            <div className="min-w-0">
              <div
                className="text-xs font-semibold leading-tight truncate"
                style={{ color: cinemaMode && isPlayerView ? '#F2EFE9' : '#141413' }}
              >
                {currentUser.name || 'Student'}
              </div>
              <div className="text-[11px] truncate font-mono-tabular" style={{ color: '#8A8780' }}>
                {currentUser.semester ? `Sem ${currentUser.semester}` : 'Student'} • {currentUser.branch ? currentUser.branch.split(' ')[0] : (currentUser.role || 'learner')}
              </div>
            </div>
          </div>
          <Pin size={14} className="shrink-0" style={{ color: '#8A8780' }} />
        </div>
      )}
    </aside>
  );
}
