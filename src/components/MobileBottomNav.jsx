import React from 'react';
import { LayoutGrid, BookOpen, Calendar, FileText, User } from 'lucide-react';

export default function MobileBottomNav({ currentView, setCurrentView }) {
  const TABS = [
    { id: 'my-learning', label: 'Dashboard', icon: LayoutGrid },
    { id: 'learning', label: 'Courses', icon: BookOpen },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'resources', label: 'Vault', icon: FileText },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 flex items-center justify-around border-t backdrop-blur-md px-2"
      style={{
        backgroundColor: 'rgba(247, 245, 240, 0.95)',
        borderColor: '#E4E0D8'
      }}
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive =
          currentView === tab.id || (tab.id === 'learning' && currentView === 'learning-player');

        return (
          <button
            key={tab.id}
            onClick={() => setCurrentView(tab.id)}
            className="flex flex-col items-center justify-center flex-1 py-1 relative transition-colors"
            style={{
              color: isActive ? '#141413' : '#8A8780'
            }}
          >
            {isActive && (
              <span
                className="absolute top-0 w-8 h-0.5 rounded-full"
                style={{ backgroundColor: '#1E5631' }}
              />
            )}
            <Icon
              size={20}
              strokeWidth={isActive ? 2 : 1.75}
              style={{ color: isActive ? '#1E5631' : '#8A8780' }}
            />
            <span
              className="text-[10px] mt-1 font-medium font-sans"
              style={{ fontWeight: isActive ? 600 : 500 }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
