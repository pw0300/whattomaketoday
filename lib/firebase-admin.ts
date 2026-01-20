import { initializeApp, getApps, cert, ServiceAccount, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as path from 'path';

// Get service account path from environment or use default for local dev
const getServiceAccountPath = (): string | null => {
    // Priority: GOOGLE_APPLICATION_CREDENTIALS > SERVICE_ACCOUNT_PATH > local fallback
    const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.SERVICE_ACCOUNT_PATH;
    if (envPath && fs.existsSync(envPath)) {
        return envPath;
    }

    // Fallback for local development (check common locations)
    const localPath = path.resolve(process.cwd(), 'service-account.json');
    if (fs.existsSync(localPath)) {
        console.warn('[Firebase Admin] Using local service-account.json. Set GOOGLE_APPLICATION_CREDENTIALS in production.');
        return localPath;
    }

    return null;
};

let adminApp: App | null = null;
let adminDb: Firestore | null = null;
let adminAuth: Auth | null = null;

const serviceAccountPath = getServiceAccountPath();

if (serviceAccountPath) {
    try {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

        const params = {
            credential: cert(serviceAccount as ServiceAccount),
            projectId: serviceAccount.project_id,
        };

        // Singleton initialization
        adminApp = getApps().length > 0 ? getApps()[0] : initializeApp(params);
        adminDb = getFirestore(adminApp);
        adminAuth = getAuth(adminApp);
    } catch (error) {
        console.error('[Firebase Admin] Failed to initialize:', error);
    }
} else {
    console.warn('[Firebase Admin] No service account found. Admin SDK features disabled.');
}

export { adminApp, adminDb, adminAuth };
