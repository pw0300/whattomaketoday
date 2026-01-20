import { adminDb } from '../lib/firebase-admin';

async function verifyAdminAccess() {
    console.log('Verifying Firebase Admin Access...');
    try {
        const testDocRef = adminDb.collection('_verification').doc('test-doc');

        // Write
        await testDocRef.set({
            timestamp: new Date().toISOString(),
            verified: true,
            message: 'Service Account works!'
        });
        console.log('✅ Write successful.');

        // Read
        const docSnap = await testDocRef.get();
        if (docSnap.exists) {
            console.log('✅ Read successful:', docSnap.data());
        } else {
            console.error('❌ Read failed: Document not found.');
        }

        // Clean up
        await testDocRef.delete();
        console.log('✅ Delete successful.');

        console.log('🎉 Firebase Admin SDK is correctly configured!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    }
}

verifyAdminAccess();
