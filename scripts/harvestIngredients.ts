import { config } from 'dotenv';
config();

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIG ---
const MASTER_LIST_PATH = path.join(__dirname, '../data/ingredients_master_list.json');

const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : require('../service-account.json');

if (getApps().length === 0) {
    initializeApp({ credential: cert(FIREBASE_SERVICE_ACCOUNT) });
}
const db = getFirestore();

// --- TYPES ---
interface IngredientNode {
    displayName: string;
    category: string;
    tier: 'Common' | 'Exotic';
    allergens: string[];
    seasonality: string;
    substitutes: string[];
    commonIn: string[];
    nutritionProfile: string;
    flavorProfile?: string;
    texture?: string;
    glycemicIndex?: string;
}

interface MasterList {
    ingredients: Record<string, IngredientNode>;
    dishTemplates: Record<string, any>;
}

// --- LOGIC ---
const harvestIngredients = async () => {
    console.log("🚀 Starting Ingredient Harvest from Firestore...");

    // 1. Load existing KG
    let rawData: MasterList = { ingredients: {}, dishTemplates: {} };
    if (fs.existsSync(MASTER_LIST_PATH)) {
        rawData = JSON.parse(fs.readFileSync(MASTER_LIST_PATH, 'utf-8'));
    }
    const currentIngredients = rawData.ingredients;
    console.log(`📚 Current KG Size: ${Object.keys(currentIngredients).length} ingredients.`);

    // 2. Fetch all dishes
    const snapshot = await db.collection('dishes').get();
    let newCount = 0;
    const newIngredients: Record<string, IngredientNode> = {};

    snapshot.docs.forEach(doc => {
        const dish = doc.data();
        if (!dish.ingredients || !Array.isArray(dish.ingredients)) return;

        dish.ingredients.forEach((ing: any) => {
            const normalizedKey = ing.name.toLowerCase().trim().replace(/\s+/g, '-');

            // If strictly new
            if (!currentIngredients[normalizedKey] && !newIngredients[normalizedKey]) {

                // Inference Logic
                let inferredAllergens: string[] = [];
                const lowerName = ing.name.toLowerCase();

                if (ing.category === 'Dairy' || lowerName.includes('milk') || lowerName.includes('paneer') || lowerName.includes('butter')) inferredAllergens.push('Dairy');
                if (lowerName.includes('nut') || lowerName.includes('cashew') || lowerName.includes('almond')) inferredAllergens.push('Nuts');
                if (lowerName.includes('shrimp') || lowerName.includes('prawn') || lowerName.includes('crab')) inferredAllergens.push('Shellfish');
                if (lowerName.includes('egg')) inferredAllergens.push('Eggs');

                const newNode: IngredientNode = {
                    displayName: ing.name,
                    category: ing.category || 'Pantry', // Default if missing
                    tier: 'Common',
                    allergens: inferredAllergens,
                    seasonality: 'Year-round',
                    substitutes: [],
                    commonIn: [dish.cuisine || 'Global'],
                    nutritionProfile: 'unknown',
                    flavorProfile: 'Savory' // Default
                };

                newIngredients[normalizedKey] = newNode;
                newCount++;
                console.log(`🌱 Discovered: ${ing.name} (${ing.category})`);
            } else if (currentIngredients[normalizedKey]) {
                // Update 'commonIn' if new cuisine
                const existing = currentIngredients[normalizedKey];
                if (dish.cuisine && !existing.commonIn.includes(dish.cuisine)) {
                    existing.commonIn.push(dish.cuisine);
                }
            }
        });
    });

    // 3. Merge & Save
    if (newCount > 0) {
        Object.assign(currentIngredients, newIngredients);
        fs.writeFileSync(MASTER_LIST_PATH, JSON.stringify(rawData, null, 2));
        console.log(`\n✅ Harvest Complete! Added ${newCount} new ingredients to Knowledge Graph.`);
        console.log(`💾 Saved to: ${MASTER_LIST_PATH}`);
    } else {
        console.log("\n✨ No new ingredients found. Graph is up to date.");
    }
};

harvestIngredients().catch(console.error);
