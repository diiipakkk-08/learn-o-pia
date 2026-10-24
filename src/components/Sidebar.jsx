/**
 * Sidebar.jsx
 * Primary desktop left sidebar navigation for Learn-O-Pia.
 */

import React from 'react';
import {
  LayoutGrid,
  BookOpen,
  Calendar,
  FileText,
  Users,
  ShoppingBag,
  Pin,
  ShieldAlert,
  PanelLeftClose,
  Info
} from 'lucide-react';
import { useDatabase } from '../context/DatabaseContext';

export default function Sidebar({
  currentView,
  setCurrentView,
  isCollapsed,
  setIsCollapsed,
  onOpenProfile
}) {
  const { currentUser } = useDatabase();

  const NAV_ITEMS = [
    { id: 'my-learning', label: 'Dashboard', icon: LayoutGrid },
    { id: 'learning', label: 'Courses', icon: BookOpen },
    { id: 'attendance', label: 'Attendance Tracker', icon: Calendar },
    { id: 'resources', label: 'Resources View', icon: FileText },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
    { id: 'studio', label: 'Studio', icon: Users },
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
      className={`hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 select-none z-40 transition-all duration-300 ease-in-out bg-sidebar border-r border-border-subtle ${
        isCollapsed ? '-translate-x-full pointer-events-none' : 'translate-x-0'
      }`}
    >
      {/* Brand Wordmark & Collapse Button */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button
          onClick={() => setCurrentView('my-learning')}
          className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
        >
          <img src="/logo.svg" alt="Learn-O-Pia" className="w-8 h-8 object-contain shrink-0" />
          <div>
            <span className="font-editorial text-2xl tracking-tight block leading-none transition-colors text-text-primary">
              Learn-O-Pia
            </span>
            <span className="text-[10px] font-medium tracking-wider uppercase mt-1 block font-mono-tabular text-text-muted">
              Academic OS • 2026
            </span>
          </div>
        </button>

        {/* Hide / Collapse Sidebar Button */}
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1.5 rounded-lg transition-colors hover:bg-surface-hover active:scale-95 text-text-secondary hover:text-text-primary"
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
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-all relative text-left ${
                  isActive
                    ? 'bg-surface-hover text-text-primary font-semibold'
                    : 'text-text-secondary hover:bg-surface-hover/60 hover:text-text-primary font-medium'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-accent-forest" />
                )}
                <Icon
                  size={18}
                  strokeWidth={1.75}
                  className={isActive ? 'text-accent-forest' : 'text-text-secondary'}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Views & Quick Modes */}
        <div className="pt-4 mt-4 border-t border-border-subtle">
          <span className="px-3.5 text-[11px] font-semibold uppercase tracking-wider block mb-1.5 font-mono-tabular text-text-muted">
            Quick Actions
          </span>

          <button
            onClick={() => setCurrentView('about')}
            className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium transition-all text-left ${
              currentView === 'about'
                ? 'bg-surface-hover text-text-primary font-semibold'
                : 'text-text-secondary hover:bg-surface-hover/60 hover:text-text-primary'
            }`}
          >
            <Info size={15} strokeWidth={1.75} />
            <span>About Learn-O-Pia</span>
          </button>

          {/* Admin Moderation Button (Only for Admins) */}
          {isAdminOrOwner && (
            <button
              onClick={() => setCurrentView('admin')}
              className={`w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                currentView === 'admin'
                  ? 'bg-surface-hover text-text-primary font-semibold'
                  : 'text-text-secondary hover:bg-surface-hover/60 hover:text-text-primary'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldAlert size={15} strokeWidth={1.75} />
                <span>Admin Panel</span>
              </div>
              <span className="text-[10px] font-mono-tabular font-bold px-1.5 py-0.5 rounded bg-accent-forest/10 text-accent-forest border border-accent-forest/20">
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
          className="p-3 mx-2 mb-2 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover transition-colors flex items-center justify-between cursor-pointer"
          title="View Student Profile & Settings"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border border-border-strong bg-subtle text-text-primary">
              {userInitials}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold leading-tight truncate text-text-primary">
                {currentUser.name || 'Student'}
              </div>
              <div className="text-[11px] truncate font-mono-tabular text-text-muted">
                {currentUser.semester ? `Sem ${currentUser.semester}` : 'Student'} • {currentUser.branch ? currentUser.branch.split(' ')[0] : (currentUser.role || 'learner')}
              </div>
            </div>
          </div>
          <Pin size={14} className="shrink-0 text-text-muted" />
        </div>
      )}
    </aside>
  );
}
