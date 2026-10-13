import React, { useState } from 'react';
import { Lock, User, ShieldAlert, ArrowRight } from 'lucide-react';

// Hardcoded Admin Credentials
const ADMIN_USERNAME = 'desingh';
const ADMIN_PASSWORD = 'md123456';

export default function AdminLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleVerify = (e) => {
    e.preventDefault();
    if (
      username.trim().toLowerCase() === ADMIN_USERNAME.toLowerCase() &&
      password === ADMIN_PASSWORD
    ) {
      setError('');
      setUsername('');
      setPassword('');
      onLoginSuccess();
    } else {
      setError('Invalid username or password. Please try again.');
    }
  };

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)' }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '420px' }}>
        <div className="modal-content rounded-4 border-0 shadow-lg p-3">
          <div className="modal-header border-0 pb-0">
            <div className="d-flex align-items-center gap-2">
              <div
                className="d-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-circle"
                style={{ width: '40px', height: '40px' }}
              >
                <Lock size={20} />
              </div>
              <h5 className="modal-title fw-bold mb-0">Admin Authentication</h5>
            </div>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onClose}
            ></button>
          </div>

          <form onSubmit={handleVerify}>
            <div className="modal-body py-3">
              <p className="text-muted small mb-3">
                Please enter your administrator username and password to access rating analytics, Excel export, and session reset.
              </p>

              {error && (
                <div className="alert alert-danger py-2 px-3 small rounded-3 d-flex align-items-center gap-2 mb-3">
                  <ShieldAlert size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary mb-1">
                  Username
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    className="form-control rounded-end-3 py-2 border-start-0"
                    placeholder="Enter admin username"
                    autoFocus
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError('');
                    }}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary mb-1">
                  Password
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    className="form-control rounded-end-3 py-2 border-start-0"
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer border-0 pt-0">
              <button
                type="button"
                className="btn btn-light rounded-pill px-3"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-dark rounded-pill px-4 d-inline-flex align-items-center gap-2"
              >
                <span>Access Dashboard</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
