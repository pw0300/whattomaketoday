
import fs from 'fs';
import path from 'path';

const INGREDIENTS_LIST_PATH = path.join(process.cwd(), 'data/ingredients_master_list.json');

const migrateAttributes = () => {
    if (!fs.existsSync(INGREDIENTS_LIST_PATH)) {
        console.error("Ingredients DB not found.");
        return;
    }

    const data = JSON.parse(fs.readFileSync(INGREDIENTS_LIST_PATH, 'utf-8'));
    const ingredients = data.ingredients;
    let updateCount = 0;

    for (const key in ingredients) {
        const ing = ingredients[key];
        let updated = false;

        // 1. Flavor Profile (Heuristic Defaults)
        if (!ing.flavorProfile) {
            if (ing.category === 'Spices') ing.flavorProfile = 'Savory';
            else if (['sugar', 'honey', 'jaggery'].includes(key)) ing.flavorProfile = 'Sweet';
            else ing.flavorProfile = 'Neutral';
            updated = true;
        }

        // 2. Texture
        if (!ing.texture) {
            if (ing.category === 'Dairy' || ing.category === 'Liquids') ing.texture = 'Liquid';
            else if (ing.category === 'Protein') ing.texture = 'Firm';
            else ing.texture = 'Soft';
            updated = true;
        }

        // 3. Glycemic Index
        if (!ing.glycemicIndex) {
            if (['rice', 'sugar', 'potato', 'bread'].some((k: string) => key.includes(k))) ing.glycemicIndex = 'High';
            else if (ing.category === 'Vegetables' || ing.category === 'Protein') ing.glycemicIndex = 'Low';
            else ing.glycemicIndex = 'Medium';
            updated = true;
        }

        // 4. Storage Metrics
        if (!ing.storageMetrics) {
            ing.storageMetrics = {
                shelfLife: "1 week",
                method: ing.category === 'Pantry' || ing.category === 'Spices' ? 'Pantry' : 'Fridge'
            };
            updated = true;
        }

        if (updated) updateCount++;
    }

    fs.writeFileSync(INGREDIENTS_LIST_PATH, JSON.stringify(data, null, 4));
    console.log(`Migration Complete. Updated ${updateCount} ingredients with new attributes.`);
};

migrateAttributes();
