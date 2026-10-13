import React, { useState } from 'react';
import {
  Star,
  Download,
  RotateCcw,
  MessageSquare,
  Users,
  ShieldCheck,
  Filter,
  CheckCircle2,
  Trash2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { exportFeedbackToExcel } from '../utils/excelExport';

export default function AdminDashboard({
  feedbacks = [],
  activeSessionId,
  onOpenResetModal,
  isFirebaseActive,
  adminSessionScope = 'CURRENT',
  setAdminSessionScope
}) {
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  // Calculate statistics
  const totalReviews = feedbacks.length;
  const totalRatingSum = feedbacks.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0);
  const averageRating = totalReviews > 0 ? (totalRatingSum / totalReviews).toFixed(1) : '0.0';

  // Count per star
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  feedbacks.forEach((f) => {
    const star = Math.round(Number(f.rating) || 0);
    if (counts[star] !== undefined) {
      counts[star]++;
    }
  });

  const getPercentage = (count) => {
    if (totalReviews === 0) return 0;
    return Math.round((count / totalReviews) * 100);
  };

  // Filter feedbacks
  const filteredFeedbacks = feedbacks.filter((item) => {
    if (selectedFilter === 'ALL') return true;
    return Math.round(Number(item.rating)) === Number(selectedFilter);
  });

  // Handle Excel download
  const handleDownloadExcel = () => {
    exportFeedbackToExcel(feedbacks, activeSessionId);
  };

  // Generate color palette for student avatar circles
  const avatarColors = [
    { bg: '#fee2e2', text: '#991b1b' },
    { bg: '#fef3c7', text: '#92400e' },
    { bg: '#dcfce7', text: '#166534' },
    { bg: '#e0e7ff', text: '#3730a3' },
    { bg: '#fae8ff', text: '#86198f' },
    { bg: '#ffedd5', text: '#9a3412' },
  ];

  return (
    <div className="container py-4" style={{ maxWidth: '780px' }}>
      <div className="admin-card animate-pop">
        {/* Top Status & Session Bar */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom gap-2">
          <div className="d-flex flex-wrap align-items-center gap-2">
            <span className="badge-live">
              <span className="badge-live-dot"></span>
              {isFirebaseActive ? 'Live Firebase Sync' : 'Local Sandbox Mode'}
            </span>
            <span className="badge bg-light text-secondary border">
              Batch: {activeSessionId}
            </span>

            {/* Scope Switcher: Current Batch vs All Batches */}
            <div className="btn-group btn-group-sm rounded-pill p-0 bg-light border ms-1">
              <button
                type="button"
                className={`btn btn-sm rounded-pill py-0 px-2 fw-semibold ${
                  adminSessionScope === 'CURRENT'
                    ? 'btn-dark shadow-sm'
                    : 'text-secondary border-0 bg-transparent'
                }`}
                onClick={() => setAdminSessionScope && setAdminSessionScope('CURRENT')}
                style={{ fontSize: '0.75rem', height: '26px' }}
                title="Show only reviews from the active batch"
              >
                Current Batch
              </button>
              <button
                type="button"
                className={`btn btn-sm rounded-pill py-0 px-2 fw-semibold ${
                  adminSessionScope === 'ALL'
                    ? 'btn-dark shadow-sm'
                    : 'text-secondary border-0 bg-transparent'
                }`}
                onClick={() => setAdminSessionScope && setAdminSessionScope('ALL')}
                style={{ fontSize: '0.75rem', height: '26px' }}
                title="Show all reviews from all past sessions"
              >
                All Batches
              </button>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-dark d-inline-flex align-items-center gap-2 rounded-pill px-3 py-1 shadow-sm"
              onClick={handleDownloadExcel}
              title="Download ratings and comments as Excel workbook"
            >
              <Download size={15} />
              <span className="fw-semibold">Export Excel</span>
            </button>

            <button
              type="button"
              className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-2 rounded-pill px-3 py-1 shadow-sm"
              onClick={onOpenResetModal}
              title="Reset reviews for a new batch of students"
            >
              <RotateCcw size={15} />
              <span className="fw-semibold">Reset Reviews</span>
            </button>
          </div>
        </div>

        {/* Image 2 Layout: Overall Rating & Progress Bars */}
        <div className="row align-items-center mb-4 g-3">
          {/* Left: Overall score e.g. 4.9 OUT OF 5 */}
          <div className="col-sm-5 col-12 text-center text-sm-start border-end-sm">
            <div className="d-flex flex-column align-items-center align-items-sm-start">
              <div className="d-flex align-items-baseline gap-2">
                <span className="admin-score-big">{averageRating}</span>
                <span className="admin-score-sub">OUT OF 5</span>
              </div>

              {/* Star visuals & total ratings */}
              <div className="mt-2 text-center text-sm-start">
                <div className="d-flex gap-1 justify-content-center justify-content-sm-start mb-1">
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
                <div className="text-muted small fw-semibold">
                  {totalReviews} {totalReviews === 1 ? 'rating' : 'ratings'}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Breakdown Progress Bars (5, 4, 3, 2, 1 stars) */}
          <div className="col-sm-7 col-12">
            <div className="ps-sm-3">
              {[5, 4, 3, 2, 1].map((starNum) => {
                const count = counts[starNum] || 0;
                const pct = getPercentage(count);
                return (
                  <div key={starNum} className="rating-bar-row">
                    <span className="rating-bar-label">
                      {starNum} <Star size={13} fill="#f59e0b" stroke="#f59e0b" />
                    </span>
                    <div className="rating-bar-track">
                      <div
                        className="rating-bar-fill"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                    <span className="rating-bar-percent">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section Divider & Reviews Count (Matching Image 2) */}
        <div className="d-flex flex-wrap justify-content-between align-items-center pt-3 pb-2 border-top border-bottom mb-3 gap-2">
          <div className="fw-bold text-dark fs-6 d-flex align-items-center gap-2">
            <Users size={18} className="text-secondary" />
            <span>
              {totalReviews} {totalReviews === 1 ? 'Review' : 'Reviews'}
            </span>
          </div>

          {/* Filter Pills */}
          <div className="d-flex align-items-center gap-1 overflow-auto py-1">
            <span className="small text-muted me-1 d-none d-md-inline">Filter:</span>
            {['ALL', '5', '4', '3', '2', '1'].map((val) => (
              <button
                key={val}
                type="button"
                className={`btn btn-sm py-0 px-2 rounded-pill small fw-semibold ${
                  selectedFilter === val
                    ? 'btn-dark'
                    : 'btn-outline-secondary'
                }`}
                style={{ fontSize: '0.75rem', height: '24px' }}
                onClick={() => setSelectedFilter(val)}
              >
                {val === 'ALL' ? 'All' : `${val} ★`}
              </button>
            ))}
          </div>
        </div>

        {/* Review Feed List (Matching Image 2) */}
        <div className="reviews-list">
          {filteredFeedbacks.length === 0 ? (
            <div className="text-center py-5">
              <MessageSquare size={44} className="text-muted mb-2 opacity-50" />
              <h5 className="text-secondary fw-bold">No reviews found</h5>
              <p className="text-muted small mb-0">
                {totalReviews === 0
                  ? 'No students have submitted reviews for this session yet.'
                  : `No reviews found matching ${selectedFilter} stars.`}
              </p>
            </div>
          ) : (
            filteredFeedbacks.map((item, index) => {
              const color = avatarColors[index % avatarColors.length];
              const dateDisplay = item.createdAt || 'Recent';

              return (
                <div key={item.id || index} className="review-item-card">
                  <div className="d-flex gap-3 align-items-start">
                    {/* Anonymous Student Avatar */}
                    <div
                      className="avatar-circle"
                      style={{
                        backgroundColor: color.bg,
                        color: color.text,
                      }}
                    >
                      S{index + 1}
                    </div>

                    {/* Content */}
                    <div className="flex-grow-1">
                      <div className="d-flex flex-wrap justify-content-between align-items-baseline mb-1">
                        <span className="fw-bold text-dark" style={{ fontSize: '0.98rem' }}>
                          {item.authorTag || `Anonymous Student #${index + 1}`}
                        </span>
                        <span className="text-muted small" style={{ fontSize: '0.8rem' }}>
                          <Calendar size={12} className="me-1 inline" />
                          {dateDisplay}
                        </span>
                      </div>

                      {/* Stars Display + Rating text: "4 OUT OF 5" */}
                      <div className="d-flex align-items-center gap-2 mb-1">
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
                        <span
                          className="text-muted fw-bold"
                          style={{ fontSize: '0.78rem', letterSpacing: '0.02em' }}
                        >
                          {item.rating} OUT OF 5
                        </span>
                      </div>

                      {/* Review Comment */}
                      <p className="review-text-content mb-0">
                        {item.reviewText ? (
                          item.reviewText
                        ) : (
                          <span className="text-muted fst-italic">
                            (Rating submitted without comments)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
