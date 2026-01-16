/**
 * Centralized Environment Configuration
 * Validates required environment variables at runtime to fail early if misconfigured.
 */

interface EnvConfig {
    firebase: {
        apiKey: string;
        authDomain: string;
        projectId: string;
        storageBucket: string;
        messagingSenderId: string;
        appId: string;
        measurementId: string;
    };
    gemini: {
        apiKey: string; // Server-side preferred, but falls back to VITE_ for client-only modes if necessary
    };
}

const getReq = (key: string): string => {
    const val = import.meta.env[key];
    if (!val) {
        // We log a warning instead of throwing error immediately to allow 
        // "Offline Mode" or "Mock Mode" to function if designed.
        console.warn(`[Config] Missing environment variable: ${key}`);
        return '';
    }
    return val;
};

// Check for server-side key safety
const getGeminiKey = (): string => {
    // In a Vite client context, we usually only have access to VITE_ keys.
    // But if we are running in a context where VITE_GEMINI_API_KEY is defined, we use it.
    // Note: The actual secure generation happens via the proxy which uses process.env.
    // This config is primarily for Client-side services if they ever needed it (which they shouldn't).

    // However, for the sake of completeness in this config file:
    return import.meta.env.VITE_GEMINI_API_KEY || '';
};

export const env: EnvConfig = {
    firebase: {
        apiKey: getReq('VITE_FIREBASE_API_KEY'),
        authDomain: getReq('VITE_FIREBASE_AUTH_DOMAIN'),
        projectId: getReq('VITE_FIREBASE_PROJECT_ID'),
        storageBucket: getReq('VITE_FIREBASE_STORAGE_BUCKET'),
        messagingSenderId: getReq('VITE_FIREBASE_MESSAGING_SENDER_ID'),
        appId: getReq('VITE_FIREBASE_APP_ID'),
        measurementId: getReq('VITE_FIREBASE_MEASUREMENT_ID'),
    },
    gemini: {
        apiKey: getGeminiKey(),
    }
};

export const validateEnv = (): boolean => {
    const missing = Object.entries(env.firebase).filter(([_, v]) => !v);
    if (missing.length > 0) {
        console.error("Missing Firebase Configuration:", missing.map(([k]) => k).join(', '));
        return false;
    }
    return true;
};
