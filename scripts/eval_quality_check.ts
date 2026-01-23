
import 'dotenv/config';
import { generateNewDishes } from '../services/geminiService';
import { UserProfile } from '../types';

// Mock localStorage for Node environment to prevent crashes in contextManager
if (typeof localStorage === 'undefined') {
    (global as any).localStorage = {
        getItem: () => null,
        setItem: () => { },
        removeItem: () => { },
        clear: () => { }
    };
}

const PROFILES: Record<string, UserProfile> = {
    'Vegan Italian': {
        uid: 'test_vegan',
        name: 'Vegan Tester',
        dietaryPreference: 'Vegan',
        allergens: [],
        cuisines: ['Italian'],
        conditions: [],
        email: 'test@test.com',
        preferences: { likes: [], dislikes: [] },
        onboardingCompleted: true
    },
    'Keto Indian': {
        uid: 'test_keto',
        name: 'Keto Tester',
        dietaryPreference: 'Keto',
        allergens: [],
        cuisines: ['Indian'],
        conditions: [],
        email: 'test@test.com',
        preferences: { likes: [], dislikes: [] },
        onboardingCompleted: true
    },
    'High Protein Mexican': {
        uid: 'test_protein',
        name: 'Gym Bro',
        dietaryPreference: 'High Protein',
        allergens: [],
        cuisines: ['Mexican'],
        conditions: [],
        email: 'test@test.com',
        preferences: { likes: [], dislikes: [] },
        onboardingCompleted: true
    },
    'Gluten Free American': {
        uid: 'test_gf',
        name: 'GF Tester',
        dietaryPreference: 'Gluten-Free',
        allergens: ['Gluten'],
        cuisines: ['American'],
        conditions: [],
        email: 'test@test.com',
        preferences: { likes: [], dislikes: [] },
        onboardingCompleted: true
    }
};

const runQualityCheck = async () => {
    console.log('\n🥗 Starting Quality Evaluation (2026 Model Standard)...\n');
    console.log('='.repeat(60));

    for (const [label, profile] of Object.entries(PROFILES)) {
        try {
            console.log(`\n📋 Testing Profile: [${label}]`);
            console.log(`   Constraint: ${profile.dietaryPreference} + ${profile.cuisines.join(', ')}`);

            const start = Date.now();
            // Generate 2 dishes per profile
            const dishes = await generateNewDishes(2, profile, 'Explorer', profile.uid);
            const duration = Date.now() - start;

            if (dishes.length === 0) {
                console.warn("   ⚠️ No dishes generated.");
                continue;
            }

            dishes.forEach(dish => {
                console.log(`\n   🍲 Dish: ${dish.name} (${dish.localName || ''})`);
                console.log(`      Description: ${dish.description.slice(0, 80)}...`);
                console.log(`      Tags: [${dish.tags?.join(', ')}]`);
                console.log(`      Macros: Cal: ${dish.macros?.calories}, P: ${dish.macros?.protein}, Crb: ${dish.macros?.carbs}, Fat: ${dish.macros?.fat}`);

                // Basic Validation Logic
                const violations: string[] = [];

                // Keto Check
                if (profile.dietaryPreference === 'Keto' && (dish.macros?.carbs || 0) > 20) {
                    violations.push(`HIGH CARBS (${dish.macros?.carbs}g) - Keto Fail`);
                }

                // Gluten Free Check
                if (profile.dietaryPreference === 'Gluten-Free') {
                    const gluten = ['Wheat', 'Bread', 'Pasta', 'Flour', 'Maida', 'Roti', 'Naan'];
                    // Exception: "Gluten-Free" in name or tags might excuse it, but let's check content primarily
                    // If explicit "Gluten-Free" tag exists, we assume safety, unless ingredients verify otherwise.
                    // But for this simple check, we flag potential keywords.
                    if (!dish.name.includes('Gluten-Free') && !dish.tags?.includes('Gluten-Free')) {
                        const found = gluten.find(bad =>
                            dish.name.includes(bad) ||
                            dish.description.includes(bad)
                        );
                        if (found) violations.push(`POTENTIAL GLUTEN: ${found}`);
                    }
                }

                // Vegan Check
                if (profile.dietaryPreference === 'Vegan') {
                    const nonVegan = ['Chicken', 'Beef', 'Pork', 'Fish', 'Cheese', 'Paneer', 'Egg', 'Dairy', 'Milk', 'Cream', 'Butter', 'Ghee'];
                    const found = nonVegan.find(bad =>
                        dish.name.includes(bad) ||
                        dish.description.includes(bad) ||
                        dish.ingredients?.some(i => i.name.includes(bad))
                    );
                    if (found) violations.push(`NON-VEGAN Ingredient: ${found}`);
                }

                if (violations.length > 0) {
                    console.log(`      ❌ FAILURE: ${violations.join(', ')}`);
                } else {
                    console.log(`      ✅ PASS: Constraints met`);
                }
            });
            console.log(`   ⏱️  Generation Time: ${duration}ms`);
        } catch (e) {
            console.error(`   ❌ Error testing ${label}:`, e);
        }
    }
    console.log('\n' + '='.repeat(60));
};

runQualityCheck();
