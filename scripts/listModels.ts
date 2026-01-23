
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const apiKey = process.env.GEMINI_API_KEY;

async function listModels() {
    if (!apiKey) {
        console.error("No API Key found");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Note: The Node SDK might not expose listModels directly on the main class in all versions
    // but usually it's on the client or via model manager if available.
    // However, looking at the docs, often it's done via HTTP or specific manager methods.
    // Let's try to infer or just test standard ones if list isn't easily available in this SDK version without a ModelManager.
    // Actually, in @google/generative-ai, we might not have a direct listModels method exposed easily in the helper
    // without using the underlying REST flow?
    // Let's checking if we can just "get" it.

    // In many versions:
    // const response = await genAI.getGenerativeModel({ model: '...' })...
    // There isn't a global "list models" on the `GoogleGenerativeAI` class instance usually.
    // We might need to use the REST API for this listing if the SDK doesn't surface it.

    console.log("Fetching models via REST API...");
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("\nAvailable Models:");
            data.models.forEach((m: any) => {
                console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`);
            });
        } else {
            console.log("No models returned or error:", data);
        }
    } catch (e) {
        console.error("Error fetching models:", e);
    }
}

listModels();
