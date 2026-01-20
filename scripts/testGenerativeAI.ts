
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import * as dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
console.log("Using Key:", apiKey ? "YES (Masked)" : "NO");
console.log("SchemaType.OBJECT is:", SchemaType.OBJECT);
console.log("SchemaType.STRING is:", SchemaType.STRING);

const genAI = new GoogleGenerativeAI(apiKey);

const LIGHT_DISH_SCHEMA = {
    description: "Lightdish schema",
    type: SchemaType.OBJECT,
    properties: {
        name: { type: SchemaType.STRING, description: "Name of the dish" },
        localName: { type: SchemaType.STRING, description: "Local name of the dish", nullable: true },
        description: { type: SchemaType.STRING, description: "2 sentence description of the dish" },
        cuisine: { type: SchemaType.STRING, description: "Cuisine type" },
        type: { type: SchemaType.STRING, description: "Meal type" },
        tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        healthTags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        macros: {
            type: SchemaType.OBJECT,
            properties: {
                calories: { type: SchemaType.NUMBER },
            },
            required: ["calories"]
        }
    },
    required: ["name", "description", "cuisine", "type", "tags", "healthTags", "macros"]
};

const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
        responseMimeType: "application/json",
        responseSchema: LIGHT_DISH_SCHEMA as any
    }
});

const prompt = `Generate a unique, creative recipe with COMPLETE details.
EXAMPLE OUTPUT FORMAT:
{
  "name": "Paneer Butter Masala",
  "localName": "पनीर बटर मसाला",
  "description": "Rich and creamy cottage cheese curry...",
  "cuisine": "North Indian",
  "type": "Dinner",
  "tags": ["Creamy", "Rich", "Popular"],
  "healthTags": ["High-Protein", "Calcium-Rich"],
  "macros": { "calories": 350 }
}
Respond with a COMPLETE JSON object.`;

async function test() {
    try {
        console.log("Generating...");
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        console.log("Length:", text.length);
        console.log("Snippet:", text.substring(0, 100));
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
