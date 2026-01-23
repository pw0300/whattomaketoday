
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Force load env before any other imports
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log("Checking Env:", {
    apiKey: process.env.VITE_FIREBASE_API_KEY ? "EXISTS" : "MISSING",
    projectId: process.env.VITE_FIREBASE_PROJECT_ID
});

async function test() {
    // Dynamic imports to ensure env is loaded first
    const { initializeApp } = await import("firebase/app");
    const { getFirestore, collection, getDocs, limit, query } = await import("firebase/firestore");

    const firebaseConfig = {
        apiKey: process.env.VITE_FIREBASE_API_KEY,
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.VITE_FIREBASE_APP_ID,
        measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
    };

    try {
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        console.log("🔥 Firebase Initialized");

        const q = query(collection(db, "cached_dishes"), limit(5));
        const snapshot = await getDocs(q);

        console.log(`✅ Success! Found ${snapshot.size} documents.`);
        snapshot.forEach(doc => {
            console.log(`- ${doc.id}: ${JSON.stringify(doc.data().name)}`);
        });

    } catch (e) {
        console.error("❌ Firestore Error:", e);
    }
}

test();
