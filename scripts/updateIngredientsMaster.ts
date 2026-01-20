
import fs from 'fs';
import path from 'path';

const MASTER_DB_PATH = path.join(process.cwd(), 'data/master_recipe_db.json');
const INGREDIENTS_LIST_PATH = path.join(process.cwd(), 'data/ingredients_master_list.json');

const updateMasterList = () => {
    if (!fs.existsSync(MASTER_DB_PATH)) {
        console.error("Master DB not found.");
        return;
    }

    const masterDb = JSON.parse(fs.readFileSync(MASTER_DB_PATH, 'utf-8'));
    const ingredientsData = JSON.parse(fs.readFileSync(INGREDIENTS_LIST_PATH, 'utf-8'));

    // Ensure "ingredients" key exists
    if (!ingredientsData.ingredients) {
        ingredientsData.ingredients = {};
    }
    const masterIngredients = ingredientsData.ingredients;

    let newCount = 0;
    let totalIngredients = 0;

    masterDb.forEach((recipe: any) => {
        if (!recipe.ingredients || !Array.isArray(recipe.ingredients)) return;

        recipe.ingredients.forEach((ing: any) => {
            const rawName = typeof ing === 'string' ? ing : ing.name;
            if (!rawName) return;

            // Normalize: 'Green Chillies' -> 'green-chillies'
            const name = rawName.trim();
            const key = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

            if (!key) return; // Skip if empty after normalization

            if (!masterIngredients[key]) {
                masterIngredients[key] = {
                    displayName: name,
                    category: "Pantry", // Default safe category
                    tier: "Common",
                    allergens: [],
                    seasonality: "Year-round",
                    substitutes: [],
                    commonIn: ["Universal"],
                    nutritionProfile: "balanced"
                };
                newCount++;
            }
            totalIngredients++;
        });
    });

    fs.writeFileSync(INGREDIENTS_LIST_PATH, JSON.stringify(ingredientsData, null, 4));
    console.log(`Scan Complete: Processed ${totalIngredients} ingredient references.`);
    console.log(`Successfully added ${newCount} NEW ingredients to master list.`);
    console.log(`Total unique ingredients is now: ${Object.keys(masterIngredients).length}`);
};

updateMasterList();
