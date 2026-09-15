import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';

/**
 * Log growth events into Firestore analytics/{userId}/events
 * @param {string} userId
 * @param {'first_pdf_generated_at' | 'wellness_submit' | 'csv_import_completed' | 'qr_join_completed'} eventName
 * @param {object} [metadata]
 */
export async function logGrowthEvent(userId, eventName, metadata = {}) {
  if (!userId || !eventName) return;
  try {
    const eventsRef = collection(db, 'analytics', userId, 'events');
    await addDoc(eventsRef, {
      eventName,
      timestamp: serverTimestamp(),
      ...metadata
    });

    if (eventName === 'first_pdf_generated_at') {
      const summaryRef = doc(db, 'analytics', userId);
      await setDoc(summaryRef, { first_pdf_generated_at: serverTimestamp() }, { merge: true });
    }
  } catch (err) {
    console.warn('[GrowthAnalytics] Could not log event:', eventName, err);
  }
}
