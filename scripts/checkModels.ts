
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

async function listModels() {
    if (!apiKey) {
        console.error("No API KEY");
        return;
    }

    // Note: The JS SDK doesn't expose listModels directly on the main class in some versions,
    // but we can try to infer or just test the model we want.
    // Actually, let's just test if 'gemini-3.0-flash' works by generating 'Hello'.

    const modelsToTest = [
        "gemini-2.0-flash",
        "gemini-2.0-flash-thinking-exp",
        "gemini-3.0-flash", // The one in question
        "gemini-3-flash-preview" // The one in test script
    ];

    console.log("Testing model availability...");

    const genAI = new GoogleGenerativeAI(apiKey);

    for (const modelName of modelsToTest) {
        console.log(`\nTesting: ${modelName}`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello, are you there?");
            const response = await result.response;
            console.log(`✅ [${modelName}] Success! Response: ${response.text().slice(0, 50)}...`);
        } catch (e: any) {
            if (e.message.includes("404") || e.message.includes("not found")) {
                console.log(`❌ [${modelName}] Not Found (404)`);
            } else {
                console.log(`❌ [${modelName}] Error: ${e.message.split('\n')[0]}`);
            }
        }
    }
}

listModels();
