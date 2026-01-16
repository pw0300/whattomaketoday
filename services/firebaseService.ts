
import {
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged as firebaseOnAuthStateChanged,
    User
} from "firebase/auth";
import {
    doc,
    setDoc,
    getDoc,
    onSnapshot
} from "firebase/firestore";
import { AppState } from '../types';

// Import Firebase instances from centralized lib
import { auth, db } from '../lib/firebase';

// Google Auth Provider
const provider = new GoogleAuthProvider();

export { auth, db };

/**
 * IDENTITY & AUTH
 * Handles Google OAuth flow and session management.
 */
export const signInWithGoogle = async () => {
    if (!auth) {
        alert("Authentication unavailable: Missing Configuration");
        throw new Error("Missing Config");
    }
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        return {
            uid: user.uid,
            name: user.displayName || 'Home Chef',
            photo: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`
        };
    } catch (error) {
        console.error("Firebase Auth Error:", error);
        throw error;
    }
};

export const logout = () => auth?.signOut();

export const onAuthStateChanged = (callback: (user: User | null) => void) => {
    if (!auth) return () => { };
    return firebaseOnAuthStateChanged(auth, callback);
};

import { sanitizeForFirestore } from '../utils/firestoreUtils';

/**
 * DATA PERSISTENCE (FIRESTORE)
 * Synchronizes the entire AppState to the cloud.
 */
export const syncStateToCloud = async (uid: string, state: AppState): Promise<void> => {
    if (!uid) return;
    try {
        const userDocRef = doc(db, "users", uid);
        // Sanitize data before sending to Firestore to remove 'undefined' values
        const cleanState = sanitizeForFirestore(state);

        // We use merge: true to avoid overwriting fields if we only sync partial updates later
        await setDoc(userDocRef, cleanState, { merge: true });
        console.debug(`[Cloud Sync] State persisted for UID: ${uid}`);
    } catch (error) {
        console.error("Firestore Sync Error:", error);
    }
};

export const fetchCloudState = async (uid: string): Promise<AppState | null> => {
    if (!uid) return null;
    try {
        const userDocRef = doc(db, "users", uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            return docSnap.data() as AppState;
        }
        return null;
    } catch (error) {
        console.error("Firestore Fetch Error:", error);
        return null;
    }
};

/**
 * RECONCILIATION
 * Merges local guest swipes into the cloud profile upon successful authentication.
 */
export const reconcileGuestToUser = (guestState: AppState, cloudState: AppState | null): AppState => {
    if (!cloudState) return guestState;

    // Combine swiped dishes, removing duplicates by ID
    const mergedApproved = [...cloudState.approvedDishes];
    guestState.approvedDishes.forEach(guestDish => {
        if (!mergedApproved.find(d => d.id === guestDish.id)) {
            mergedApproved.push(guestDish);
        }
    });

    return {
        profile: cloudState.profile || guestState.profile,
        approvedDishes: mergedApproved,
        weeklyPlan: cloudState.weeklyPlan && cloudState.weeklyPlan.length > 0
            ? cloudState.weeklyPlan
            : guestState.weeklyPlan,
        pantryStock: [...new Set([...(cloudState.pantryStock || []), ...(guestState.pantryStock || [])])]
    };
};
