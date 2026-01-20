
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import * as dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    console.error("No API KEY found!");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

// MOCK DATA for UAT
const MOCK_PROFILE = {
    name: "Rahul",
    allergens: ["Nuts", "Dairy"],
    dietaryPreference: "Vegetarian",
    conditions: ["Diabetes"]
};

const MOCK_PLAN = [
    {
        day: "Monday",
        lunch: { name: "Paneer Butter Masala", localName: "पनीर बटर मसाला", ingredients: [{ name: "Paneer", category: "Dairy" }] },
        dinner: { name: "Dal Tadka", localName: "दाल तड़का", ingredients: [{ name: "Lentils", category: "Pantry" }] },
    },
    {
        day: "Tuesday",
        lunch: { name: "Aloo Gobi", localName: "आलू गोभी", ingredients: [{ name: "Potato", category: "Produce" }] },
        dinner: null
    }
];

// Replicating Logic from geminiService.ts
async function runTest() {
    console.log("--- STARTING LIVE UAT: Cook Message Generation ---");
    console.log("User Profile:", JSON.stringify(MOCK_PROFILE));

    const menuSummary = MOCK_PLAN.map(d => {
        let dayStr = `${d.day}:`;
        if (d.lunch) dayStr += ` Lunch- ${d.lunch.name} (${d.lunch.localName}).`;
        if (d.dinner) dayStr += ` Dinner- ${d.dinner.name} (${d.dinner.localName}).`;
        return dayStr;
    }).join('\n');

    const constraints = `Diet: ${MOCK_PROFILE.dietaryPreference}. No: ${MOCK_PROFILE.allergens.join(', ')}. Conditions: ${MOCK_PROFILE.conditions.join(', ')}`;
    const safetyWarning = `IMPORTANT SAFETY CONTEXT (Tell the Cook): ${constraints}`;

    const prompt = `Create a WhatsApp message for the cook.
    DO NOT include any greeting (no "Namaste", "Sun", "Hey", etc). Start directly with the menu/instructions.

    INPUT DATA:
    Menu: ${menuSummary}
    User Constraints: ${safetyWarning}
    
    TASK:
    1.  **Analyze (Internal Monologue)**: 
        - Go through EACH dish vs EACH constraint.
        - Check if ingredients in the dish (e.g., Paneer) trigger User Allergens (e.g., Dairy). 
        - If conflict found -> Suggest Substitute (e.g., Tofu) or plan specific warning ("Paneer mat dalna").
        - If User has Diabetes -> Check rich dishes -> Plan modification (e.g., "Use less oil/sugar").
    
    2.  **Generate Message**: Write the final Hinglish WhatsApp message based on your analysis.

    OUTPUT FORMAT (JSON):
    {
      "reasoning": "Step-by-step analysis...",
      "whatsapp_message": "The final clean message for the cook"
    }`;

    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash", // Using flash for test script
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    reasoning: { type: SchemaType.STRING },
                    whatsapp_message: { type: SchemaType.STRING }
                }
            } as any
        }
    });

    console.log("\n[Gemini] Sending Prompt...");
    try {
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        console.log("\n--- RAW API RESPONSE ---");
        console.log(response);

        const parsed = JSON.parse(response);
        console.log("\n--- PARSED OUTPUT ---");
        console.log("Reasoning:", parsed.reasoning);
        console.log("\n📲 WhatsApp Message:", parsed.whatsapp_message);
        console.log("\n-------------------------");

    } catch (e) {
        console.error("API Call Failed:", e);
    }
}

runTest();
