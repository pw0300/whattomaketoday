import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const analyzeTrends = async (context: functions.EventContext) => {
    console.log("[Cron] Starting Weekly Trend Analysis...");

    // 1. Aggregate user history / saved recipes from the last 7 days
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    // This query depends on your data model. 
    // Assuming we have a 'usage_logs' or we scan 'recipes' created recently.
    const recipesSnapshot = await db.collection("recipes")
        .where("createdAt", ">", lastWeek.toISOString())
        .get();

    if (recipesSnapshot.empty) {
        console.log("No activity found in the last week.");
        return;
    }

    const pairCounts: Record<string, number> = {};

    recipesSnapshot.forEach(doc => {
        const data = doc.data();
        const ingredients: string[] = data.ingredients?.map((i: any) => i.name) || [];

        // Simple pair counting (n^2 but ingredients list is small)
        for (let i = 0; i < ingredients.length; i++) {
            for (let j = i + 1; j < ingredients.length; j++) {
                const a = ingredients[i].toLowerCase().trim();
                const b = ingredients[j].toLowerCase().trim();
                if (a === b) continue;

                // Sort to ensure "onion+garlic" is same as "garlic+onion"
                const key = [a, b].sort().join("|");
                pairCounts[key] = (pairCounts[key] || 0) + 1;
            }
        }
    });

    // 2. Filter for popular pairs (e.g., appearing in > 10% of new recipes or absolute threshold)
    const THRESHOLD = 3; // Low threshold for demo purposes
    const popularPairs = Object.entries(pairCounts)
        .filter(([_, count]) => count >= THRESHOLD)
        .sort((a, b) => b[1] - a[1]); // Descending

    if (popularPairs.length === 0) {
        console.log("No significant trends detected.");
        return;
    }

    console.log("Popular Ingredient Pairs:", popularPairs);

    // 3. Store insights in 'trending_insights' collection
    const insightId = `week-${getWeekNumber(new Date())}-${new Date().getFullYear()}`;
    await db.collection("trending_insights").doc(insightId).set({
        period: "weekly",
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
        popularPairs: popularPairs.map(([pair, count]) => ({
            ingredients: pair.split("|"),
            count
        }))
    });

    console.log(`Saved trend insights: ${insightId}`);
};

function getWeekNumber(d: Date): number {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
