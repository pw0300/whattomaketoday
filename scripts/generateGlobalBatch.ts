import { config } from 'dotenv';
config(); // Load .env

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Pinecone } from '@pinecone-database/pinecone';
import { sanitizeForFirestore } from '../utils/firestoreUtils';
import { isDishSafe } from '../utils/dishSafety';
import { createRequire } from 'module';

// --- FULL SCHEMA WITH INGREDIENTS, ALLERGENS & MACROS ---
const FULL_DISH_SCHEMA: any = {
    type: SchemaType.OBJECT,
    properties: {
        name: { type: SchemaType.STRING },
        localName: { type: SchemaType.STRING },
        description: { type: SchemaType.STRING },
        cuisine: { type: SchemaType.STRING },
        type: { type: SchemaType.STRING, enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack'] },

        // Ingredients (for search, KG, and pantry matching)
        ingredients: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    name: { type: SchemaType.STRING },
                    quantity: { type: SchemaType.STRING },
                    category: { type: SchemaType.STRING, enum: ['Produce', 'Protein', 'Dairy', 'Pantry', 'Spices'] }
                },
                required: ['name']
            }
        },

        // Dietary Classification
        isVegetarian: { type: SchemaType.BOOLEAN },
        isVegan: { type: SchemaType.BOOLEAN },
        isGlutenFree: { type: SchemaType.BOOLEAN },

        // Allergens (Critical for safety filtering)
        allergens: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "Common allergens: dairy, eggs, peanuts, tree-nuts, soy, wheat, fish, shellfish, sesame"
        },

        // Full Macros for health filtering
        macros: {
            type: SchemaType.OBJECT,
            properties: {
                calories: { type: SchemaType.NUMBER },
                protein: { type: SchemaType.NUMBER },
                carbs: { type: SchemaType.NUMBER },
                fat: { type: SchemaType.NUMBER },
                fiber: { type: SchemaType.NUMBER }
            }
        },

        // Time & Effort
        prepTime: { type: SchemaType.NUMBER, description: "Prep time in minutes" },

        // Tags for discovery
        tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        healthTags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },

        // Flavor & Texture
        flavorProfile: { type: SchemaType.STRING, enum: ['Sweet', 'Sour', 'Salty', 'Bitter', 'Umami', 'Spicy', 'Savory', 'Balanced'] },
        textureProfile: { type: SchemaType.STRING, enum: ['Crunchy', 'Soft', 'Creamy', 'Chewy', 'Soup/Liquid', 'Dry'] },
        glycemicIndex: { type: SchemaType.STRING, enum: ['Low', 'Medium', 'High'] }
    },
    required: ["name", "description", "cuisine", "type", "ingredients", "isVegetarian", "allergens", "macros", "tags"]
};

// --- CONFIGURATION ---
const require = createRequire(import.meta.url);
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : require('../service-account.json');

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX = process.env.PINECONE_INDEX_NAME || 'tadkasync-main';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY in .env");
if (!PINECONE_API_KEY) throw new Error("Missing PINECONE_API_KEY in .env");

// --- INITIALIZATION ---
if (getApps().length === 0) {
    initializeApp({ credential: cert(FIREBASE_SERVICE_ACCOUNT) });
}
const db = getFirestore();
const pc = new Pinecone({ apiKey: PINECONE_API_KEY });
const index = pc.index(PINECONE_INDEX);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
        responseMimeType: "application/json",
        responseSchema: FULL_DISH_SCHEMA,
        temperature: 0.4 // Default safe temperature
    }
});

// --- DIVERSITY SLOTS (INDIA-FOCUSED: REGIONAL + NON-VEG) ---
const SLOTS = [
    // Quick & Healthy
    { name: "Quick Indian", count: 15, prompt: "Quick Indian dishes ready in under 30 minutes. Examples: Poha, Upma, Besan Chilla, Rava Idli." },
    { name: "Healthy Indian", count: 15, prompt: "Healthy Indian dishes. High protein, low carb. Examples: Sprout Chaat, Moong Dal Cheela, Grilled Tandoori, Millet Rotis." },

    // Non-Veg Slots
    { name: "Chicken Dishes", count: 15, prompt: "Indian chicken dishes. Examples: Butter Chicken, Chicken Tikka Masala, Chicken Biryani, Chicken Korma, Tandoori Chicken." },
    { name: "Mutton & Lamb", count: 10, prompt: "Indian mutton and lamb dishes. Examples: Mutton Rogan Josh, Laal Maas, Lamb Biryani, Keema Matar, Gosht Nihari." },
    { name: "Seafood Indian", count: 10, prompt: "Indian seafood and fish dishes. Examples: Fish Curry, Prawn Masala, Goan Fish Curry, Macher Jhol, Prawn Biryani." },

    // Regional Vegetarian
    { name: "South Indian", count: 15, prompt: "South Indian dishes. Examples: Idli, Dosa, Sambar, Rasam, Pongal, Curd Rice, Avial, Appam." },
    { name: "North Indian", count: 15, prompt: "North Indian cuisine. Examples: Dal Makhani, Rajma, Chole, Paneer Butter Masala, Kadhi Pakora." },
    { name: "Bengali", count: 10, prompt: "Bengali cuisine. Examples: Mishti Doi, Shukto, Cholar Dal, Kosha Mangsho, Sandesh, Rasgulla." },
    { name: "Gujarati", count: 10, prompt: "Gujarati cuisine. Examples: Dhokla, Thepla, Khandvi, Undhiyu, Dal Dhokli, Fafda Jalebi." },
    { name: "Hyderabadi", count: 10, prompt: "Hyderabadi cuisine. Examples: Hyderabadi Biryani, Haleem, Mirchi Ka Salan, Double Ka Meetha, Bagara Baingan." },
    { name: "Punjabi", count: 10, prompt: "Punjabi cuisine. Examples: Sarson da Saag, Makki di Roti, Amritsari Kulcha, Lassi, Pinni." },
    { name: "Rajasthani", count: 10, prompt: "Rajasthani cuisine. Examples: Dal Baati Churma, Gatte Ki Sabzi, Ker Sangri, Pyaaz Kachori, Mirchi Vada." },

    // Street Food & Snacks
    { name: "Street Food", count: 15, prompt: "Indian street food and chaat. Examples: Pav Bhaji, Pani Puri, Bhel Puri, Vada Pav, Samosa, Dahi Puri, Aloo Tikki Chaat." },

    // Desserts & Drinks
    { name: "Indian Desserts", count: 10, prompt: "Indian sweets and desserts. Examples: Gulab Jamun, Rasmalai, Kheer, Jalebi, Gajar Halwa, Ladoo, Barfi." },
    { name: "Indian Drinks", count: 10, prompt: "Indian beverages. Examples: Masala Chai, Lassi, Buttermilk (Chaas), Thandai, Aam Panna, Filter Coffee, Jal Jeera." }
];

// --- FIRESTORE PRE-CHECK: Fetch existing dish names ---
const fetchExistingDishNames = async (): Promise<Set<string>> => {
    console.log("📚 Fetching existing dishes from Firestore...");
    const existing = new Set<string>();
    try {
        // Check both 'dishes' and 'cached_dishes' collections
        const collections = ['dishes', 'cached_dishes'];
        for (const col of collections) {
            const snapshot = await db.collection(col).select('name').get();
            snapshot.docs.forEach(doc => {
                const name = doc.data().name;
                if (name) existing.add(name.toLowerCase().trim());
            });
        }
        console.log(`📚 Found ${existing.size} existing dishes in Firestore.`);
    } catch (e) {
        console.warn("⚠️ Could not fetch existing dishes:", e);
    }
    return existing;
};

// --- GENERATOR ---
const generateBatch = async () => {
    console.log("🚀 Starting Enhanced Global Batch Generation (India-Focused)...");
    let totalGenerated = 0;
    let totalSaved = 0;

    // --- IN-MEMORY DEDUPLICATION (includes Firestore pre-check) ---
    const generatedNames = await fetchExistingDishNames();

    for (const slot of SLOTS) {
        console.log(`\n📂 Processing Slot: ${slot.name} (Target: ${slot.count})`);
        let slotCount = 0;
        let retries = 0;

        while (slotCount < slot.count && retries < 50) {
            try {
                const batchSize = Math.min(5, slot.count - slotCount);
                const recentNames = Array.from(generatedNames).slice(-30).join(', ');

                const promises = Array.from({ length: batchSize }).map(async () => {
                    const seed = Math.floor(Math.random() * 100000);
                    const prompt = `Generate a UNIQUE Indian dish for: "${slot.prompt}". 
                    DO NOT generate these (already done): [${recentNames}].
                    Be creative and regionally authentic. Seed: ${seed}. Return JSON.`;

                    // Adaptive Temperature: Increase creativity only on retries/dupes
                    const temp = retries > 5 ? 1.0 : (retries > 2 ? 0.7 : 0.4);

                    const result = await model.generateContent({
                        contents: [{ role: 'user', parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: temp,
                            responseMimeType: "application/json",
                            responseSchema: FULL_DISH_SCHEMA
                        }
                    });
                    const text = result.response.text();
                    try { return JSON.parse(text); } catch { return null; }
                });

                const rawResults = await Promise.all(promises);

                // Track duplicates in this specific batch
                let duplicatesInBatch = 0;

                for (const dish of rawResults) {
                    if (!dish) continue;
                    if (!isDishSafe(dish)) continue;

                    const normalizedName = dish.name.toLowerCase().trim();
                    if (generatedNames.has(normalizedName)) {
                        console.log(`⏭️  Skipped (Duplicate): ${dish.name}`);
                        duplicatesInBatch++;
                        continue;
                    }
                    generatedNames.add(normalizedName);

                    const id = `gb_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                    const enrichedDish = {
                        ...dish,
                        id,
                        generatedAt: Date.now(),
                        batch: 'global_pilot_v2',
                        slot: slot.name
                    };

                    await db.collection('dishes').doc(id).set(sanitizeForFirestore(enrichedDish));

                    const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
                    // Include ingredients in embedding for better "pantry search"
                    const ingredientNames = dish.ingredients?.map((i: any) => i.name).join(', ') || '';
                    const embedText = `${dish.name} ${dish.description} ${dish.cuisine} Ingredients: ${ingredientNames}`;
                    const embedRes = await embedModel.embedContent(embedText);
                    const embedding = embedRes.embedding.values;

                    await index.upsert([{
                        id,
                        values: embedding,
                        metadata: {
                            name: dish.name,
                            cuisine: dish.cuisine,
                            type: dish.type,
                            tags: dish.tags?.join(','),
                            slot: slot.name,
                            _type: 'dish'
                        }
                    }]);

                    console.log(`✅ Saved: ${dish.name} (${slot.name})`);
                    slotCount++;
                    totalSaved++;
                }

                // If entire batch was duplicates, increment retries heavily
                if (duplicatesInBatch === rawResults.length) {
                    console.log(`⚠️  Batch was 100% duplicates. Retrying...`);
                    retries += 5;
                }

            } catch (e) {
                console.error("Batch Error:", e);
                retries++;
            }
        }
        totalGenerated += slotCount;
    }

    console.log(`\n🎉 Batch Complete. Generated ${totalGenerated} unique dishes.`);
};

generateBatch().catch(console.error);
