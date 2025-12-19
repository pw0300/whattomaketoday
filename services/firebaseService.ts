
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
  apiKey: "AIzaSyDCjpuA6Fsi1oHQqdOpwgwqnfzFPBn6VD4",
  authDomain: "whattoeat-91e87.firebaseapp.com",
  projectId: "whattoeat-91e87",
  storageBucket: "whattoeat-91e87.firebasestorage.app",
  messagingSenderId: "123491617008",
  appId: "1:123491617008:web:dbfdab6a470202cbea5a35",
  measurementId: "G-CL7K4RB8TN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const provider = new GoogleAuthProvider();

/**
 * IDENTITY & AUTH
 * Handles Google OAuth flow and session management.
 */
export const signInWithGoogle = async () => {
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

export const logout = () => auth.signOut();

export const onAuthStateChanged = (callback: (user: User | null) => void) => {
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
