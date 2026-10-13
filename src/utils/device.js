// Anonymous persistent device identifier utility
// Complies with zero personal data collection policy

const DEVICE_KEY = 'student_feedback_device_token_v1';

export function getAnonymousDeviceId() {
  try {
    let deviceId = localStorage.getItem(DEVICE_KEY);
    if (!deviceId) {
      // Generate a collision-resistant unique anonymous token
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        deviceId = 'dev_' + crypto.randomUUID();
      } else {
        deviceId = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
      }
      localStorage.setItem(DEVICE_KEY, deviceId);
    }
    return deviceId;
  } catch (err) {
    console.warn('LocalStorage not available, falling back to session-based token', err);
    // Fallback if browser is in extreme incognito mode blocking local storage
    if (!window.__fallbackDeviceId) {
      window.__fallbackDeviceId = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
    }
    return window.__fallbackDeviceId;
  }
}

export function hasDeviceSubmittedLocally(sessionId) {
  try {
    const record = localStorage.getItem(`submitted_session_${sessionId}`);
    return record ? JSON.parse(record) : null;
  } catch {
    return null;
  }
}

export function markDeviceSubmittedLocally(sessionId, submissionData) {
  try {
    localStorage.setItem(`submitted_session_${sessionId}`, JSON.stringify(submissionData));
  } catch (err) {
    console.warn('Could not store local submission record:', err);
  }
}

export function clearLocalSubmissionRecords() {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('submitted_session_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    console.warn('Could not clear local submission records:', err);
  }
}
