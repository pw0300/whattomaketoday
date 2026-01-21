
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
dotenv.config();

async function testModel(modelName: string) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) return;
    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        console.log(`Testing ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello");
        console.log(`✅ ${modelName} Success:`, result.response.text());
    } catch (e: any) {
        console.log(`❌ ${modelName} Failed:`, e.message || e);
    }
}

async function run() {
    await testModel("gemini-2.0-flash");
    await testModel("gemini-2.0-flash-exp");
    // await testModel("gemini-3-flash-preview");
    await testModel("gemini-flash-latest");
}
run();
