import React, { useState, useEffect } from 'react';
import { DatabaseProvider, useDatabase } from './context/DatabaseContext';
import Auth from './components/Auth';
import Header from './components/Header';
import Profile from './components/Profile';

// Shared Learning Views
import CoursesDashboard from './components/learning/CoursesDashboard';
import LearningPlayer from './components/learning/LearningPlayer';

// Creator Views
import CreatorStudio from './components/creator/CreatorStudio';

// Admin Views
import AdminDashboard from './components/admin/AdminDashboard';

// Lucide Shield Icon for access denied page
import { ShieldAlert, ArrowLeft } from 'lucide-react';

function AccessDenied({ requiredRole, setCurrentView }) {
  return (
    <div style={styles.deniedContainer} className="glass-panel animate-fade-in">
      <ShieldAlert size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
      <h2 style={{ fontSize: '1.4rem', color: '#ffffff' }}>Access Denied</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px', maxWidth: '340px' }}>
        You do not have the required credentials to view this page. This workspace is restricted to active **{requiredRole}s** only.
      </p>
      <button 
        onClick={() => setCurrentView('learning')} 
        className="btn btn-secondary" 
        style={{ marginTop: '20px', fontSize: '0.85rem', borderColor: 'rgba(255,255,255,0.1)' }}
      >
        <ArrowLeft size={14} />
        Back to Learning
      </button>
    </div>
  );
}

function AppContent() {
  const { currentUser } = useDatabase();
  const [currentView, setCurrentView] = useState('learning');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);

  // Auto redirect on login/logout
  useEffect(() => {
    if (!currentUser) {
      setCurrentView('auth');
    } else {
      setCurrentView('learning');
    }
  }, [currentUser]);

  // Route security check helpers
  const isCreatorOrAdmin = currentUser && (currentUser.role === 'creator' || currentUser.role === 'admin' || currentUser.role === 'owner');
  const isVerifiedCreator = currentUser && currentUser.role === 'creator' && currentUser.status === 'active';
  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'owner');

  return (
    <div className="app-container">
      {/* Global Header Nav */}
      {currentUser && (
        <Header 
          currentView={currentView} 
          setCurrentView={setCurrentView} 
          setSelectedPlaylistId={setSelectedPlaylistId}
          setSelectedVideoIndex={setSelectedVideoIndex}
        />
      )}

      {/* Main Container Viewport */}
      <main className="main-content">
        {!currentUser ? (
          <Auth />
        ) : (
          <>
            {/* View router mapping */}
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
              />
            )}
            {currentView === 'profile' && (
              <Profile 
                setCurrentView={setCurrentView} 
                setSelectedPlaylistId={setSelectedPlaylistId} 
              />
            )}
            
            {/* Guarded Studio Access */}
            {currentView === 'studio' && (
              (isVerifiedCreator || isAdmin) ? (
                <CreatorStudio />
              ) : (
                <AccessDenied requiredRole="Creator" setCurrentView={setCurrentView} />
              )
            )}

            {/* Guarded Admin Panel Access */}
            {currentView === 'admin' && (
              isAdmin ? (
                <AdminDashboard />
              ) : (
                <AccessDenied requiredRole="Admin" setCurrentView={setCurrentView} />
              )
            )}
          </>
        )}
      </main>
    </div>
  );
}

import { GoogleOAuthProvider } from '@react-oauth/google';

// Replace with your own Google Client ID from https://console.cloud.google.com/
// Create a project → Credentials → OAuth 2.0 → Web Application
// Add http://localhost:5173 to Authorized JavaScript origins
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <DatabaseProvider>
        <AppContent />
      </DatabaseProvider>
    </GoogleOAuthProvider>
  );
}

const styles = {
  deniedContainer: {
    padding: '60px 20px',
    maxWidth: '460px',
    margin: '40px auto 0 auto',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center'
  }
};
