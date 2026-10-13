import * as XLSX from 'xlsx';

/**
 * Exports feedback list to a clean, professionally formatted Excel workbook (.xlsx).
 */
export function exportFeedbackToExcel(feedbacks, currentSessionId = 'All') {
  if (!feedbacks || feedbacks.length === 0) {
    alert('No feedback data available to export yet!');
    return false;
  }

  // Calculate statistics
  const total = feedbacks.length;
  const sumRating = feedbacks.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0);
  const avgRating = (sumRating / total).toFixed(2);

  const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  feedbacks.forEach((f) => {
    const r = Math.round(Number(f.rating));
    if (starCounts[r] !== undefined) starCounts[r]++;
  });

  // Sheet 1: Detailed Student Feedback
  const feedbackData = feedbacks.map((item, idx) => ({
    'Sl. No': idx + 1,
    'Submission ID': item.id || `FB-${idx + 1}`,
    'Rating (Out of 5)': `${item.rating} ★`,
    'Student Review': item.reviewText || '(No comments provided)',
    'Date & Time': item.createdAt || new Date(item.timestamp || Date.now()).toLocaleString(),
    'Session Batch': item.sessionId || currentSessionId,
  }));

  const worksheetDetails = XLSX.utils.json_to_sheet(feedbackData);

  // Set column widths for nice readability
  worksheetDetails['!cols'] = [
    { wch: 8 },  // Sl. No
    { wch: 22 }, // Submission ID
    { wch: 18 }, // Rating
    { wch: 45 }, // Student Review
    { wch: 24 }, // Date & Time
    { wch: 16 }, // Session
  ];

  // Sheet 2: Executive Summary
  const summaryData = [
    { 'Metric': 'Feedback Session', 'Value': currentSessionId },
    { 'Metric': 'Export Date', 'Value': new Date().toLocaleString() },
    { 'Metric': 'Total Reviews Received', 'Value': total },
    { 'Metric': 'Overall Average Rating', 'Value': `${avgRating} / 5.0` },
    { 'Metric': '5-Star Reviews (Excellent)', 'Value': `${starCounts[5]} (${((starCounts[5] / total) * 100).toFixed(1)}%)` },
    { 'Metric': '4-Star Reviews (Good)', 'Value': `${starCounts[4]} (${((starCounts[4] / total) * 100).toFixed(1)}%)` },
    { 'Metric': '3-Star Reviews (Average)', 'Value': `${starCounts[3]} (${((starCounts[3] / total) * 100).toFixed(1)}%)` },
    { 'Metric': '2-Star Reviews (Poor)', 'Value': `${starCounts[2]} (${((starCounts[2] / total) * 100).toFixed(1)}%)` },
    { 'Metric': '1-Star Reviews (Terrible)', 'Value': `${starCounts[1]} (${((starCounts[1] / total) * 100).toFixed(1)}%)` },
  ];

  const worksheetSummary = XLSX.utils.json_to_sheet(summaryData);
  worksheetSummary['!cols'] = [
    { wch: 30 },
    { wch: 30 },
  ];

  // Create Workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheetSummary, 'Executive Summary');
  XLSX.utils.book_append_sheet(workbook, worksheetDetails, 'Student Feedback List');

  // Trigger file download
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `Student_Feedback_Report_${dateStr}.xlsx`;
  XLSX.writeFile(workbook, filename);

  return true;
}
