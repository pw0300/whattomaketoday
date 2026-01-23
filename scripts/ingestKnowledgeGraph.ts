
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai'; // Use the Client SDK for simple script usage
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const INDEX_NAME = "tadkasync-main";

// Local Embedding Helper
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

async function generateEmbedding(text: string): Promise<number[] | null> {
    if (!genAI) {
        console.error("❌ No GEMINI_API_KEY found.");
        return null;
    }
    try {
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await model.embedContent(text);
        return result.embedding.values;
    } catch (e) {
        console.error("Embedding Error:", e);
        return null;
    }
}

async function ingest() {
    console.log("🚀 Starting Knowledge Graph Ingestion...");

    // 1. Load Data
    const dataPath = path.resolve(process.cwd(), 'data/ingredients_master_list.json'); // Use cwd for robustness
    let rawData;
    try {
        if (!fs.existsSync(dataPath)) {
            throw new Error(`Master list not found at: ${dataPath}`);
        }
        rawData = fs.readFileSync(dataPath, 'utf-8');
    } catch (e: any) {
        console.error(`❌ Critical Error: Could not load data file. ${e.message}`);
        process.exit(1);
    }

    const kb = JSON.parse(rawData);

    console.log(`📦 Loaded ${Object.keys(kb.ingredients).length} ingredients and ${Object.keys(kb.dishTemplates).length} dishes.`);

    const records = [];

    // 2. Process Ingredients
    console.log("...Processing Ingredients");
    for (const [key, ing] of Object.entries(kb.ingredients)) {
        const i = ing as any;
        const text = `Ingredient: ${i.displayName}. Category: ${i.category}. Flavor: ${i.flavorProfile}. Texture: ${i.texture}. Substitutes: ${i.substitutes?.join(', ')}.`;

        records.push({
            id: `ing_${key}`,
            text: text, // Store exact text we embedded
            metadata: {
                type: 'ingredient',
                category: i.category,
                displayName: i.displayName,
                allergens: i.allergens || [],
                text: text // Duplicate in metadata for retrieval context
            }
        });
    }

    // 3. Process Dishes
    console.log("...Processing Dishes");
    for (const [key, dish] of Object.entries(kb.dishTemplates)) {
        const d = dish as any;
        const text = `Dish: ${d.displayName}. Cuisine: ${d.cuisine}. Diet: ${d.dietaryTags?.join(', ')}. Essentials: ${d.essentialIngredients?.join(', ')}.`;

        records.push({
            id: `dish_${key}`,
            text: text,
            metadata: {
                type: 'dish_template',
                cuisine: d.cuisine,
                displayName: d.displayName,
                dietaryTags: d.dietaryTags || [],
                text: text
            }
        });
    }

    console.log(`✨ Prepared ${records.length} records. Generating embeddings & Upserting...`);

    // 4. Batch Upsert (with Embedding Generation)
    const pineconeApiKey = process.env.PINECONE_API_KEY;
    if (!pineconeApiKey) {
        throw new Error("Missing PINECONE_API_KEY");
    }
    const pc = new Pinecone({ apiKey: pineconeApiKey });
    const index = pc.index(INDEX_NAME);

    const BATCH_SIZE = 20; // Smaller batch for embedding rate limits

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batchRaw = records.slice(i, i + BATCH_SIZE);
        const vectors = [];

        // Generate embeddings in parallel for the batch (with concurrency limit ideally, but simple Promise.all for 20 is fine)
        const embeddingPromises = batchRaw.map(async (rec) => {
            const values = await generateEmbedding(rec.text);
            if (values) {
                return {
                    id: rec.id,
                    values: values,
                    metadata: rec.metadata
                };
            }
            return null;
        });

        const batchVectors = await Promise.all(embeddingPromises);
        const validVectors = batchVectors.filter(v => v !== null);

        if (validVectors.length > 0) {
            console.log(`...Upserting batch ${Math.floor(i / BATCH_SIZE) + 1} (${validVectors.length} vectors)`);
            await index.namespace("knowledge_graph").upsert(validVectors as any);
        }

        // Simple rate limit pause just in case
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log("✅ Ingestion Complete!");
}

ingest().catch(e => console.error("❌ Ingestion Failed:", e));
