
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const apiKey = process.env.GEMINI_API_KEY;

async function test() {
    console.log("Testing Gemini Embedding...");
    if (apiKey) console.log("Key starts with:", apiKey.substring(0, 10) + "...");

    if (!apiKey) return;

    const genAI = new GoogleGenerativeAI(apiKey);

    // 1. Test Generate Content (Known good from User curl)
    try {
        console.log("\nAttempting generateContent with gemini-2.0-flash...");
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent("Test");
        console.log(`✅ Success with gemini-2.0-flash! Response: ${result.response.text().substring(0, 20)}`);
    } catch (e: any) {
        console.error(`❌ Failed with gemini-2.0-flash: ${e.status} ${e.statusText || e.message}`);
    }

    // 2. Test Embedding
    const models = ["text-embedding-004", "models/text-embedding-004"];
    for (const m of models) {
        try {
            console.log(`\nAttempting embedding model: ${m}`);
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.embedContent("Hello world");
            console.log(`✅ Success with ${m}! Vector length: ${result.embedding.values.length}`);
            return;
        } catch (e: any) {
            console.error(`❌ Failed with ${m}: ${e.status} ${e.statusText || e.message}`);
        }
    }
}
test();
