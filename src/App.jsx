import React, { useState, useEffect } from 'react';
import { GraduationCap } from 'lucide-react';
import StudentFeedback from './components/StudentFeedback';
import AdminDashboard from './components/AdminDashboard';
import AdminLoginModal from './components/AdminLoginModal';
import ResetModal from './components/ResetModal';
import {
  subscribeToFeedbacks,
  isFirebaseLive,
  subscribeToActiveSession
} from './services/firebase';

export default function App() {
  const checkIsAdminPath = () => {
    if (typeof window === 'undefined') return false;
    return window.location.pathname.toLowerCase().startsWith('/admin');
  };

  const [isAdminRoute, setIsAdminRoute] = useState(checkIsAdminPath);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const [activeSessionId, setActiveSessionId] = useState('Batch-1');
  const [feedbacks, setFeedbacks] = useState([]);
  const [isLive, setIsLive] = useState(false);

  // Synchronize route with browser URL & history
  useEffect(() => {
    const handleLocationChange = () => {
      const onAdmin = checkIsAdminPath();
      setIsAdminRoute(onAdmin);
      if (onAdmin && !isAdminAuthenticated) {
        setShowAdminLoginModal(true);
      }
    };

    window.addEventListener('popstate', handleLocationChange);

    // Initial check: if user navigated directly to /admin
    if (checkIsAdminPath() && !isAdminAuthenticated) {
      setShowAdminLoginModal(true);
    }

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [isAdminAuthenticated]);

  // Real-time listener for active batch
  useEffect(() => {
    setIsLive(isFirebaseLive());

    const unsubscribe = subscribeToActiveSession((sessionId) => {
      setActiveSessionId(sessionId);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Real-time listener for feedbacks:
  // When in Admin route, fetch 'ALL' so admin can view and filter across any batch
  // When in Student view, fetch for the current activeSessionId
  useEffect(() => {
    const targetScope = isAdminRoute ? 'ALL' : activeSessionId;

    const unsubscribe = subscribeToFeedbacks(targetScope, (items) => {
      setFeedbacks(items);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [activeSessionId, isAdminRoute]);

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setShowAdminLoginModal(false);
  };

  const handleCloseLoginModal = () => {
    setShowAdminLoginModal(false);
    if (!isAdminAuthenticated) {
      // Return back to student view
      window.history.pushState({}, '', '/');
      setIsAdminRoute(false);
    }
  };

  const handleNavigateHome = () => {
    window.history.pushState({}, '', '/');
    setIsAdminRoute(false);
  };

  const handleResetComplete = (newSessionId) => {
    setActiveSessionId(newSessionId);
  };

  return (
    <div className="app-viewport">
      {/* Top Application Header: Clean branding ONLY (No Admin button on student UI) */}
      <header className="app-header">
        <div className="container d-flex align-items-center justify-content-between">
          <div
            className="d-flex align-items-center gap-2 cursor-pointer"
            onClick={handleNavigateHome}
            style={{ cursor: 'pointer' }}
          >
            <div
              className="d-flex align-items-center justify-content-center text-white rounded-3 shadow-sm"
              style={{
                width: '38px',
                height: '38px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              }}
            >
              <GraduationCap size={22} />
            </div>
            <div>
              <div className="fw-bold text-dark lh-1" style={{ fontSize: '1.05rem' }}>
                Student Voice
              </div>
              <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                Anonymous Feedback Portal
              </div>
            </div>
          </div>

          {/* If admin is viewing, show an Exit Admin button */}
          {isAdminRoute && isAdminAuthenticated && (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1 fw-semibold small"
              onClick={handleNavigateHome}
            >
              Exit Admin
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow-1 d-flex flex-column justify-content-center px-3 py-4">
        {isAdminRoute && isAdminAuthenticated ? (
          <AdminDashboard
            feedbacks={feedbacks}
            activeSessionId={activeSessionId}
            onOpenResetModal={() => setShowResetModal(true)}
            isFirebaseActive={isLive}
            onNavigateHome={handleNavigateHome}
          />
        ) : (
          <StudentFeedback
            activeSessionId={activeSessionId}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-3 text-center text-muted small position-relative z-1">
        <div className="container">
          <div className="d-flex flex-wrap justify-content-center align-items-center gap-3">
            <span>🔒 100% Anonymous (No personal data collected)</span>
            <span>•</span>
            <span>📱 One response per device enforced</span>
          </div>
        </div>
      </footer>

      {/* Admin Authentication Modal */}
      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={handleCloseLoginModal}
        onLoginSuccess={handleAdminLoginSuccess}
      />

      {/* Reset Feedback & Start New Batch Modal */}
      <ResetModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        activeSessionId={activeSessionId}
        onResetComplete={handleResetComplete}
      />
    </div>
  );
}
