import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, Check, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { resetFeedbacks } from '../services/firebase';
import { clearLocalSubmissionRecords } from '../utils/device';

export default function ResetModal({
  isOpen,
  onClose,
  activeSessionId,
  onResetComplete,
}) {
  const [mode, setMode] = useState('new_session'); // 'new_session' | 'wipe'
  const [batchName, setBatchName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleExecuteReset = async () => {
    if (mode === 'new_session' && !batchName.trim()) {
      setError('Please enter a name for the new batch (e.g., Batch 2026 - Section A).');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const result = await resetFeedbacks({
        mode,
        currentSessionId: activeSessionId,
        batchName: batchName.trim(),
      });

      // Clear local submission locks so this device and others can test again
      clearLocalSubmissionRecords();

      onResetComplete(result.newSessionId || activeSessionId);
      setBatchName('');
      onClose();
    } catch (err) {
      console.error('Failed to reset feedback:', err);
      setError('An error occurred while resetting feedback. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)' }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
        <div className="modal-content rounded-4 border-0 shadow-lg p-3">
          <div className="modal-header border-0 pb-0">
            <div className="d-flex align-items-center gap-2">
              <div
                className="d-flex align-items-center justify-content-center bg-warning-subtle text-warning-emphasis rounded-circle"
                style={{ width: '40px', height: '40px' }}
              >
                <RotateCcw size={20} />
              </div>
              <h5 className="modal-title fw-bold mb-0">Reset Feedback</h5>
            </div>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onClose}
              disabled={isProcessing}
            ></button>
          </div>

          <div className="modal-body py-3">
            <p className="text-secondary small mb-3">
              Choose how you would like to reset the feedback portal for multiple use:
            </p>

            {error && (
              <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3">
                {error}
              </div>
            )}

            {/* Option 1: New Session */}
            <div
              className={`p-3 rounded-3 border mb-3 transition ${
                mode === 'new_session'
                  ? 'border-primary bg-primary-subtle'
                  : 'border-light-subtle bg-light'
              }`}
            >
              <div
                className="form-check d-flex align-items-start gap-2 ps-0 cursor-pointer"
                style={{ cursor: 'pointer' }}
                onClick={() => setMode('new_session')}
              >
                <input
                  className="form-check-input mt-1 ms-0"
                  type="radio"
                  name="resetOption"
                  id="optNewSession"
                  checked={mode === 'new_session'}
                  onChange={() => setMode('new_session')}
                />
                <label className="form-check-label w-100" htmlFor="optNewSession" style={{ cursor: 'pointer' }}>
                  <div className="d-flex align-items-center gap-1">
                    <span className="fw-bold text-dark">Start New Batch / Session</span>
                    <span className="badge bg-success-subtle text-success border border-success-subtle small ms-auto">
                      Recommended
                    </span>
                  </div>
                  <div className="text-muted small mt-1">
                    Unlocks all student devices to submit fresh feedback immediately. Past responses are stored under this new batch name.
                  </div>
                </label>
              </div>

              {/* Batch Name Input */}
              {mode === 'new_session' && (
                <div className="mt-3 pt-3 border-top border-primary-subtle">
                  <label className="form-label small fw-bold text-dark mb-1">
                    Enter New Batch Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control rounded-3 py-2"
                    placeholder="e.g. Batch 2026 - CS A, Morning Class, etc."
                    value={batchName}
                    autoFocus
                    onChange={(e) => {
                      setBatchName(e.target.value);
                      setError('');
                    }}
                  />
                  <div className="form-text small text-muted">
                    Students will submit under this batch, and you can filter reports by this name.
                  </div>
                </div>
              )}
            </div>

            {/* Option 2: Wipe Current */}
            <div
              className={`p-3 rounded-3 border cursor-pointer transition ${
                mode === 'wipe'
                  ? 'border-danger bg-danger-subtle'
                  : 'border-light-subtle bg-light'
              }`}
              style={{ cursor: 'pointer' }}
              onClick={() => setMode('wipe')}
            >
              <div className="form-check d-flex align-items-start gap-2 ps-0">
                <input
                  className="form-check-input mt-1 ms-0"
                  type="radio"
                  name="resetOption"
                  id="optWipe"
                  checked={mode === 'wipe'}
                  onChange={() => setMode('wipe')}
                />
                <label className="form-check-label w-100" htmlFor="optWipe" style={{ cursor: 'pointer' }}>
                  <div className="d-flex align-items-center gap-1">
                    <span className="fw-bold text-danger">Permanently Delete Current Feedback</span>
                  </div>
                  <div className="text-muted small mt-1">
                    Wipes all reviews and ratings in the current batch. All student devices can submit fresh reviews.
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="modal-footer border-0 pt-0">
            <button
              type="button"
              className="btn btn-light rounded-pill px-3"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`btn rounded-pill px-4 d-inline-flex align-items-center gap-2 ${
                mode === 'wipe' ? 'btn-danger' : 'btn-primary'
              }`}
              onClick={handleExecuteReset}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <RotateCcw size={16} />
                  <span>{mode === 'wipe' ? 'Confirm Wipe' : 'Start Fresh Session'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
