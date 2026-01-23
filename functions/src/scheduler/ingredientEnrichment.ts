import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";

const db = admin.firestore();

// Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || functions.config().gemini?.key;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "");

interface IngredientMetadata {
    category: 'Produce' | 'Protein' | 'Dairy' | 'Pantry' | 'Spices' | 'Other';
    shelfLife: string;
    glycemicIndex: 'Low' | 'Medium' | 'High';
    flavorProfile: string;
    allergens: string[];
}

export const analyzeNewIngredients = async (context: functions.EventContext) => {
    console.log("[Cron] Starting Daily Ingredient Enrichment...");

    if (!GEMINI_API_KEY) {
        console.error("Missing Gemini API Key. Aborting.");
        return;
    }

    // 1. Get recipes added in the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const recipesSnapshot = await db.collection("recipes")
        .where("createdAt", ">", yesterday.toISOString())
        .get();

    if (recipesSnapshot.empty) {
        console.log("No new recipes found in the last 24 hours.");
        return;
    }

    const newIngredients = new Set<string>();
    recipesSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.ingredients) {
            data.ingredients.forEach((ing: any) => {
                if (ing.name) newIngredients.add(ing.name.toLowerCase().trim());
            });
        }
    });

    // 2. Filter out known ingredients
    // optimize: maintain a simple list of known names in a separate doc or check master collection
    // For now, we'll check against the 'ingredients' collection
    const unknownIngredients: string[] = [];
    const knownSnapshot = await db.collection("ingredients").get();
    const knownSet = new Set(knownSnapshot.docs.map(d => d.id)); // Assuming ID is normalized name

    newIngredients.forEach(ing => {
        // Normalize for ID (e.g., "Olive Oil" -> "olive-oil")
        const id = ing.replace(/\s+/g, '-');
        if (!knownSet.has(id)) {
            unknownIngredients.push(ing);
        }
    });

    if (unknownIngredients.length === 0) {
        console.log("All ingredients are already known.");
        return;
    }

    console.log(`Found ${unknownIngredients.length} unknown ingredients: ${unknownIngredients.join(", ")}`);

    // 3. Batched Gemini Call (Process max 10 at a time to avoid huge prompts)
    const BATCH_SIZE = 10;
    for (let i = 0; i < unknownIngredients.length; i += BATCH_SIZE) {
        const batch = unknownIngredients.slice(i, i + BATCH_SIZE);
        await enrichBatch(batch);
    }
};

async function enrichBatch(ingredients: string[]) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Use stable model

    const prompt = `
    You are a culinary nutritionist. Analyze these ingredients: ${ingredients.join(", ")}.
    Return a JSON object where keys are the ingredient names and values are objects with:
    - category: (Produce, Protein, Dairy, Pantry, Spices, Other)
    - shelfLife: (e.g., "1 week", "2 years")
    - glycemicIndex: (Low, Medium, High)
    - flavorProfile: (Sweet, Sour, Salty, Bitter, Umami, Spicy, Savory, Neutral)
    - allergens: (List of allergens like Gluten, Dairy, Nuts, etc., or empty array)
    
    Ensure Valid JSON.
    `;

    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        });

        const response = result.response.text();
        const json = JSON.parse(response);

        // 4. Save to 'knowledge_graph_updates' for review or direct 'ingredients' insert
        const batch = db.batch();

        for (const [name, meta] of Object.entries(json)) {
            const id = name.toLowerCase().trim().replace(/\s+/g, '-');
            const docRef = db.collection("knowledge_graph_updates").doc(id);

            // Validate against partial type
            const typedMeta = meta as Partial<IngredientMetadata>;

            batch.set(docRef, {
                originalName: name,
                ...typedMeta,
                status: "Pending", // Requires human or auto-approval
                source: "Gemini-Enrichment-Cron",
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        await batch.commit();
        console.log(`Enriched and saved batch of ${ingredients.length} ingredients.`);

    } catch (error) {
        console.error("Error enriching batch:", error);
    }
}
