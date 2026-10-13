import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Shield,
  LayoutDashboard,
  GraduationCap
} from 'lucide-react';
import StudentFeedback from './components/StudentFeedback';
import AdminDashboard from './components/AdminDashboard';
import AdminLoginModal from './components/AdminLoginModal';
import ResetModal from './components/ResetModal';
import {
  subscribeToFeedbacks,
  getActiveSessionId,
  isFirebaseLive,
  subscribeToActiveSession
} from './services/firebase';

export default function App() {
  const [currentView, setCurrentView] = useState('student'); // 'student' | 'admin'
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const [activeSessionId, setActiveSessionId] = useState('session-1');
  const [adminSessionScope, setAdminSessionScope] = useState('CURRENT'); // 'CURRENT' | 'ALL'
  const [feedbacks, setFeedbacks] = useState([]);
  const [isLive, setIsLive] = useState(false);

  // Subscribe to active session in real-time
  useEffect(() => {
    setIsLive(isFirebaseLive());

    const unsubscribe = subscribeToActiveSession((sessionId) => {
      setActiveSessionId(sessionId);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Subscribe to feedbacks in real-time
  useEffect(() => {
    if (!activeSessionId) return;

    const targetSession = (currentView === 'admin' && adminSessionScope === 'ALL')
      ? 'ALL'
      : activeSessionId;

    const unsubscribe = subscribeToFeedbacks(targetSession, (items) => {
      setFeedbacks(items);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [activeSessionId, currentView, adminSessionScope]);

  // Handle Admin view click
  const handleAdminClick = () => {
    if (isAdminAuthenticated) {
      setCurrentView('admin');
    } else {
      setShowAdminLoginModal(true);
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setShowAdminLoginModal(false);
    setCurrentView('admin');
  };

  const handleResetComplete = (newSessionId) => {
    setActiveSessionId(newSessionId);
  };

  return (
    <div className="app-viewport">
      {/* Top Application Header */}
      <header className="app-header">
        <div className="container d-flex flex-wrap align-items-center justify-content-between gap-2">
          {/* Brand */}
          <div
            className="d-flex align-items-center gap-2 cursor-pointer"
            onClick={() => setCurrentView('student')}
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

          {/* Navigation Pills (Student vs Admin) */}
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className={`nav-pill-btn ${currentView === 'student' ? 'active' : ''}`}
              onClick={() => setCurrentView('student')}
            >
              <MessageSquare size={16} />
              <span>Student View</span>
            </button>

            <button
              type="button"
              className={`nav-pill-btn ${currentView === 'admin' ? 'active' : ''}`}
              onClick={handleAdminClick}
            >
              <LayoutDashboard size={16} />
              <span>Admin Dashboard</span>
              {!isAdminAuthenticated && (
                <Shield size={13} className="text-muted ms-1" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow-1 d-flex flex-column justify-content-center px-3 py-4">
        {currentView === 'student' ? (
          <StudentFeedback
            activeSessionId={activeSessionId}
            onSwitchToAdmin={handleAdminClick}
          />
        ) : (
          <AdminDashboard
            feedbacks={feedbacks}
            activeSessionId={activeSessionId}
            onOpenResetModal={() => setShowResetModal(true)}
            isFirebaseActive={isLive}
            adminSessionScope={adminSessionScope}
            setAdminSessionScope={setAdminSessionScope}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-3 text-center text-muted small position-relative z-1">
        <div className="container">
          <div className="d-flex flex-wrap justify-content-center align-items-center gap-3">
            <span>🔒 100% Anonymous (No user data collected)</span>
            <span>•</span>
            <span>📱 One response per device enforced</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />

      <ResetModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        activeSessionId={activeSessionId}
        onResetComplete={handleResetComplete}
      />
    </div>
  );
}
