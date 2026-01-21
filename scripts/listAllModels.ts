
import * as dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    console.error("No API KEY found!");
    process.exit(1);
}

async function listAllModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    console.log("Querying Google AI API for model list...");

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("API Error:", data.error);
            return;
        }

        if (!data.models) {
            console.log("No models returned.");
            return;
        }

        console.log("\n--- AVAILABLE GEMINI MODELS ---");
        const geminiModels = data.models.filter((m: any) => m.name.includes("gemini"));

        geminiModels.forEach((m: any) => {
            console.log(`- ${m.name.replace('models/', '')} (${m.displayName})`);
            console.log(`  Methods: ${m.supportedGenerationMethods.join(', ')}`);
        });

        console.log("\n-------------------------------");

    } catch (e) {
        console.error("Fetch error:", e);
    }
}

listAllModels();
