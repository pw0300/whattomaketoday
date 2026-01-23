"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeTrends = void 0;
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
const analyzeTrends = async (context) => {
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
    const pairCounts = {};
    recipesSnapshot.forEach(doc => {
        var _a;
        const data = doc.data();
        const ingredients = ((_a = data.ingredients) === null || _a === void 0 ? void 0 : _a.map((i) => i.name)) || [];
        // Simple pair counting (n^2 but ingredients list is small)
        for (let i = 0; i < ingredients.length; i++) {
            for (let j = i + 1; j < ingredients.length; j++) {
                const a = ingredients[i].toLowerCase().trim();
                const b = ingredients[j].toLowerCase().trim();
                if (a === b)
                    continue;
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
exports.analyzeTrends = analyzeTrends;
function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
//# sourceMappingURL=trendAnalysis.js.map