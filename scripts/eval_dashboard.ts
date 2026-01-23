/**
 * eval_dashboard.ts
 * System Evaluation for Updated Dashboard Features
 * 
 * Tests:
 * 1. Credit Farming Prevention (12-hour cooldown)
 * 2. Pantry Logic (Add/Deduct/Migrate)
 * 3. Health Scoring Heuristics
 * 4. Starter Recipe Logic
 */

import * as dotenv from "dotenv";
dotenv.config();

// ============================================================
// TYPES (Mocking production types)
// ============================================================

interface PantryItem {
    id: string;
    name: string;
    quantityType: 'binary' | 'weight' | 'count';
    quantityLevel: number;
    category: string;
    addedAt: number;
}

interface MockDish {
    id: string;
    name: string;
    lastCooked?: number;
}

interface MockUserProfile {
    credits: number;
}

const COOLDOWN = 12 * 60 * 60 * 1000; // 12 Hours in ms

// ============================================================
// LOGIC TO TEST (Simulating Production Logic)
// ============================================================

/**
 * Simulates the onCook handler logic from Dashboard.tsx
 */
function simulateCookHandler(
    dish: MockDish,
    userProfile: MockUserProfile
): { creditsAwarded: boolean; newCredits: number; blocked: boolean; reason?: string } {
    const now = Date.now();
    const timeSinceLastCook = now - (dish.lastCooked || 0);

    if (timeSinceLastCook > COOLDOWN) {
        return {
            creditsAwarded: true,
            newCredits: (userProfile.credits || 0) + 3,
            blocked: false
        };
    } else {
        const remainingMinutes = Math.ceil((COOLDOWN - timeSinceLastCook) / (60 * 1000));
        return {
            creditsAwarded: false,
            newCredits: userProfile.credits || 0,
            blocked: true,
            reason: `Cooldown active. ${remainingMinutes} minutes remaining.`
        };
    }
}

/**
 * Simulates pantryService.ts logic
 */
const pantryService = {
    addPantryItem: (currentStock: PantryItem[], partialItem: Partial<PantryItem> & { name: string }): PantryItem[] => {
        const existingIndex = currentStock.findIndex(i => i.name.toLowerCase() === partialItem.name.toLowerCase());
        if (existingIndex >= 0) {
            const updatedStock = [...currentStock];
            updatedStock[existingIndex] = {
                ...updatedStock[existingIndex],
                quantityLevel: partialItem.quantityLevel || 3,
                addedAt: Date.now(),
                ...partialItem,
                id: updatedStock[existingIndex].id
            };
            return updatedStock;
        } else {
            const newItem: PantryItem = {
                id: `mock-id-${Date.now()}`,
                quantityType: 'binary',
                quantityLevel: 1,
                category: 'Uncategorized',
                addedAt: Date.now(),
                ...partialItem
            };
            return [...currentStock, newItem];
        }
    },
    deductPantryItem: (currentStock: PantryItem[], itemId: string): PantryItem[] => {
        return currentStock.filter(i => i.id !== itemId);
    }
};

// ============================================================
// TEST RUNNER
// ============================================================

interface TestResult {
    name: string;
    passed: boolean;
    details?: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => boolean | string): void {
    try {
        const result = fn();
        if (result === true) {
            results.push({ name, passed: true });
            console.log(`   ✓ ${name}`);
        } else {
            results.push({ name, passed: false, details: typeof result === 'string' ? result : 'Assertion failed' });
            console.log(`   ❌ ${name}: ${result}`);
        }
    } catch (e: any) {
        results.push({ name, passed: false, details: e.message });
        console.log(`   ❌ ${name}: ${e.message}`);
    }
}

// ============================================================
// RUN TESTS
// ============================================================

async function runEval() {
    console.log("\n🚀 Starting Dashboard System Evaluation (Production Sim)...\n");

    // --- Phase 1: Pantry Logic ---
    console.log("--- Phase 1: Pantry Management Logic ---");

    test("Add new item to pantry", () => {
        const stock: PantryItem[] = [];
        const newStock = pantryService.addPantryItem(stock, { name: "Tomatoes" });
        return newStock.length === 1 && newStock[0].name === "Tomatoes";
    });

    test("Add existing item updates timestamp/quantity", () => {
        const stock: PantryItem[] = [{
            id: '1', name: "Onions", quantityType: 'binary', quantityLevel: 1, category: 'Veg', addedAt: 100
        }];
        const newStock = pantryService.addPantryItem(stock, { name: "Onions", quantityLevel: 3 });
        return newStock.length === 1 && newStock[0].quantityLevel === 3 && newStock[0].addedAt > 100;
    });

    test("Deduct item removes it from stock", () => {
        const stock: PantryItem[] = [
            { id: '1', name: "Onions", quantityType: 'binary', quantityLevel: 1, category: 'Veg', addedAt: 100 },
            { id: '2', name: "Potatoes", quantityType: 'binary', quantityLevel: 1, category: 'Veg', addedAt: 100 }
        ];
        const newStock = pantryService.deductPantryItem(stock, '1');
        return newStock.length === 1 && newStock[0].name === "Potatoes";
    });


    // --- Phase 2: Credit Farming Tests ---
    console.log("\n--- Phase 2: Credit Farming Prevention ---");

    const profile: MockUserProfile = { credits: 10 };

    // Test 1: Fresh dish (never cooked) - Should award credits
    test("Fresh dish awards credits", () => {
        const dish: MockDish = { id: "1", name: "Dal Tadka" }; // No lastCooked
        const result = simulateCookHandler(dish, profile);
        return result.creditsAwarded === true && result.newCredits === 13;
    });

    // Test 2: Dish cooked 24 hours ago - Should award credits
    test("Dish cooked 24h ago awards credits", () => {
        const dish: MockDish = {
            id: "2",
            name: "Paneer Tikka",
            lastCooked: Date.now() - (24 * 60 * 60 * 1000) // 24 hours ago
        };
        const result = simulateCookHandler(dish, profile);
        return result.creditsAwarded === true && result.newCredits === 13;
    });

    // Test 3: Dish cooked 1 hour ago - Should BLOCK credits
    test("Dish cooked 1h ago blocks credits", () => {
        const dish: MockDish = {
            id: "3",
            name: "Chole",
            lastCooked: Date.now() - (1 * 60 * 60 * 1000) // 1 hour ago
        };
        const result = simulateCookHandler(dish, profile);
        return result.blocked === true && result.newCredits === 10;
    });

    // Test 4: Exact 12-hour boundary - Should award (just past cooldown)
    test("Exactly 12h boundary awards credits", () => {
        const dish: MockDish = {
            id: "4",
            name: "Rajma",
            lastCooked: Date.now() - COOLDOWN - 1 // 1ms past cooldown
        };
        const result = simulateCookHandler(dish, profile);
        return result.creditsAwarded === true;
    });

    // Test 5: Just under 12-hour boundary - Should block
    test("Just under 12h boundary blocks credits", () => {
        const dish: MockDish = {
            id: "5",
            name: "Aloo Gobi",
            lastCooked: Date.now() - COOLDOWN + (60 * 1000) // 1 min inside cooldown
        };
        const result = simulateCookHandler(dish, profile);
        return result.blocked === true;
    });


    // --- Phase 3: Starter Recipe Loading (Logic Check) ---
    console.log("\n--- Phase 3: Starter Recipe Filter Logic ---");

    // Import filterStarterRecipes
    const { filterStarterRecipes } = await import("../data/starterRecipes.ts");

    test("Vegetarian filter excludes Non-Veg", () => {
        const filtered = filterStarterRecipes({
            dietaryPreference: 'Vegetarian',
            allergens: [],
            cuisines: []
        });
        const hasNonVeg = filtered.some(d => d.tags?.includes('Non-Veg'));
        return hasNonVeg === false;
    });

    test("Vegan filter excludes Dairy", () => {
        const filtered = filterStarterRecipes({
            dietaryPreference: 'Vegan',
            allergens: [],
            cuisines: []
        });
        const hasDairy = filtered.some(d => d.allergens?.includes('Dairy' as any));
        return hasDairy === false;
    });

    // --- Phase 4: Health Score Verification ---
    console.log("\n--- Phase 4: Health Score Heuristic ---");

    const { calculateHealthScore } = await import("../utils/healthScoring.ts");

    test("High-protein low-cal dish scores > 80", () => {
        const dish = {
            macros: { calories: 400, protein: 30, carbs: 20, fat: 10 },
            healthTags: ['High-Protein', 'Low-Carb']
        };
        const score = calculateHealthScore(dish as any);
        return score >= 80 ? true : `Got ${score}, expected >= 80`;
    });

    // ============================================================
    // REPORT
    // ============================================================

    console.log("\n\n📊 EVALUATION REPORT");
    console.log("=====================");

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const total = results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`Passed:      ${passed} ✓`);
    console.log(`Failed:      ${failed} ❌`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
        console.log("\n❌ FAILED TESTS:");
        results.filter(r => !r.passed).forEach(r => {
            console.log(`   - ${r.name}: ${r.details || 'No details'}`);
        });
    }

    console.log("\n✅ Evaluation Complete.");

    // Exit with error code if failures
    if (failed > 0) {
        process.exit(1);
    }
}

runEval().catch(e => {
    console.error("Evaluation crashed:", e);
    process.exit(1);
});
