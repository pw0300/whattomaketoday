
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
dotenv.config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        console.log("No API Key");
        return;
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        console.log("Listing models...");
        // This method might be different depending on SDK version, 
        // but looking at node_modules it seems there isn't a direct listModels on the main client in some versions.
        // Actually it's genAI.makeRequest but that's internal.
        // The ModelManager is usually needed? 
        // Let's try to just hit the REST API directly for listing if SDK is obscure

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach((m: any) => {
                if (m.supportedGenerationMethods?.includes('generateContent')) {
                    console.log(`- ${m.name} (${m.displayName})`);
                }
            });
        } else {
            console.log("No models found in response:", data);
        }

    } catch (e) {
        console.error("List Error:", e);
    }
}
listModels();
