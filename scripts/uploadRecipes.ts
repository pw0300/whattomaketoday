
import fs from 'fs';
import path from 'path';
import { seedRecipesToFirebase } from '../services/geminiService';
import { Dish } from '../types';

const MASTER_DB_PATH = path.join(process.cwd(), 'data/master_recipe_db.json');

const uploadData = async () => {
    try {
        if (!fs.existsSync(MASTER_DB_PATH)) {
            console.error("Master DB not found at:", MASTER_DB_PATH);
            return;
        }

        console.log("Reading master recipe database...");
        const rawData = fs.readFileSync(MASTER_DB_PATH, 'utf-8');
        const recipes: Dish[] = JSON.parse(rawData);

        console.log(`Found ${recipes.length} recipes. Starting upload to Firestore 'cached_dishes'...`);

        // Upload in batches is handled by seedRecipesToFirebase or we can let it handle it.
        // The service function uses Promise.all or a loop.
        // Let's call it directly.

        const count = await seedRecipesToFirebase(recipes);

        console.log(`\n✅ Upload Complete!`);
        console.log(`Successfully seeded ${count} recipes to Firebase.`);
        process.exit(0);
    } catch (error) {
        console.error("Upload failed:", error);
        process.exit(1);
    }
};

uploadData();
