import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Star, CheckCircle, AlertCircle, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { getAnonymousDeviceId, hasDeviceSubmittedLocally, markDeviceSubmittedLocally } from '../utils/device';
import { submitFeedback, checkDeviceHasSubmitted } from '../services/firebase';

export default function StudentFeedback({ activeSessionId, onSwitchToAdmin }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingDevice, setIsCheckingDevice] = useState(true);
  const [hasAlreadySubmitted, setHasAlreadySubmitted] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState(null);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const deviceId = getAnonymousDeviceId();

  // Check if this device has already submitted for the current session
  useEffect(() => {
    let isMounted = true;

    async function verifyDeviceStatus() {
      setIsCheckingDevice(true);
      setErrorMessage('');

      // Fast check in local storage first
      const localRecord = hasDeviceSubmittedLocally(activeSessionId);
      if (localRecord) {
        if (isMounted) {
          setHasAlreadySubmitted(true);
          setExistingSubmission(localRecord);
          setIsCheckingDevice(false);
        }
        return;
      }

      // Check database
      try {
        const result = await checkDeviceHasSubmitted(deviceId, activeSessionId);
        if (isMounted) {
          if (result.hasSubmitted) {
            setHasAlreadySubmitted(true);
            setExistingSubmission(result.submission);
            markDeviceSubmittedLocally(activeSessionId, result.submission);
          } else {
            setHasAlreadySubmitted(false);
            setExistingSubmission(null);
          }
        }
      } catch (err) {
        console.error('Error verifying device submission:', err);
      } finally {
        if (isMounted) setIsCheckingDevice(false);
      }
    }

    if (activeSessionId) {
      verifyDeviceStatus();
    }
  }, [activeSessionId, deviceId]);

  // Handle Confetti Burst
  const triggerConfetti = () => {
    try {
      const count = 200;
      const defaults = { origin: { y: 0.7 } };

      function fire(particleRatio, opts) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      }

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    } catch (e) {
      console.log('Confetti effect triggered', e);
    }
  };

  // Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setErrorMessage('Please select a star rating between 1 and 5 stars.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const submissionData = {
        rating,
        reviewText: reviewText.trim(),
        deviceId,
        sessionId: activeSessionId,
      };

      await submitFeedback(submissionData);

      // Record device locally so subsequent refreshes immediately lock
      markDeviceSubmittedLocally(activeSessionId, {
        rating,
        reviewText: reviewText.trim(),
        createdAt: new Date().toLocaleTimeString(),
      });

      setJustSubmitted(true);
      triggerConfetti();
    } catch (err) {
      console.error('Submission failed:', err);
      setErrorMessage('Failed to submit feedback. Please check your network and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // State: Loading device check
  if (isCheckingDevice) {
    return (
      <div className="feedback-card-wrapper my-auto py-5">
        <div className="feedback-card text-center py-5 animate-pop">
          <Loader2 className="animate-spin text-primary mx-auto mb-3" size={38} />
          <p className="text-muted fw-semibold mb-0">Verifying session status...</p>
        </div>
      </div>
    );
  }

  // State: Just submitted successfully
  if (justSubmitted) {
    return (
      <div className="feedback-card-wrapper my-auto py-4">
        <div className="feedback-card text-center py-5 animate-pop">
          <div
            className="d-inline-flex align-items-center justify-content-center mb-4"
            style={{
              width: '84px',
              height: '84px',
              background: '#ecfdf5',
              borderRadius: '50%',
              border: '2px solid #a7f3d0',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)',
            }}
          >
            <CheckCircle size={48} className="text-success" />
          </div>

          <h2 className="feedback-card-title mb-2">Thank you!</h2>
          <p className="feedback-card-subtitle mb-4">
            Your anonymous feedback has been recorded successfully. We truly appreciate you taking the time to share your experience!
          </p>

          <div className="d-flex justify-content-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={26}
                className={s <= rating ? 'star-thankyou-icon filled' : 'star-thankyou-icon empty'}
              />
            ))}
          </div>

          {reviewText && (
            <div
              className="p-3 mx-2 rounded-3 text-start mb-4"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
            >
              <div className="text-muted small fw-bold mb-1">Your comments:</div>
              <p className="mb-0 text-secondary fst-italic">"{reviewText}"</p>
            </div>
          )}

          <div className="text-muted small">
            🔒 Submitted anonymously • No personal data saved
          </div>
        </div>
      </div>
    );
  }

  // State: Already submitted from this device
  if (hasAlreadySubmitted) {
    return (
      <div className="feedback-card-wrapper my-auto py-4">
        <div className="feedback-card text-center py-5 animate-pop">
          <div
            className="d-inline-flex align-items-center justify-content-center mb-4"
            style={{
              width: '80px',
              height: '80px',
              background: '#eff6ff',
              borderRadius: '50%',
              border: '2px solid #bfdbfe',
              boxShadow: '0 8px 24px rgba(59, 130, 246, 0.15)',
            }}
          >
            <Sparkles size={40} className="text-primary" />
          </div>

          <h2 className="feedback-card-title mb-2">Feedback Already Received</h2>
          <p className="feedback-card-subtitle mb-4">
            You have already submitted feedback for this session from this device. Multiple responses from the same device are restricted to keep ratings fair and accurate.
          </p>

          {existingSubmission && (
            <div
              className="p-3 mx-auto rounded-4 text-start mb-4 w-100"
              style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', maxWidth: '380px' }}
            >
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                <span className="badge bg-secondary text-white px-2.5 py-1.5 fw-semibold" style={{ fontSize: '0.78rem' }}>
                  Your Submission
                </span>
                <div className="d-flex align-items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={18}
                      className={`star-mini-icon ${s <= (existingSubmission.rating || 5) ? 'filled' : 'empty'}`}
                    />
                  ))}
                </div>
              </div>
              {existingSubmission.reviewText ? (
                <p className="mb-0 text-dark small fst-italic px-1 pt-1 border-top border-light-subtle">
                  "{existingSubmission.reviewText}"
                </p>
              ) : (
                <p className="mb-0 text-muted small fst-italic px-1">
                  (Rating submitted without written comment)
                </p>
              )}
            </div>
          )}

          <div className="text-muted small">
            If a new class or session begins, the administrator can reset the session to allow new responses.
          </div>
        </div>
      </div>
    );
  }

  // State: Default Feedback Card (Matching Image 1)
  return (
    <div className="feedback-card-wrapper my-auto py-3">
      <div className="feedback-card animate-pop">
        {/* Header */}
        <h1 className="feedback-card-title">Rate your experience</h1>
        <p className="feedback-card-subtitle">
          We highly value your feedback! Kindly take a moment to rate your experience and provide us with your valuable feedback.
        </p>

        {errorMessage && (
          <div className="alert alert-danger py-2 px-3 small rounded-3 d-flex align-items-center gap-2 mb-3">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 5-Star Rating Row (Image 1) */}
        <div className="star-rating-row" role="radiogroup" aria-label="Star Rating">
          {[1, 2, 3, 4, 5].map((starValue) => {
            const isFilled = (hoverRating || rating) >= starValue;
            return (
              <button
                key={starValue}
                type="button"
                className="star-btn"
                onMouseEnter={() => setHoverRating(starValue)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(starValue)}
                aria-label={`${starValue} Star`}
              >
                <Star
                  className={`star-icon ${isFilled ? 'filled' : 'empty'}`}
                />
              </button>
            );
          })}
        </div>

        {/* Recessed Inset Textarea (Image 1) */}
        <div className="textarea-container">
          <textarea
            className="feedback-textarea"
            rows="4"
            maxLength={600}
            placeholder="Tell us about your experience!"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
          ></textarea>
        </div>

        {/* Send Button (Image 1) */}
        <div className="text-center">
          <button
            type="button"
            className="btn-send"
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <span>Send</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
