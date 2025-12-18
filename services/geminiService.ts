import { GoogleGenAI, Type } from "@google/genai";
import { Dish, Allergen, VibeMode, ImageSize, Cuisine } from '../types';

const apiKey = process.env.API_KEY || ''; 

// Helper to convert Blob/File to Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g. "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const DISH_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    localName: { type: Type.STRING },
    description: { type: Type.STRING },
    primaryIngredient: { type: Type.STRING },
    cuisine: { type: Type.STRING },
    type: { type: Type.STRING, enum: ['Lunch', 'Dinner'] },
    macros: {
      type: Type.OBJECT,
      properties: {
        protein: { type: Type.NUMBER },
        carbs: { type: Type.NUMBER },
        fat: { type: Type.NUMBER },
        calories: { type: Type.NUMBER },
      }
    },
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
    instructions: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    }
  }
};

export const generateNewDishes = async (
  count: number, 
  allergens: Allergen[], 
  cuisines: Cuisine[],
  context: VibeMode = 'Explorer'
): Promise<Dish[]> => {
  if (!apiKey) return [];
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // We use search grounding here to get real, trending recipes
    const prompt = `Generate ${count} distinct meal ideas. 
    User Preferences (Cuisines): ${cuisines.join(', ')}.
    Vibe Context: ${context}.
    Exclude ingredients containing these allergens: ${allergens.join(', ')}.
    Use Google Search to find currently trending or highly-rated recipes fitting this criteria.
    Return a list of dishes with macros, ingredients, step-by-step cooking instructions (5-6 steps), and a local Indian name if applicable.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], // Feature: Search Grounding
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: DISH_SCHEMA
        }
      }
    });

    if (response.text) {
      const rawDishes = JSON.parse(response.text);
      return rawDishes.map((d: any, idx: number) => ({
        ...d,
        id: `ai_${Date.now()}_${idx}`,
        // We use random picsum for now to save latency, but in a real app, we'd use gemini-pro-image
        image: `https://picsum.photos/400/400?random=${Math.floor(Math.random() * 1000)}`,
        allergens: [] 
      }));
    }
    return [];

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return [];
  }
};

// Feature: Image Generation with Size Control
const generateDishImage = async (dishName: string, description: string, size: ImageSize): Promise<string> => {
    if (!apiKey) return `https://picsum.photos/400/400?random=${Math.floor(Math.random() * 1000)}`;

    try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview', // Feature: High quality image gen
            contents: {
                parts: [{ text: `A professional food photography shot of ${dishName}, ${description}. High resolution, appetizing, studio lighting, centered, 4k.` }]
            },
            config: {
                imageConfig: {
                    imageSize: size, // Feature: Size selection
                    aspectRatio: "3:4" 
                }
            }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
    } catch (e) {
        console.warn("Image gen failed", e);
    }
    return `https://picsum.photos/400/400?random=${Math.floor(Math.random() * 1000)}`;
};

// Feature: Multi-modal Analysis (Text, Image, Video)
export const analyzeAndGenerateDish = async (
    type: 'text' | 'image' | 'video', 
    input: string | File,
    imageSize: ImageSize = '1K'
): Promise<Dish | null> => {
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });

    try {
        let contents: any;
        let model = 'gemini-3-pro-preview'; // Default for analysis

        if (type === 'text') {
            model = 'gemini-3-flash-preview'; // Faster for text
            contents = `Find a real recipe based on this description: "${input}". Use Google Search to ensure it exists. Return JSON.`;
        } else if (type === 'image' && input instanceof File) {
            const base64 = await fileToBase64(input);
            contents = {
                parts: [
                    { inlineData: { mimeType: input.type, data: base64 } },
                    { text: "Identify this dish. List ingredients, step-by-step instructions, and estimated macros. Return JSON." }
                ]
            };
        } else if (type === 'video' && input instanceof File) {
            const base64 = await fileToBase64(input);
            contents = {
                parts: [
                    { inlineData: { mimeType: input.type, data: base64 } },
                    { text: "Analyze this cooking video. Identify the final dish, the ingredients used, the cooking steps, and estimate macros. Return JSON." }
                ]
            };
        }

        const config: any = {
            responseMimeType: "application/json",
            responseSchema: DISH_SCHEMA
        };

        // Only add search tool for text queries
        if (type === 'text') {
            config.tools = [{ googleSearch: {} }];
        }

        const response = await ai.models.generateContent({
            model: model,
            contents: contents,
            config: config
        });

        if (!response.text) return null;
        
        const dishData = JSON.parse(response.text);

        // Generate the custom image
        const imageUrl = await generateDishImage(dishData.name, dishData.description, imageSize);

        return {
            ...dishData,
            id: `imported_${Date.now()}`,
            image: imageUrl,
            allergens: [] 
        };

    } catch (error) {
        console.error("Gemini Analysis Error:", error);
        return null;
    }
};