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
        defaultModel: string; // Default Gemini model to use
    };
    pinecone: {
        apiKey: string;
        indexHost: string;
    };
}

const getReq = (key: string): string => {
    let val: string | undefined;

    // Try Node.js process.env first (for scripts/SSR)
    if (typeof process !== 'undefined' && process.env) {
        val = process.env[key];
    }

    // Fallback to Vite import.meta.env (for Client)
    if (!val && typeof import.meta !== 'undefined' && import.meta.env) {
        val = import.meta.env[key];
    }

    if (!val) {
        // We log a warning instead of throwing error immediately to allow 
        // "Offline Mode" or "Mock Mode" to function if designed.
        // console.warn(`[Config] Missing environment variable: ${key}`);
        return '';
    }
    return val;
};

// Get env variable with fallback default
const getEnvWithDefault = (key: string, defaultValue: string): string => {
    const val = getReq(key);
    return val || defaultValue;
};

// Check for server-side key safety
const getGeminiKey = (): string => {
    let key: string | undefined;

    // ONLY allow access via process.env (Server-Side / Function Context)
    // We STRICTLY disable client-side bundling of this key.
    if (typeof process !== 'undefined' && process.env) {
        key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    }

    // Explicitly REMOVED: import.meta.env check
    // This prevents Vite from statically replacing this variable and leaking it in the build.

    return key || '';
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
        defaultModel: getEnvWithDefault('GEMINI_MODEL', 'gemini-2.0-flash'),
    },
    pinecone: {
        apiKey: getEnvWithDefault('PINECONE_API_KEY', ''),
        indexHost: getEnvWithDefault('PINECONE_INDEX_HOST', ''),
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
