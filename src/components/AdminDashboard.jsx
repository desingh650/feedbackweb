import React, { useState, useMemo } from 'react';
import {
  Star,
  Download,
  RotateCcw,
  ArrowLeft,
  MessageSquare,
  Calendar,
  Layers,
  Filter,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { exportFeedbackToExcel } from '../utils/excelExport';

export default function AdminDashboard({
  feedbacks = [],
  activeSessionId,
  onOpenResetModal,
  isFirebaseActive,
  onNavigateHome
}) {
  const [selectedBatch, setSelectedBatch] = useState('ALL');
  const [selectedRating, setSelectedRating] = useState('ALL');

  // Extract all distinct batches from the feedback data & current active session
  const availableBatches = useMemo(() => {
    const set = new Set();
    if (activeSessionId) set.add(activeSessionId);
    feedbacks.forEach((f) => {
      const b = f.batchName || f.sessionId;
      if (b) set.add(b);
    });
    return Array.from(set);
  }, [feedbacks, activeSessionId]);

  // Apply both filters: batch and star rating
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((item) => {
      const itemBatch = item.batchName || item.sessionId;
      const matchesBatch =
        selectedBatch === 'ALL' || itemBatch === selectedBatch;

      const itemRating = Math.round(Number(item.rating) || 0);
      const matchesRating =
        selectedRating === 'ALL' || itemRating === Number(selectedRating);

      return matchesBatch && matchesRating;
    });
  }, [feedbacks, selectedBatch, selectedRating]);

  // Overall Statistics for the selected batch scope (or all)
  const batchScopedFeedbacks = useMemo(() => {
    if (selectedBatch === 'ALL') return feedbacks;
    return feedbacks.filter((f) => (f.batchName || f.sessionId) === selectedBatch);
  }, [feedbacks, selectedBatch]);

  const totalReviews = batchScopedFeedbacks.length;
  const totalRatingSum = batchScopedFeedbacks.reduce(
    (acc, curr) => acc + (Number(curr.rating) || 0),
    0
  );
  const averageRating =
    totalReviews > 0 ? (totalRatingSum / totalReviews).toFixed(1) : '0.0';

  // Count per star
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  batchScopedFeedbacks.forEach((f) => {
    const star = Math.round(Number(f.rating) || 0);
    if (counts[star] !== undefined) counts[star]++;
  });

  const getPercentage = (count) => {
    if (totalReviews === 0) return 0;
    return Math.round((count / totalReviews) * 100);
  };

  // Handle Excel download: EXPORTS ONLY FILTERED FEEDBACKS!
  const handleDownloadExcel = () => {
    if (filteredFeedbacks.length === 0) {
      alert('No feedbacks match your current filter to export.');
      return;
    }
    const filterContext = `${selectedBatch}_${selectedRating}stars`;
    exportFeedbackToExcel(filteredFeedbacks, filterContext);
  };

  return (
    <div className="container py-4" style={{ maxWidth: '1040px' }}>
      {/* 2-Column Responsive Layout Matching Image 2 */}
      <div className="row g-4 align-items-start">
        {/* ========================================================= */}
        {/* LEFT CARD: Reviews and ratings summary & breakdown (Image 2) */}
        {/* ========================================================= */}
        <div className="col-12 col-lg-5">
          <div className="admin-card p-4 h-100 shadow-sm border rounded-4 animate-pop">
            {/* Top row with Back button and status badge */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <button
                type="button"
                className="btn btn-sm btn-light rounded-circle p-2 d-inline-flex align-items-center justify-content-center border shadow-xs"
                style={{ width: '36px', height: '36px' }}
                onClick={onNavigateHome}
                title="Go to Student Feedback page"
              >
                <ArrowLeft size={17} className="text-secondary" />
              </button>

              <span className="badge-live">
                <span className="badge-live-dot"></span>
                {isFirebaseActive ? 'Live Sync' : 'Sandbox'}
              </span>
            </div>

            {/* Title (Matching Image 2) */}
            <h2 className="fw-bold text-dark mb-3" style={{ fontSize: '1.65rem', letterSpacing: '-0.02em' }}>
              Reviews and ratings
            </h2>

            {/* Big Score (Matching Image 2 e.g. 4,7 with stars & count) */}
            <div className="d-flex align-items-baseline gap-3 mb-2">
              <span className="admin-score-big text-dark fw-bold" style={{ fontSize: '3.6rem', lineHeight: '1' }}>
                {averageRating}
              </span>
              <div>
                <div className="d-flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={20}
                      className={
                        s <= Math.round(Number(averageRating))
                          ? 'star-icon filled'
                          : 'star-icon empty'
                      }
                    />
                  ))}
                </div>
                <div className="text-muted small fw-medium">
                  Based on {totalReviews} {totalReviews === 1 ? 'rating' : 'ratings'}
                </div>
              </div>
            </div>

            {/* Active Batch Indicator */}
            <div className="p-2 px-3 rounded-3 bg-light border mb-4 d-flex align-items-center justify-content-between">
              <span className="small text-muted fw-semibold">Current Active Batch:</span>
              <span className="badge bg-primary text-white fw-bold px-2 py-1">
                {activeSessionId || 'Batch-1'}
              </span>
            </div>

            {/* Ratings Breakdown Progress Bars (Matching Image 2) */}
            <div className="mb-4">
              {[5, 4, 3, 2, 1].map((starNum) => {
                const count = counts[starNum] || 0;
                const pct = getPercentage(count);
                return (
                  <div key={starNum} className="d-flex align-items-center gap-2 mb-2">
                    <span className="small fw-semibold text-secondary d-flex align-items-center gap-1" style={{ width: '65px' }}>
                      {starNum} <Star size={13} fill="#f59e0b" stroke="#f59e0b" />
                    </span>
                    <div className="flex-grow-1 bg-light rounded-pill overflow-hidden border" style={{ height: '7px' }}>
                      <div
                        className="rounded-pill transition-all"
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          backgroundColor: '#0f172a',
                          transition: 'width 0.4s ease',
                        }}
                      ></div>
                    </div>
                    <span className="small text-muted fw-bold text-end" style={{ width: '38px' }}>
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons: Export & Reset */}
            <div className="d-flex flex-column gap-2 pt-3 border-top">
              <button
                type="button"
                className="btn btn-dark w-100 rounded-pill py-2 d-inline-flex align-items-center justify-content-center gap-2 shadow-sm fw-semibold"
                onClick={handleDownloadExcel}
              >
                <Download size={16} />
                <span>Export Filtered to Excel ({filteredFeedbacks.length})</span>
              </button>

              <button
                type="button"
                className="btn btn-outline-danger w-100 rounded-pill py-2 d-inline-flex align-items-center justify-content-center gap-2 fw-semibold"
                onClick={onOpenResetModal}
              >
                <RotateCcw size={16} />
                <span>Start New Batch / Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT CARD: Reviews Feed & Filters (Image 2) */}
        {/* ========================================================= */}
        <div className="col-12 col-lg-7">
          <div className="admin-card p-4 shadow-sm border rounded-4 animate-pop">
            {/* Header: Reviews Count & Filters (Matching Image 2) */}
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3 pb-3 border-bottom">
              <h3 className="fw-bold text-dark mb-0 fs-5 d-flex align-items-center gap-2">
                <span>Reviews</span>
                <span className="badge bg-light text-dark border rounded-pill px-2.5">
                  {filteredFeedbacks.length}
                </span>
              </h3>

              {/* Filters matching Image 2 dropdown style */}
              <div className="d-flex flex-wrap align-items-center gap-2">
                {/* Batch Filter Dropdown */}
                <select
                  className="form-select form-select-sm rounded-pill fw-semibold bg-light border-secondary-subtle"
                  style={{ width: 'auto', minWidth: '130px', fontSize: '0.8rem' }}
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  aria-label="Filter by Batch"
                >
                  <option value="ALL">All Batches</option>
                  {availableBatches.map((batch) => (
                    <option key={batch} value={batch}>
                      {batch === activeSessionId ? `★ ${batch} (Active)` : batch}
                    </option>
                  ))}
                </select>

                {/* Rating Filter Dropdown */}
                <select
                  className="form-select form-select-sm rounded-pill fw-semibold bg-light border-secondary-subtle"
                  style={{ width: 'auto', minWidth: '115px', fontSize: '0.8rem' }}
                  value={selectedRating}
                  onChange={(e) => setSelectedRating(e.target.value)}
                  aria-label="Filter by Rating"
                >
                  <option value="ALL">All ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>
            </div>

            {/* Reviews List Feed */}
            <div className="reviews-list-scrollable" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {filteredFeedbacks.length === 0 ? (
                <div className="text-center py-5">
                  <MessageSquare size={42} className="text-muted mb-2 opacity-50" />
                  <h6 className="text-dark fw-bold mb-1">No reviews match your filter</h6>
                  <p className="text-muted small mb-0">
                    Try changing the batch or star rating filter above.
                  </p>
                </div>
              ) : (
                filteredFeedbacks.map((item, index) => {
                  const dateDisplay = item.createdAt || 'Recent';
                  const itemBatch = item.batchName || item.sessionId || 'Batch-1';

                  return (
                    <div
                      key={item.id || index}
                      className="p-3 mb-3 rounded-3 border bg-light-subtle transition-all"
                      style={{ background: '#fcfdfe' }}
                    >
                      {/* Review Top Row: Name, Batch Badge, Date */}
                      <div className="d-flex justify-content-between align-items-center mb-1 flex-wrap gap-1">
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-bold text-dark small">
                            {item.authorTag || `Anonymous Student #${index + 1}`}
                          </span>
                          <span className="badge bg-secondary-subtle text-secondary border small" style={{ fontSize: '0.72rem' }}>
                            {itemBatch}
                          </span>
                        </div>
                        <span className="text-muted small" style={{ fontSize: '0.78rem' }}>
                          <Calendar size={12} className="inline me-1" />
                          {dateDisplay}
                        </span>
                      </div>

                      {/* Stars */}
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <div className="d-flex gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={14}
                              className={
                                s <= item.rating
                                  ? 'star-icon filled'
                                  : 'star-icon empty'
                              }
                            />
                          ))}
                        </div>
                        <span className="small text-muted fw-bold">
                          {item.rating} / 5
                        </span>
                      </div>

                      {/* Review Text */}
                      <p className="mb-0 text-dark small" style={{ lineHeight: '1.5' }}>
                        {item.reviewText ? (
                          item.reviewText
                        ) : (
                          <span className="text-muted fst-italic">
                            (Rating submitted without comments)
                          </span>
                        )}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
