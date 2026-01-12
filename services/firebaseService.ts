
import { initializeApp } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged as firebaseOnAuthStateChanged,
    User
} from "firebase/auth";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    onSnapshot
} from "firebase/firestore";
import { AppState } from '../types';

/**
 * Production Firebase Configuration
 * Integrated from project: whattoeat-91e87
 */
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
// Initialize Firebase (Safe Guard)
let app, auth: any, db: any, provider: any;
try {
    if (!firebaseConfig.apiKey) throw new Error("Missing API Key");
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    provider = new GoogleAuthProvider();
} catch (e) {
    console.warn("Firebase not initialized (Offline Mode):", e);
    // Mock Auth for UI safety
    auth = {
        currentUser: null,
        signOut: async () => { },
        onAuthStateChanged: () => () => { } // returns unsubscribe
    };
    db = null;
}

export { auth, db };

/**
 * IDENTITY & AUTH
 * Handles Google OAuth flow and session management.
 */
export const signInWithGoogle = async () => {
    if (!app) {
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
    if (!app) return () => { };
    return firebaseOnAuthStateChanged(auth, callback);
};

/**
 * DATA PERSISTENCE (FIRESTORE)
 * Synchronizes the entire AppState to the cloud.
 */
export const syncStateToCloud = async (uid: string, state: AppState): Promise<void> => {
    if (!uid) return;
    try {
        const userDocRef = doc(db, "users", uid);
        // We use merge: true to avoid overwriting fields if we only sync partial updates later
        await setDoc(userDocRef, state, { merge: true });
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
