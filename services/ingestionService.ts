import { secureGenerate, cacheGeneratedDishes } from './geminiService';
import { knowledgeGraph } from './knowledgeGraphService';
import { Dish } from '../types';
import { Type } from "@google/genai";
import { db } from './firebaseService';

// Schema for parsing a recipe from raw blog text
const PARSED_RECIPE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        description: { type: Type.STRING },
        cuisine: { type: Type.STRING },
        type: { type: Type.STRING, enum: ['Lunch', 'Dinner', 'Breakfast', 'Snack'] },
        ingredients: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    quantity: { type: Type.STRING },
                    category: { type: Type.STRING, enum: ['Produce', 'Protein', 'Dairy', 'Pantry', 'Spices'] }
                }
            }
        },
        instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
        macros: {
            type: Type.OBJECT,
            properties: {
                calories: { type: Type.NUMBER },
                protein: { type: Type.NUMBER },
                carbs: { type: Type.NUMBER },
                fat: { type: Type.NUMBER }
            }
        },
        tags: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["name", "ingredients", "instructions"]
};

const LINK_EXTRACTION_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        recipeUrls: { type: Type.ARRAY, items: { type: Type.STRING } }
    }
};

export const extractRecipeLinksFromHtml = async (baseUrl: string, htmlContent: string): Promise<string[]> => {
    try {
        console.log(`[Crawler] Analyzing ${baseUrl} for recipe links...`);
        const prompt = `
            You are a Link Extractor. 
            I have provided the HTML (text body) of a 'Recipe Index' page from a food blog.
            
            BASE URL: ${baseUrl}
            CONTENT:
            ${htmlContent.substring(0, 30000)}

            TASK:
            1. Identify hyperlinks that point to INDIVIDUAL RECIPE pages.
            2. Ignore contact pages, about pages, category tags, or social media links.
            3. Return a list of ABSOLUTE URLs.

            RETURN JSON ONLY.
        `;

        const result = await secureGenerate(prompt, LINK_EXTRACTION_SCHEMA, 'gemini-2.0-flash');
        return result?.recipeUrls || [];

    } catch (e) {
        console.error("Crawler Error:", e);
        return [];
    }
}

export const ingestRecipeFromUrl = async (url: string, content: string): Promise<Dish | null> => {
    try {
        console.log(`[Ingestion] Processing: ${url}`);

        const prompt = `
      You are an EXPERT Recipe Parser Agent. Your job is to extract COMPLETE recipe data from scraped web content.
      
      URL: ${url}
      CONTENT:
      ${content.substring(0, 50000)}

      CRITICAL REQUIREMENTS:
      1. You MUST extract ALL ingredients with quantities (e.g., "2 cups flour", "1 tsp salt").
      2. You MUST extract ALL step-by-step instructions (each step as a separate string).
      3. If ingredients/instructions are not explicitly listed, INFER them from the content.
      4. NEVER return empty arrays for ingredients or instructions - always provide data.
      5. Classify each ingredient into a category: Produce, Protein, Dairy, Pantry, or Spices.
      6. Estimate macros (calories, protein, carbs, fat) per serving.

      EXAMPLE OUTPUT FORMAT:
      {
        "name": "Butter Chicken",
        "ingredients": [
          {"name": "chicken thighs", "quantity": "500g", "category": "Protein"},
          {"name": "tomato puree", "quantity": "1 cup", "category": "Produce"}
        ],
        "instructions": [
          "Marinate chicken in yogurt and spices for 2 hours.",
          "Cook chicken in a tandoor or oven until charred."
        ]
      }
      
      RETURN VALID JSON ONLY. NO MARKDOWN, NO EXPLANATION.
    `;

        const parsedData = await secureGenerate(prompt, PARSED_RECIPE_SCHEMA, 'gemini-2.0-flash');

        if (!parsedData || !parsedData.name) {
            console.warn(`[Ingestion] Failed to parse content from ${url}`);
            return null;
        }

        // Successfully parsed - return the dish object
        console.log(`[Ingestion] ✅ Successfully parsed: ${parsedData.name}`);
        return parsedData as Dish;

    } catch (e) {
        console.error(`[Ingestion] Error ingesting ${url}:`, e);
        return null;
    }
};
