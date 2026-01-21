
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    console.error("No API KEY found!");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    console.log("Fetching available models...");
    try {
        // Note: listModels might not be directly exposed on the instance in all SDK versions,
        // but typically it's on the class or via a manager. 
        // For GoogleGenerativeAI SDK, iterating usually requires a different call or just try/catch on the model.
        // But let's try a direct simple request if SDK doesn't support list.
        // Actually, the Google AI SDK for Node typically has a ModelManager.
        // Since I might not have the manager types, I'll try to just infer or check standard reliable models.
        // Better yet, I'll just run a known model check for 'gemini-3.0-flash' explicitly.

        const model = genAI.getGenerativeModel({ model: "gemini-3.0-flash" });
        const result = await model.generateContent("Test");
        console.log("Success! gemini-3.0-flash exists.");
    } catch (e: any) {
        console.log("gemini-3.0-flash failed:", e.message);

        console.log("Trying gemini-2.0-flash...");
        try {
            const model2 = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            await model2.generateContent("Test");
            console.log("Success! gemini-2.0-flash exists.");
        } catch (e2: any) { console.log("gemini-2.0-flash failed"); }
    }
}

listModels();
