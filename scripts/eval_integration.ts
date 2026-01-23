
import * as dotenv from 'dotenv';
dotenv.config();

// We need these types eagerly, but services must be lazy loaded
import { UserProfile, Allergen, HealthCondition } from '../types';

// Mock User Profile
const TEST_USER_ID = 'integration_test_user_v1';
const TEST_PROFILE: UserProfile = {
    uid: TEST_USER_ID,
    name: 'Integration Tester',
    dietaryPreference: 'Vegetarian',
    allergens: [Allergen.Nuts],
    conditions: [HealthCondition.Hypertension],
    cuisines: ['Mediterranean'],
    cuisineNotes: 'Love olive oil and fresh veggies',
    dislikedDishes: [],
    likedDishes: [],
    isOnboarded: true,
    dailyTargets: { protein: 50, carbs: 200, fat: 60, calories: 2000 }
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function runPipelineEval() {
    console.log("🚀 Starting Full Pipeline Integration Eval...");
    console.log("---------------------------------------------");

    // Dynamic imports to ensure env is loaded first
    // This prevents lib/firebase.ts from crashing due to missing env vars
    console.log("📦 Loading services...");
    const { generateNewDishes } = await import('../services/geminiService');
    const { pineconeService } = await import('../services/pineconeService');
    const { db } = await import('../services/firebaseService');

    // Check Services
    if (!process.env.GEMINI_API_KEY && !process.env.VITE_GEMINI_API_KEY) {
        console.error("❌ Missing GEMINI_API_KEY");
        process.exit(1);
    }
    if (!process.env.PINECONE_API_KEY) {
        console.error("❌ Missing PINECONE_API_KEY");
        process.exit(1);
    }

    console.log("✅ Env Checks Passed");
    console.log(`[Pinecone] Available: ${pineconeService.isAvailable()}`);

    // Test 1: Cold Start (Force Generation)
    console.log("\n--- Test 1: Cold Start Generation (No Semantic Cache) ---");
    const startCold = Date.now();
    // Using a new User ID or context ensures no exact cache hit, 
    // but semantic cache might hit if we run this multiple times.
    // To ensure "Cold" for latency test, we can trust that 'Explorer' mode 
    // with these specific constraints might generate fresh content if not found.
    const dishesCold = await generateNewDishes(2, TEST_PROFILE, 'Explorer', TEST_USER_ID);
    const latencyCold = Date.now() - startCold;

    console.log(`⏱️  Cold Latency: ${latencyCold}ms`);
    console.log(`   Generated: ${dishesCold.map(d => d.name).join(', ')}`);
    console.log(`   Quality Check: ${dishesCold.length}/2 valid dishes returned.`);

    if (dishesCold.length === 0) {
        console.error("❌ Cold start generation failed to return dishes. Aborting.");
        process.exit(1);
    }

    // Upsert happens in background in generateNewDishes. 
    // We need to wait a bit for Pinecone to index before checking retrieval.
    console.log("\n⏳ Waiting 10s for Vector Indexing...");
    await wait(10000);

    // Test 2: Semantic Cache Hit
    // Requesting with same profile should theoretically trigger a semantically similar search.
    // The previous generation upserted dishes with metadata matching this profile.
    console.log("\n--- Test 2: Semantic Cache Hit (Vector Retrieval) ---");
    const startCache = Date.now();
    const dishesCached = await generateNewDishes(2, TEST_PROFILE, 'Explorer', TEST_USER_ID);
    const latencyCache = Date.now() - startCache;

    console.log(`⏱️  Cache Latency: ${latencyCache}ms`);
    console.log(`   Generated: ${dishesCached.map(d => d.name).join(', ')}`);

    // Analysis
    // Note: Latency might still be impacted by overhead, but should be faster.
    const speedup = (latencyCold / (latencyCache || 1)).toFixed(1);
    console.log(`\nResults Analysis:`);
    console.log(`1. Cold Start: ${latencyCold}ms`);
    console.log(`2. Cached Rep: ${latencyCache}ms`);
    console.log(`🚀 Speedup Factor: ${speedup}x`);

    if (latencyCache < 1200) { // Slightly looser threshold for Integration test overhead
        console.log("✅ SUCCESS: Cache latency indicates significant speedup.");
    } else {
        console.log("⚠️  WARNING: Cache latency high. Check logs for Vector Cache Hit messages.");
    }

    // Verification of Vector DB Content
    console.log("\n--- Test 3: Direct Vector Search Verification ---");
    try {
        // Search using keywords from the profile
        const results = await pineconeService.search("Vegetarian Mediterranean nuts hypertension", "dishes", 5);
        console.log(`Found ${results.length} matches in Pinecone for profile keywords.`);
        results.forEach(r => {
            console.log(`   - [${r.score?.toFixed(2)}] ${r.metadata?.name}`);
        });
        if (results.length > 0) console.log("✅ Vector DB is populated.");
        else console.error("❌ Vector DB search returned empty.");
    } catch (e) {
        console.error("❌ Vector Search Failed", e);
    }

    process.exit(0);
}

runPipelineEval();
