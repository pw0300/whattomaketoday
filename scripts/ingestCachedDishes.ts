
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup Env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const INDEX_NAME = "tadkasync-main";

// --- Helpers ---
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

async function generateEmbedding(text: string): Promise<number[] | null> {
    if (!genAI) return null;
    try {
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await model.embedContent(text);
        return result.embedding.values;
    } catch (e) {
        console.error("Embedding Error:", e);
        return null; // Handle retry or skip
    }
}

async function ingest() {
    console.log("🚀 Starting Cached Dishes Ingestion...");

    // 1. Init Firebase (Local Client SDK)
    const { initializeApp } = await import("firebase/app");
    const { getFirestore, collection, getDocs, query, limit } = await import("firebase/firestore");

    const firebaseConfig = {
        apiKey: process.env.VITE_FIREBASE_API_KEY,
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.VITE_FIREBASE_APP_ID,
        measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
    };

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log("🔥 Firebase Connected");

    // 2. Init Pinecone
    const pineconeApiKey = process.env.PINECONE_API_KEY;
    if (!pineconeApiKey) throw new Error("Missing PINECONE_API_KEY");

    const pc = new Pinecone({ apiKey: pineconeApiKey });
    const index = pc.index(INDEX_NAME);

    // 3. Fetch All Dishes
    // Note: If collection is huge, use pagination (cursors). For now assumes < 5k docs.
    const snapshot = await getDocs(collection(db, "cached_dishes"));
    const dishes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    console.log(`📦 Loaded ${dishes.length} dishes from Firestore.`);

    const records = [];
    const BATCH_SIZE = 20;

    // 4. Process & Queue
    for (let i = 0; i < dishes.length; i += BATCH_SIZE) {
        const batch = dishes.slice(i, i + BATCH_SIZE);
        const vectors = [];

        console.log(`...Processing batch ${Math.floor(i / BATCH_SIZE) + 1}`);

        await Promise.all(batch.map(async (dish) => {
            // Construct rich text representation
            const text = `Dish: ${dish.name}. Cuisine: ${dish.cuisine}. Description: ${dish.description}. Tags: ${dish.tags?.join(', ')}. Health: ${dish.healthTags?.join(', ')}.`;

            // Simple metadata flattening
            const metadata: any = {
                type: 'dish',
                name: dish.name,
                cuisine: dish.cuisine,
                isStaple: !!dish.isStaple,
                text: text // Store text for RAG context
            };

            // Add array fields if present
            if (dish.tags) metadata.tags = dish.tags;
            if (dish.healthTags) metadata.healthTags = dish.healthTags;

            const values = await generateEmbedding(text);
            if (values) {
                vectors.push({ id: dish.id, values, metadata });
            }
        }));

        // 5. Upsert Batch
        if (vectors.length > 0) {
            console.log(`   -> Upserting ${vectors.length} vectors...`);
            await index.namespace("dishes").upsert(vectors as any);
        }

        // Rate limit guard
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log("✅ Ingestion Complete!");
}

ingest().catch(e => console.error("❌ Fatal Error:", e));
