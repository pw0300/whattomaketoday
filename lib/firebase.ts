/**
 * Centralized Firebase configuration and initialization
 * This module provides a clean abstraction over Firebase services
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { env, validateEnv } from '../config/env';

// Validate environment before initialization
if (!validateEnv()) {
    console.error('[lib/firebase] Missing required environment variables');
}

const firebaseConfig = {
    apiKey: env.firebase.apiKey,
    authDomain: env.firebase.authDomain,
    projectId: env.firebase.projectId,
    storageBucket: env.firebase.storageBucket,
    messagingSenderId: env.firebase.messagingSenderId,
    appId: env.firebase.appId
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (error) {
    console.error('[lib/firebase] Initialization failed:', error);
    throw error;
}

export { app, auth, db };
