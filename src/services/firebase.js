import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  doc,
  setDoc,
  writeBatch,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';

// Check if Firebase environment variables are provided
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const isConfigValid = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'YOUR_FIREBASE_API_KEY'
);

let db = null;
let firebaseApp = null;

if (isConfigValid) {
  try {
    firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp);
    console.log('🔥 Connected to Firebase Firestore (100% Free Spark Tier)!');
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
  }
} else {
  console.info('ℹ️ Running in Mock Database Mode. Add Firebase keys in .env to connect to live Cloud Firestore.');
}

export function isFirebaseLive() {
  return Boolean(db);
}

// -------------------------------------------------------------
// MOCK DATABASE FALLBACK (Ensures instant out-of-the-box demo)
// -------------------------------------------------------------
const MOCK_STORAGE_KEY = 'feedback_webapp_mock_data_v1';
const MOCK_SESSION_KEY = 'feedback_webapp_active_session_id';

const INITIAL_MOCK_REVIEWS = [
  {
    id: 'mock-1',
    sessionId: 'session-1',
    deviceId: 'dev_mock_1',
    rating: 5,
    reviewText: 'The lecture was exceptionally clear! The live examples helped me understand the concepts thoroughly.',
    authorTag: 'Anonymous Student #1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    timestamp: Date.now() - 1000 * 60 * 60 * 2
  },
  {
    id: 'mock-2',
    sessionId: 'session-1',
    deviceId: 'dev_mock_2',
    rating: 5,
    reviewText: 'Very engaging presentation and pace was perfect. Thank you for taking questions patiently!',
    authorTag: 'Anonymous Student #2',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    timestamp: Date.now() - 1000 * 60 * 60 * 5
  },
  {
    id: 'mock-3',
    sessionId: 'session-1',
    deviceId: 'dev_mock_3',
    rating: 4,
    reviewText: 'Great session overall. Would love a few more practical assignments next time.',
    authorTag: 'Anonymous Student #3',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    timestamp: Date.now() - 1000 * 60 * 60 * 12
  },
  {
    id: 'mock-4',
    sessionId: 'session-1',
    deviceId: 'dev_mock_4',
    rating: 5,
    reviewText: 'Clear, concise, and straight to the point. Best class of the semester!',
    authorTag: 'Anonymous Student #4',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    timestamp: Date.now() - 1000 * 60 * 60 * 24
  },
  {
    id: 'mock-5',
    sessionId: 'session-1',
    deviceId: 'dev_mock_5',
    rating: 5,
    reviewText: 'The slides and explanations were well structured and easy to follow.',
    authorTag: 'Anonymous Student #5',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    timestamp: Date.now() - 1000 * 60 * 60 * 30
  }
];

function getMockData() {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_REVIEWS));
      return INITIAL_MOCK_REVIEWS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MOCK_REVIEWS;
  }
}

function saveMockData(data) {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event('mock_feedback_updated'));
  } catch (e) {
    console.error('Error saving mock data:', e);
  }
}

export function getLocalActiveSessionId() {
  try {
    return localStorage.getItem(MOCK_SESSION_KEY) || 'session-1';
  } catch {
    return 'session-1';
  }
}

export function setLocalActiveSessionId(sessionId) {
  try {
    localStorage.setItem(MOCK_SESSION_KEY, sessionId);
    window.dispatchEvent(new Event('mock_feedback_updated'));
  } catch (e) {
    console.error('Error setting session id:', e);
  }
}

// -------------------------------------------------------------
// CORE SERVICES (Hybrid: Firebase Firestore with Mock Fallback)
// -------------------------------------------------------------

/**
 * Get active session ID.
 */
export async function getActiveSessionId() {
  if (!db) {
    return getLocalActiveSessionId();
  }

  try {
    const sessionDocRef = doc(db, 'system_config', 'active_session');
    const sessionSnap = await getDocs(query(collection(db, 'system_config')));
    const activeDoc = sessionSnap.docs.find((d) => d.id === 'active_session');
    if (activeDoc && activeDoc.exists()) {
      return activeDoc.data().sessionId || 'session-1';
    } else {
      // Initialize active session
      await setDoc(sessionDocRef, {
        sessionId: 'session-1',
        createdAt: serverTimestamp(),
      });
      return 'session-1';
    }
  } catch (err) {
    console.warn('Error fetching Firestore session ID, falling back to local:', err);
    return getLocalActiveSessionId();
  }
}

/**
 * Check if a specific device has already submitted feedback for the active session.
 */
export async function checkDeviceHasSubmitted(deviceId, currentSessionId) {
  if (!deviceId) return { hasSubmitted: false };

  if (!db) {
    const all = getMockData();
    const existing = all.find(
      (item) => item.deviceId === deviceId && item.sessionId === currentSessionId
    );
    return {
      hasSubmitted: Boolean(existing),
      submission: existing || null,
    };
  }

  try {
    const q = query(
      collection(db, 'student_feedbacks'),
      where('deviceId', '==', deviceId),
      where('sessionId', '==', currentSessionId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docData = snap.docs[0].data();
      return {
        hasSubmitted: true,
        submission: { id: snap.docs[0].id, ...docData },
      };
    }
    return { hasSubmitted: false, submission: null };
  } catch (err) {
    console.error('Error checking Firestore device submission:', err);
    // If network or permission error, fallback to checking local storage
    return { hasSubmitted: false };
  }
}

/**
 * Submit feedback (Anonymous).
 */
export async function submitFeedback({ rating, reviewText, deviceId, sessionId }) {
  const cleanReview = (reviewText || '').trim();
  const timestamp = Date.now();
  const formattedDate = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (!db) {
    // Mock save
    const currentList = getMockData();
    const newEntry = {
      id: 'mock-' + Date.now(),
      sessionId: sessionId || getLocalActiveSessionId(),
      deviceId,
      rating: Number(rating),
      reviewText: cleanReview,
      authorTag: `Anonymous Student #${currentList.length + 1}`,
      createdAt: formattedDate,
      timestamp,
    };
    currentList.unshift(newEntry);
    saveMockData(currentList);
    return { success: true, id: newEntry.id };
  }

  try {
    const docRef = await addDoc(collection(db, 'student_feedbacks'), {
      sessionId: sessionId || 'session-1',
      deviceId,
      rating: Number(rating),
      reviewText: cleanReview,
      createdAtFormatted: formattedDate,
      createdAt: serverTimestamp(),
      timestamp,
    });
    return { success: true, id: docRef.id };
  } catch (err) {
    console.error('Error submitting feedback to Firestore:', err);
    throw err;
  }
}

/**
 * Subscribe to feedback list in real-time.
 */
export function subscribeToFeedbacks(activeSessionId, callback) {
  if (!db) {
    const updateHandler = () => {
      const all = getMockData();
      const filtered = activeSessionId
        ? all.filter((item) => item.sessionId === activeSessionId)
        : all;
      callback(filtered);
    };

    updateHandler();
    window.addEventListener('mock_feedback_updated', updateHandler);
    window.addEventListener('storage', updateHandler);

    return () => {
      window.removeEventListener('mock_feedback_updated', updateHandler);
      window.removeEventListener('storage', updateHandler);
    };
  }

  try {
    const feedbacksRef = collection(db, 'student_feedbacks');
    let q = query(feedbacksRef, orderBy('timestamp', 'desc'));

    if (activeSessionId) {
      q = query(feedbacksRef, where('sessionId', '==', activeSessionId), orderBy('timestamp', 'desc'));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = [];
        let index = 1;
        snapshot.forEach((d) => {
          const data = d.data();
          items.push({
            id: d.id,
            authorTag: `Anonymous Student #${index++}`,
            ...data,
            createdAt:
              data.createdAtFormatted ||
              (data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : new Date(data.timestamp || Date.now()).toLocaleString()),
          });
        });
        callback(items);
      },
      (error) => {
        console.error('Firestore subscription error:', error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('Error creating Firestore listener:', err);
    return () => {};
  }
}

/**
 * Reset all feedback.
 * mode: 'new_session' (Increments session ID; fresh start for all devices, preserving historical data)
 * mode: 'wipe' (Permanently deletes active feedbacks from the database)
 */
export async function resetFeedbacks({ mode = 'new_session', currentSessionId }) {
  if (!db) {
    if (mode === 'new_session') {
      const newSessionId = 'session-' + Date.now();
      setLocalActiveSessionId(newSessionId);
      return { success: true, newSessionId };
    } else {
      // Wipe
      saveMockData([]);
      return { success: true };
    }
  }

  try {
    if (mode === 'new_session') {
      const newSessionId = 'session-' + Date.now();
      const sessionDocRef = doc(db, 'system_config', 'active_session');
      await setDoc(sessionDocRef, {
        sessionId: newSessionId,
        updatedAt: serverTimestamp(),
      });
      return { success: true, newSessionId };
    } else {
      // Hard wipe all documents for current session
      const q = query(
        collection(db, 'student_feedbacks'),
        where('sessionId', '==', currentSessionId)
      );
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
      return { success: true };
    }
  } catch (err) {
    console.error('Error resetting feedbacks:', err);
    throw err;
  }
}
