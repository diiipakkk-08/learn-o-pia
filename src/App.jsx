import React, { useState, useEffect } from 'react';
import { DatabaseProvider, useDatabase } from './context/DatabaseContext';

// Navigation & Shell Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MobileBottomNav from './components/MobileBottomNav';
import AdProgressBar from './components/AdProgressBar';

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
import Auth from './components/Auth';
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

function NotFoundView({ setCurrentView }) {
  return (
    <div className="max-w-md mx-auto my-16 p-8 rounded-xl border border-border-subtle bg-surface text-center space-y-4">
      <h2 className="text-xl font-bold font-editorial">Page Not Found</h2>
      <p className="text-sm text-text-secondary">
        The workspace section you requested could not be located.
      </p>
      <button
        onClick={() => setCurrentView('my-learning')}
        className="px-4 py-2 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark"
      >
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

  const [cinemaMode, setCinemaMode] = useState(false);
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
    } catch (e) {}
  }, [isSidebarCollapsed]);

  useEffect(() => {
    if (currentUser?.id) {
      setOnboardingDone(Boolean(currentUser.onboardingCompleted));
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
          } catch (e) {}
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
      <LandingPage
        setCurrentView={setCurrentView}
        onEnterApp={() => setCurrentView(currentUser ? 'my-learning' : 'auth')}
        onOpenAuth={() => setCurrentView('auth')}
        onBrowseCourses={() => setCurrentView('learning')}
      />
    );
  }

  // Standalone Auth Page
  if (currentView === 'auth') {
    return <Auth setCurrentView={setCurrentView} />;
  }

  const isPlayerView = currentView === 'learning-player';
  const showOnboardingModal = !!currentUser && !currentUser.onboardingCompleted && !onboardingDone;
  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'owner');

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row transition-colors duration-200 bg-canvas text-text-primary"
      data-theme={cinemaMode && isPlayerView ? 'cinema' : 'default'}
      style={{
        backgroundColor: cinemaMode && isPlayerView ? '#141413' : '#F7F5F0',
        color: cinemaMode && isPlayerView ? '#F2EFE9' : '#141413'
      }}
    >
      {/* Desktop Left Sidebar */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        cinemaMode={cinemaMode}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        onOpenAdModal={() => setShowAdModal(true)}
        onOpenProfile={() => setCurrentView('profile')}
      />

      {/* Main Column Wrapper */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'lg:pl-0' : 'lg:pl-64'
        }`}
      >
        {/* Sticky Top Header Nav */}
        <Header
          currentView={currentView}
          setCurrentView={setCurrentView}
          setSelectedPlaylistId={setSelectedPlaylistId}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          cinemaMode={cinemaMode}
          setCinemaMode={setCinemaMode}
          onTriggerAdModal={() => setShowAdModal(true)}
        />

        {/* Main View Container */}
        <main className="flex-1 pb-20 lg:pb-8">
          {/* Unauthenticated Wall for Protected Views */}
          {!currentUser && !['about', 'learning'].includes(currentView) ? (
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
                  setCurrentView={setCurrentView}
                  setSelectedPlaylistId={setSelectedPlaylistId}
                  setSelectedVideoIndex={setSelectedVideoIndex}
                />
              )}

              {currentView === 'learning' && (
                <CoursesDashboard
                  setSelectedPlaylistId={setSelectedPlaylistId}
                  setSelectedVideoIndex={setSelectedVideoIndex}
                  setCurrentView={setCurrentView}
                />
              )}

              {currentView === 'learning-player' && (
                <LearningPlayer
                  playlistId={selectedPlaylistId}
                  activeVideoIndex={selectedVideoIndex}
                  setActiveVideoIndex={setSelectedVideoIndex}
                  setCurrentView={setCurrentView}
                  cinemaMode={cinemaMode}
                  setCinemaMode={setCinemaMode}
                />
              )}

              {currentView === 'attendance' && (
                <AttendanceTracker setCurrentView={setCurrentView} />
              )}

              {(currentView === 'resources' || currentView === 'discussions') && (
                <ResourcesView
                  setCurrentView={setCurrentView}
                  setSelectedPlaylistId={setSelectedPlaylistId}
                />
              )}

              {currentView === 'studio' && (
                <CreatorStudio
                  setCurrentView={setCurrentView}
                  setSelectedPlaylistId={setSelectedPlaylistId}
                />
              )}

              {currentView === 'admin' && (
                isAdmin ? (
                  <AdminDashboard setCurrentView={setCurrentView} />
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

              {['results-404', 'discussions-404'].includes(currentView) && (
                <NotFoundView setCurrentView={setCurrentView} />
              )}
            </>
          )}
        </main>
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
