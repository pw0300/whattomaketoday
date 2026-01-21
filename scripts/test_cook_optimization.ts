
import { knowledgeGraph } from '../services/knowledgeGraphService';
import { Allergen } from '../types.ts';

async function testContext() {
    console.log("--- Testing Knowledge Graph Context Optimization ---");

    // Case 1: No constraints
    console.log("\n1. Normal User (No constraints):");
    const ctx1 = knowledgeGraph.getRelevantSafetyContext([], []);
    console.log("Context Length:", ctx1.length);
    console.log("Content:", ctx1);

    // Case 2: Dairy Allergy
    console.log("\n2. Dairy Allergic User:");
    const ctx2 = knowledgeGraph.getRelevantSafetyContext(['Dairy'], []);
    console.log("Context Length:", ctx2.length);
    console.log("Content:", ctx2);

    // Case 3: Diabetes
    console.log("\n3. Diabetic User:");
    const ctx3 = knowledgeGraph.getRelevantSafetyContext([], ['Diabetes']);
    console.log("Context Length:", ctx3.length);
    console.log("Content Scan (contains 'Rice'?):", ctx3.includes('Rice') || ctx3.includes('rice'));

    // Verify massive size difference
    // Full JSON is usually ~500KB. These contexts should be < 1KB.
    console.log("\n--- Efficiency Check ---");
    if (ctx2.length < 2000) {
        console.log("✅ Optimization SUCCESS: Context is lightweight.");
    } else {
        console.warn("⚠️ Optimization WARNING: Context is still large.");
    }
}

testContext();
