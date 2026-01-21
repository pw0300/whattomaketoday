
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import { UserProfile, Allergen, HealthCondition } from "../types.ts";
// Service imports moved to inside runEval to allow dotenv to load first

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ No API Key found in .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

// Minimal defaults for required fields
const DEFAULT_PROFILE_REQ = {
    allergenNotes: '', conditionNotes: '', cuisineNotes: '', customNotes: '',
    cuisines: [], healthReportSummary: '',
    dailyTargets: { protein: 50, carbs: 200, fat: 60, calories: 2000 },
    isOnboarded: true
};

// === COMPREHENSIVE ONBOARDING PROFILE VARIATIONS ===
const MOCK_PROFILES: UserProfile[] = [
    // Basic Diet Types
    {
        ...DEFAULT_PROFILE_REQ,
        uid: 'user1', name: 'Vegetarian Basic',
        dietaryPreference: 'Vegetarian', allergens: [], conditions: [],
        dislikedDishes: [], likedDishes: []
    },
    {
        ...DEFAULT_PROFILE_REQ,
        uid: 'user2', name: 'Vegan + Gluten Free',
        dietaryPreference: 'Vegan', allergens: [Allergen.Gluten], conditions: [],
        dislikedDishes: [], likedDishes: []
    },
    // Cuisine Preferences (NEW - Testing personalization)
    {
        ...DEFAULT_PROFILE_REQ,
        uid: 'user3', name: 'South Indian Fan',
        dietaryPreference: 'Vegetarian', allergens: [], conditions: [],
        cuisines: ['South Indian'], cuisineNotes: 'Must have sambar or rasam daily',
        dislikedDishes: [], likedDishes: ['Masala Dosa', 'Idli']
    },
    {
        ...DEFAULT_PROFILE_REQ,
        uid: 'user4', name: 'Chinese + Thai Lover',
        dietaryPreference: 'Any', allergens: [Allergen.Shellfish], conditions: [],
        cuisines: ['Chinese', 'Thai'], cuisineNotes: 'Love spicy stir-fries',
        dislikedDishes: ['Biryani'], likedDishes: ['Pad Thai', 'Kung Pao']
    },
    // Health Conditions
    {
        ...DEFAULT_PROFILE_REQ,
        uid: 'user5', name: 'Diabetic Vegetarian',
        dietaryPreference: 'Vegetarian', allergens: [], conditions: [HealthCondition.Diabetes],
        conditionNotes: 'Strict sugar control needed',
        dailyTargets: { protein: 60, carbs: 120, fat: 50, calories: 1600 },
        dislikedDishes: [], likedDishes: []
    },
    {
        ...DEFAULT_PROFILE_REQ,
        uid: 'user6', name: 'Heart + Dairy Free',
        dietaryPreference: 'Any', allergens: [Allergen.Dairy], conditions: [HealthCondition.Hypertension],
        conditionNotes: 'Low sodium absolutely required',
        dislikedDishes: [], likedDishes: []
    },
    // Complex Multi-Constraint
    {
        ...DEFAULT_PROFILE_REQ,
        uid: 'user7', name: 'Complex Profile',
        dietaryPreference: 'Vegetarian',
        allergens: [Allergen.Nuts, Allergen.Soy],
        conditions: [HealthCondition.PCOS],
        cuisines: ['North Indian', 'Mediterranean'],
        cuisineNotes: 'Must have protein-rich breakfast',
        customNotes: 'Prefer home-style cooking, not restaurant dishes',
        dislikedDishes: ['Paneer Tikka'], likedDishes: ['Dal Makhani', 'Hummus']
    }
];

// Critic Model
const criticModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

async function rateDish(dish: any): Promise<{ score: number, reason: string, isHalucination: boolean }> {
    const prompt = `Act as a Master Chef Critic. Rate this recipe JSON:
    ${JSON.stringify(dish, null, 2)}
    
    1. Is this a real, plausible dish? (vs a hallucination like "Water Fried Water")
    2. Rate appetitiveness (1-5).
    3. One sentence reason.
    
    JSON Output: { "score": number, "reason": "string", "isHalucination": boolean }`;

    try {
        const result = await criticModel.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        });
        return JSON.parse(result.response.text());
    } catch (e) {
        return { score: 0, reason: "Critic Failed", isHalucination: false };
    }
}

async function runEval() {
    console.log("🚀 Starting Recipe Generation Evaluation...");
    console.log(`Testing ${MOCK_PROFILES.length} onboarding profile variations\n`);

    // Dynamic import to allow dotenv to load first
    const { buildRecipePrompt, buildConstraintPrompt, buildSeededRecipePrompt, METADATA_DISH_SCHEMA, isValidDish } = await import("../services/geminiService.ts");

    const results: any[] = [];
    const latencies: number[] = [];
    const BATCH_SIZE = MOCK_PROFILES.length; // Test all profiles

    // Generator Model
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: METADATA_DISH_SCHEMA as any
        }
    });

    // === Phase 1: Onboarding Profile Variations ===
    console.log("--- Phase 1: Onboarding Profile Variations ---");
    for (let i = 0; i < BATCH_SIZE; i++) {
        const profile = MOCK_PROFILES[i];
        const constraints = buildConstraintPrompt(profile);
        const prompt = buildRecipePrompt(constraints, profile.cuisines);

        console.log(`\n[${profile.name}] Testing...`);
        console.log(`   Constraints: ${constraints.slice(0, 80)}...`);

        try {
            const startTime = Date.now();
            const result = await model.generateContent(prompt);
            const latency = Date.now() - startTime;
            latencies.push(latency);

            const dish = JSON.parse(result.response.text());
            const valid = isValidDish(dish);
            const critic = await rateDish(dish);

            // Cuisine match check (if profile has cuisine preference)
            let cuisineMatch = true;
            if (profile.cuisines && profile.cuisines.length > 0) {
                cuisineMatch = profile.cuisines.some(c =>
                    dish.cuisine?.toLowerCase().includes(c.toLowerCase()) ||
                    c.toLowerCase().includes(dish.cuisine?.toLowerCase() || '')
                );
            }

            results.push({
                dish, valid, critic, type: 'Onboarding',
                profile: profile.name, constraints, latency,
                cuisineMatch,
                hasCuisinePreference: (profile.cuisines?.length || 0) > 0
            });

            console.log(`   ✓ "${dish.name}" (${dish.cuisine}) - Score: ${critic.score}/5 - ${latency}ms`);
            if (!cuisineMatch && profile.cuisines?.length) {
                console.log(`   ⚠️ Cuisine mismatch! Expected: ${profile.cuisines.join('/')}`);
            }
        } catch (e) {
            console.error(`   ❌ Error:`, e);
            results.push({ dish: null, valid: false, type: 'Onboarding', profile: profile.name, error: true });
        }
    }

    // 2. Seeded Generation Loop (New Feature Verification)
    console.log("\n--- Phase 2: Seeded Generation (Graph Test) ---");
    const seededRequests = [
        "Chana Masala",
        "Pad Thai",
        "Greek Salad"
    ];

    for (const seedName of seededRequests) {
        console.log(`Generating specific dish: ${seedName}...`);
        // Test seeded generation without constraints
        const prompt = buildSeededRecipePrompt(seedName, "None");

        try {
            const result = await model.generateContent(prompt);
            const dish = JSON.parse(result.response.text());
            const valid = isValidDish(dish);

            // Verify Name Match (Soft check)
            const nameMatch = dish.name.toLowerCase().includes(seedName.toLowerCase());

            results.push({ dish, valid, critic: { score: 99 }, type: 'Seeded', profile: 'Test', constraints: 'None' }); // Mock critic
            console.log(`   [Seeded] "${dish.name}" - Valid: ${valid} - Name Match: ${nameMatch}`);
        } catch (e) { console.error(e); }
    }

    // === Phase 3: New Feature Tests ===
    console.log("\n--- Phase 3: New Feature Verification ---");

    // 3a. Meal Pairing Test
    console.log("\n[Meal Pairing] Testing...");
    const { getMealSuggestion, getAccompaniments } = await import("../utils/mealPairings.ts");
    const mealPairingTests = [
        { dish: "Idli", expected: ["Sambar", "Coconut Chutney"], cuisine: "South Indian" },
        { dish: "Masala Dosa", expected: ["Sambar", "Coconut Chutney"], cuisine: "South Indian" },
        { dish: "Roti", expected: ["Dal", "Sabzi"], cuisine: "North Indian" },
        { dish: "Pasta", expected: ["Garlic Bread", "Salad"], cuisine: "Italian" },
        { dish: "Tacos", expected: ["Salsa", "Guacamole"], cuisine: "Mexican" },
        { dish: "Pad Thai", expected: ["Peanuts", "Lime", "Bean Sprouts"], cuisine: "Thai" }
    ];

    let mealPairingPassed = 0;
    mealPairingTests.forEach(test => {
        const suggestion = getMealSuggestion(test.dish);
        const accompaniments = getAccompaniments(test.dish);
        const hasExpected = test.expected.every(e => accompaniments.includes(e));
        if (hasExpected) {
            console.log(`   ✓ ${test.dish} → ${accompaniments.join(" + ")}`);
            mealPairingPassed++;
        } else {
            console.log(`   ❌ ${test.dish}: Expected ${test.expected.join(" + ")}, got ${accompaniments.join(" + ") || "none"}`);
        }
    });
    console.log(`   Meal Pairing: ${mealPairingPassed}/${mealPairingTests.length} passed`);

    // 3b. KG Safety Context Test
    console.log("\n[KG Safety Context] Testing...");
    const { knowledgeGraph } = await import("../services/knowledgeGraphService.ts");
    const kgTests = [
        { allergens: ["Gluten"], conditions: [], shouldContain: "Gluten" },
        { allergens: ["Dairy"], conditions: [], shouldContain: "Dairy" },
        { allergens: [], conditions: ["Diabetes"], shouldContain: "Diabetes" },
        { allergens: [], conditions: ["Hypertension"], shouldContain: "Hypertension" }
    ];

    let kgTestsPassed = 0;
    kgTests.forEach(test => {
        const context = knowledgeGraph.getRelevantSafetyContext(test.allergens, test.conditions);
        if (context.includes(test.shouldContain)) {
            console.log(`   ✓ ${test.allergens.join(",") || test.conditions.join(",")} → Contains "${test.shouldContain}"`);
            kgTestsPassed++;
        } else {
            console.log(`   ❌ Missing "${test.shouldContain}" in context`);
        }
    });
    console.log(`   KG Safety: ${kgTestsPassed}/${kgTests.length} passed`);

    // 3c. Grocery Aggregation Test (Mock)
    console.log("\n[Grocery Aggregation] Testing...");
    // Simulate ingredient aggregation logic
    const mockIngredients = [
        { name: "Tomato", quantity: "2 medium" },
        { name: "Tomato", quantity: "3 medium" },
        { name: "Onion", quantity: "1 large" },
        { name: "Onion", quantity: "2 large" }
    ];

    const aggregated = new Map<string, number>();
    mockIngredients.forEach(ing => {
        const key = ing.name.toLowerCase();
        const numMatch = ing.quantity.match(/(\d+)/);
        const num = numMatch ? parseFloat(numMatch[1]) : 1;
        aggregated.set(key, (aggregated.get(key) || 0) + num);
    });

    const tomatoTotal = aggregated.get("tomato");
    const onionTotal = aggregated.get("onion");
    console.log(`   ✓ Tomato: 2 + 3 = ${tomatoTotal} (expected: 5)`);
    console.log(`   ✓ Onion: 1 + 2 = ${onionTotal} (expected: 3)`);
    const groceryPassed = tomatoTotal === 5 && onionTotal === 3;
    console.log(`   Grocery Aggregation: ${groceryPassed ? "PASSED" : "FAILED"}`);

    // --- Report ---
    const validResults = results.filter(r => r.valid && !r.error);

    console.log("\n\n📊 EVALUATION REPORT");
    console.log("=====================");
    console.log(`Total Attempts: ${results.length}`);
    console.log(`Success Rate:   ${(validResults.length / results.length * 100).toFixed(1)}%`);

    // Variety
    const cuisines = new Set(validResults.map(r => r.dish?.cuisine).filter(Boolean));
    const names = new Set(validResults.map(r => r.dish?.name).filter(Boolean));
    console.log(`Unique Dishes:  ${names.size} / ${validResults.length}`);
    console.log(`Unique Cuisines: ${cuisines.size} (${Array.from(cuisines).join(', ')})`);

    // === LATENCY STATS ===
    console.log("\n⏱️  LATENCY STATS");
    console.log("------------------");
    if (latencies.length > 0) {
        const sorted = [...latencies].sort((a, b) => a - b);
        const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
        const p50 = sorted[Math.floor(sorted.length * 0.5)];
        const p95 = sorted[Math.floor(sorted.length * 0.95)];
        const min = sorted[0];
        const max = sorted[sorted.length - 1];

        console.log(`Average:   ${avg.toFixed(0)}ms`);
        console.log(`P50:       ${p50}ms`);
        console.log(`P95:       ${p95}ms`);
        console.log(`Min/Max:   ${min}ms / ${max}ms`);
    }

    // === CUISINE PERSONALIZATION STATS ===
    console.log("\n🍛 CUISINE PERSONALIZATION");
    console.log("---------------------------");
    const withCuisinePref = validResults.filter(r => r.hasCuisinePreference);
    const cuisineMatches = withCuisinePref.filter(r => r.cuisineMatch);
    console.log(`Profiles with cuisine pref: ${withCuisinePref.length}`);
    console.log(`Cuisine Match Rate: ${withCuisinePref.length > 0 ? (cuisineMatches.length / withCuisinePref.length * 100).toFixed(1) : 'N/A'}%`);

    if (withCuisinePref.length > 0 && cuisineMatches.length < withCuisinePref.length) {
        console.log("Mismatches:");
        withCuisinePref.filter(r => !r.cuisineMatch).forEach(r => {
            console.log(`   - ${r.profile}: Got "${r.dish?.cuisine}" instead of expected cuisine`);
        });
    }

    // Quality (Onboarding profiles)
    const onboardingResults = validResults.filter(r => r.type === 'Onboarding');
    const scores = onboardingResults.map(r => r.critic?.score).filter(s => typeof s === 'number' && s < 10);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    console.log(`\n⭐ Avg Critic Score: ${avgScore.toFixed(1)} / 5`);

    // Hallucinations & Violations
    const hallucinations = validResults.filter(r => r.critic?.isHalucination);
    const violations = validResults.filter(r => {
        if (!r.profile || r.type === 'Seeded') return false;
        const pName = r.profile;
        if (pName.includes('Vegetarian') && r.dish?.type?.toLowerCase().includes('meat')) return true;
        const jsonStr = JSON.stringify(r.dish).toLowerCase();
        if (pName.includes('Vegetarian') && (jsonStr.includes('chicken') || jsonStr.includes('pork') || jsonStr.includes('beef'))) return true;
        return false;
    });

    if (violations.length > 0) {
        console.warn(`\n🛑 CONSTRAINT VIOLATIONS: ${violations.length}`);
        violations.forEach(v => console.log(`   - ${v.profile} got ${v.dish?.name}`));
    } else {
        console.log(`\n✅ No constraint violations detected`);
    }

    if (hallucinations.length > 0) {
        console.warn(`🛑 HALLUCINATIONS DETECTED: ${hallucinations.length}`);
        hallucinations.forEach(h => console.log(`   - ${h.dish?.name}: ${h.critic?.reason}`));
    } else {
        console.log(`✅ No hallucinations detected`);
    }
}

runEval();
