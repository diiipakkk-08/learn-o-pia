import React, { useState, useEffect } from 'react';
import { DatabaseProvider, useDatabase } from './context/DatabaseContext';

// Navigation & Shell Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MobileBottomNav from './components/MobileBottomNav';

// Core Workspace Views
import LandingPage from './components/LandingPage';
import MyLearningView from './components/learning/MyLearningView';
import CoursesDashboard from './components/learning/CoursesDashboard';
import LearningPlayer from './components/learning/LearningPlayer';
import AttendanceTracker from './components/AttendanceTracker';
import ResourcesView from './components/resources/ResourcesView';
import CreatorStudio from './components/creator/CreatorStudio';
import AdminDashboard from './components/admin/AdminDashboard';
import Profile from './components/Profile';
import About from './components/About';
import MarketplaceView from './components/marketplace/MarketplaceView';
import Auth from './components/Auth';
import NotFound404 from './components/NotFound404';
import OnboardingModal from './components/OnboardingModal';
import AdDonationModal from './components/AdDonationModal';

import { ShieldAlert, ArrowLeft } from 'lucide-react';

function AccessDenied({ requiredRole, setCurrentView }) {
  return (
    <div className="max-w-md mx-auto my-16 p-8 rounded-xl border border-border-subtle bg-surface text-center space-y-4 shadow-modal">
      <ShieldAlert size={48} className="text-accent-danger mx-auto" />
      <h2 className="text-xl font-bold font-editorial">Access Restricted</h2>
      <p className="text-sm text-text-secondary">
        You do not have the required credentials to view this area. This section is restricted to active <strong>{requiredRole}s</strong> only.
      </p>
      <button
        onClick={() => setCurrentView('my-learning')}
        className="px-4 py-2 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark inline-flex items-center gap-2 hover:opacity-95"
      >
        <ArrowLeft size={14} />
        Return to Dashboard
      </button>
    </div>
  );
}


function AppContent() {
  const { currentUser, authLoading } = useDatabase();

  const [currentView, setCurrentView] = useState(() => {
    return localStorage.getItem('learnopia_view') || 'landing';
  });
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(() => {
    return localStorage.getItem('learnopia_selected_playlist') || null;
  });
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(() => {
    const val = localStorage.getItem('learnopia_selected_video');
    return val ? parseInt(val, 10) : 0;
  });

  const [cinemaMode, setCinemaMode] = useState(() => {
    try {
      return localStorage.getItem('learnopia_theme') === 'cinema';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('learnopia_theme', cinemaMode ? 'cinema' : 'default');
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', cinemaMode ? 'cinema' : 'default');
      }
    } catch {}
  }, [cinemaMode]);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('learnopia_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Modals state
  const [showAdModal, setShowAdModal] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('learnopia_sidebar_collapsed', isSidebarCollapsed ? 'true' : 'false');
    } catch {}
  }, [isSidebarCollapsed]);

  useEffect(() => {
    if (currentUser?.id) {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(`learnopia_onboarding_done_${currentUser.id}`) : null;
      setOnboardingDone(Boolean(currentUser.onboardingCompleted || stored === 'true'));
    } else {
      setOnboardingDone(false);
    }
  }, [currentUser?.id, currentUser?.onboardingCompleted]);

  // Handle Supabase OAuth / recovery hash
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      if (
        window.location.hash.includes('access_token=') ||
        window.location.hash.includes('type=signup') ||
        window.location.hash.includes('type=recovery')
      ) {
        const timer = setTimeout(() => {
          try {
            window.history.replaceState(null, '', window.location.pathname);
          } catch {}
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Sync view states to localStorage
  useEffect(() => {
    localStorage.setItem('learnopia_view', currentView);
  }, [currentView]);

  useEffect(() => {
    if (selectedPlaylistId) {
      localStorage.setItem('learnopia_selected_playlist', selectedPlaylistId);
    } else {
      localStorage.removeItem('learnopia_selected_playlist');
    }
  }, [selectedPlaylistId]);

  useEffect(() => {
    localStorage.setItem('learnopia_selected_video', selectedVideoIndex.toString());
  }, [selectedVideoIndex]);

  // Auto redirect to workspace if logged in while on auth page
  useEffect(() => {
    if (authLoading) return;
    if (currentUser && currentView === 'auth') {
      setCurrentView('my-learning');
    }
  }, [currentUser, authLoading, currentView]);

  // Standalone Public Landing Page
  if (currentView === 'landing') {
    return (
      <div data-theme={cinemaMode ? 'cinema' : 'default'} className="min-h-screen bg-canvas text-text-primary">
        <LandingPage
          setCurrentView={setCurrentView}
          onEnterApp={() => setCurrentView(currentUser ? 'my-learning' : 'auth')}
          onOpenAuth={() => setCurrentView('auth')}
          onBrowseCourses={() => setCurrentView('learning')}
          cinemaMode={cinemaMode}
          onToggleTheme={() => setCinemaMode(!cinemaMode)}
        />
      </div>
    );
  }

  // Standalone Auth Page
  if (currentView === 'auth') {
    return <Auth setCurrentView={setCurrentView} />;
  }

  const showOnboardingModal = !!currentUser && !currentUser.onboardingCompleted && !onboardingDone;
  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'owner');

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-200 bg-canvas text-text-primary"
      data-theme={cinemaMode ? 'cinema' : 'default'}
    >
      {/* Sticky Top Header Nav - Always Stays across the entire screen */}
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        cinemaMode={cinemaMode}
        setCinemaMode={setCinemaMode}
      />

      {/* Main Workspace Body with Collapsing Menu Below Header */}
      <div className="flex-1 flex flex-row relative min-w-0">
        {/* Left Collapsing Sidebar Menu below Header */}
        <Sidebar
          currentView={currentView}
          setCurrentView={setCurrentView}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          onOpenProfile={() => setCurrentView('profile')}
        />

        {/* Main Column Wrapper */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
            isSidebarCollapsed ? 'lg:pl-0' : 'lg:pl-64'
          }`}
        >
          {/* Main View Container */}
          <main className="flex-1 w-full pb-20 lg:pb-8">
          {/* Unauthenticated Wall for Protected Views (Allow public browsing of catalog, vault, marketplace, and player) */}
          {!currentUser && !['about', 'learning', 'marketplace', 'resources', 'learning-player'].includes(currentView) ? (
            <div className="max-w-md mx-auto my-16 p-8 rounded-xl border border-border-subtle bg-surface text-center space-y-4 shadow-modal">
              <h2 className="text-xl font-bold font-editorial">Student Workspace Sign In</h2>
              <p className="text-sm text-text-secondary">
                Please sign in to access your course progress, attendance ledger, and academic notes.
              </p>
              <button
                onClick={() => setCurrentView('auth')}
                className="w-full py-2.5 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark hover:opacity-95"
              >
                Sign In to Workspace
              </button>
            </div>
          ) : (
            <>
              {currentView === 'my-learning' && (
                <MyLearningView
                  isSidebarCollapsed={isSidebarCollapsed}
                  setCurrentView={setCurrentView}
                  setSelectedPlaylistId={setSelectedPlaylistId}
                  setSelectedVideoIndex={setSelectedVideoIndex}
                />
              )}

              {currentView === 'learning' && (
                <CoursesDashboard
                  isSidebarCollapsed={isSidebarCollapsed}
                  setSelectedPlaylistId={setSelectedPlaylistId}
                  setSelectedVideoIndex={setSelectedVideoIndex}
                  setCurrentView={setCurrentView}
                />
              )}

              {currentView === 'marketplace' && (
                <MarketplaceView
                  isSidebarCollapsed={isSidebarCollapsed}
                  setCurrentView={setCurrentView}
                />
              )}

              {currentView === 'learning-player' && (
                <LearningPlayer
                  isSidebarCollapsed={isSidebarCollapsed}
                  playlistId={selectedPlaylistId}
                  activeVideoIndex={selectedVideoIndex}
                  setActiveVideoIndex={setSelectedVideoIndex}
                  setCurrentView={setCurrentView}
                  cinemaMode={cinemaMode}
                  setCinemaMode={setCinemaMode}
                />
              )}

              {currentView === 'attendance' && (
                <AttendanceTracker
                  isSidebarCollapsed={isSidebarCollapsed}
                  setCurrentView={setCurrentView}
                />
              )}

              {(currentView === 'resources' || currentView === 'discussions') && (
                <ResourcesView
                  isSidebarCollapsed={isSidebarCollapsed}
                  setCurrentView={setCurrentView}
                  setSelectedPlaylistId={setSelectedPlaylistId}
                />
              )}

              {currentView === 'studio' && (
                <CreatorStudio
                  isSidebarCollapsed={isSidebarCollapsed}
                  setCurrentView={setCurrentView}
                  setSelectedPlaylistId={setSelectedPlaylistId}
                />
              )}

              {currentView === 'admin' && (
                isAdmin ? (
                  <AdminDashboard
                    isSidebarCollapsed={isSidebarCollapsed}
                    setCurrentView={setCurrentView}
                  />
                ) : (
                  <AccessDenied requiredRole="Administrator" setCurrentView={setCurrentView} />
                )
              )}

              {currentView === 'profile' && (
                <Profile
                  setCurrentView={setCurrentView}
                  setSelectedPlaylistId={setSelectedPlaylistId}
                />
              )}

              {currentView === 'about' && (
                <About setCurrentView={setCurrentView} />
              )}

              {(['404', 'results-404', 'discussions-404'].includes(currentView) ||
                !['my-learning', 'learning', 'marketplace', 'academics', 'attendance', 'timetable', 'learning-player', 'player', 'resources', 'discussions', 'studio', 'admin', 'profile', 'about'].includes(currentView)) && (
                <NotFound404 setCurrentView={setCurrentView} />
              )}
            </>
          )}
        </main>
      </div>
    </div>

      {/* Mobile Bottom Navigation Bar (< 1024px) */}
      <MobileBottomNav currentView={currentView} setCurrentView={setCurrentView} />

      {/* Onboarding Questionnaire Modal */}
      {showOnboardingModal && (
        <OnboardingModal
          user={currentUser}
          onComplete={() => setOnboardingDone(true)}
        />
      )}

      {/* Community Ad & Server Free Pledge Modal */}
      {showAdModal && (
        <AdDonationModal
          isOpen={showAdModal}
          onClose={() => setShowAdModal(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <DatabaseProvider>
      <AppContent />
    </DatabaseProvider>
  );
}
