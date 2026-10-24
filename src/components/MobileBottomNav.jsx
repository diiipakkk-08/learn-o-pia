import React from 'react';
import { LayoutGrid, BookOpen, Calendar, FileText, ShoppingBag } from 'lucide-react';

export default function MobileBottomNav({ currentView, setCurrentView }) {
  const TABS = [
    { id: 'my-learning', label: 'Dashboard', icon: LayoutGrid },
    { id: 'learning', label: 'Courses', icon: BookOpen },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'resources', label: 'Vault', icon: FileText },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag }
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 flex items-center justify-around border-t border-border-subtle bg-surface/95 backdrop-blur-md px-2 text-text-primary shadow-lg transition-colors">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive =
          currentView === tab.id || (tab.id === 'learning' && currentView === 'learning-player');

        return (
          <button
            key={tab.id}
            onClick={() => setCurrentView(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-colors cursor-pointer ${
              isActive ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {isActive && (
              <span className="absolute top-0 w-8 h-0.5 rounded-full bg-accent-forest" />
            )}
            <Icon
              size={20}
              strokeWidth={isActive ? 2 : 1.75}
              className={isActive ? 'text-accent-forest' : 'text-text-muted'}
            />
            <span
              className={`text-[10px] mt-1 font-sans ${
                isActive ? 'font-semibold text-text-primary' : 'font-medium text-text-muted'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
