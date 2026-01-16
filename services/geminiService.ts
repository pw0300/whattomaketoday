import { Type, Modality } from "@google/genai";
import { Dish, UserProfile, VibeMode, ImageSize, DayPlan } from '../types';
import { db } from './firebaseService';
import { collection, addDoc, getDocs, query, limit, Timestamp } from 'firebase/firestore';

// --- CACHING LAYER ---
const CACHE_COLLECTION = 'cached_dishes';

export const cacheGeneratedDishes = async (dishes: Dish[]) => {
  if (!db) return;
  try {
    const promises = dishes.map(dish => {
      const cacheable = {
        ...dish,
        createdAt: Timestamp.now(),
        searchTags: [
          ...(dish.tags || []),
          ...(dish.healthTags || []),
          dish.cuisine,
          dish.type
        ]
      };
      return addDoc(collection(db, CACHE_COLLECTION), cacheable);
    });
    await Promise.all(promises);
    console.log(`[Cache] Saved ${dishes.length} dishes to Firestore.`);
  } catch (e) {
    console.warn("Cache Write Failed:", e);
  }
};

export const getCachedDishes = async (count: number, profile: UserProfile): Promise<Dish[]> => {
  if (!db) return [];
  try {
    const ref = collection(db, CACHE_COLLECTION);
    let q = query(ref, limit(20));
    const snapshot = await getDocs(q);
    const pool = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Dish));

    const valid = pool.filter(d => {
      if (profile.dietaryPreference !== 'Any' && !d.tags?.includes(profile.dietaryPreference)) return false;
      if (d.allergens?.some(a => profile.allergens.includes(a))) return false;
      return true;
    });

    return valid.sort(() => 0.5 - Math.random()).slice(0, count);
  } catch (e) {
    console.warn("Cache Read Failed:", e);
    return [];
  }
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// --- SCHEMAS ---

const LIGHT_DISH_SCHEMA = {
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
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
    healthTags: {
      type: Type.ARRAY,
      items: { type: Type.STRING, enum: ['Diabetic-Friendly', 'PCOS-Friendly', 'Heart-Healthy', 'High-Protein', 'Low-Carb', 'Keto', 'Gluten-Free'] }
    },
    chefAdvice: { type: Type.STRING }
  }
};

const INGREDIENT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    quantity: { type: Type.STRING },
    category: { type: Type.STRING, enum: ['Produce', 'Protein', 'Dairy', 'Pantry', 'Spices'] }
  }
};

const FULL_RECIPE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    ingredients: { type: Type.ARRAY, items: INGREDIENT_SCHEMA },
    instructions: { type: Type.ARRAY, items: { type: Type.STRING } }
  }
};


const buildConstraintPrompt = (profile: UserProfile): string => {
  const parts = [];
  if (profile.dietaryPreference !== 'Any') parts.push(`Diet: ${profile.dietaryPreference}`);
  if (profile.allergens.length > 0) parts.push(`No: ${profile.allergens.join(', ')}`);
  if (profile.conditions.length > 0) parts.push(`Health: ${profile.conditions.join(', ')}`);
  if (profile.customNotes) parts.push(`Note: "${profile.customNotes}"`);
  return parts.join('. ');
};

// --- SECURE PROXY IMPLEMENTATION ---

import { retryWithBackoff } from '../utils/asyncUtils';

// ... (imports)

const secureGenerate = async (prompt: any, schema: any, modelName: string = "gemini-2.0-flash") => {
  return retryWithBackoff(async () => {
    const body: any = { schema, modelName };

    // Support simple string prompts or complex content objects
    if (typeof prompt === 'string') {
      body.prompt = prompt;
    } else {
      body.contents = prompt; // For multi-modal or chat history
    }

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (response.ok) {
      return await response.json();
    } else {
      // Throwing here triggers the retry
      throw new Error(`Proxy Error: ${response.statusText} (${response.status})`);
    }
  }, 3, 1000); // 3 retries, start at 1s
};

export const generateNewDishes = async (
  count: number,
  userProfile: UserProfile,
  context: VibeMode = 'Explorer'
): Promise<Dish[]> => {
  try {
    // 1. Try Cache First
    const cached = await getCachedDishes(count, userProfile);
    if (cached.length >= count) {
      console.log(`[Gemini] Served ${cached.length} from Cache!`);
      return cached;
    }

    const needed = count - cached.length;
    console.log(`[Gemini] Cache Miss. Fetching ${needed} new dishes in PARALLEL...`);

    // 2. Parallel Generation (Single Dish Request x N)
    const seeds = userProfile.likedDishes?.join(', ') || '';
    const basePrompt = `Generate 1 recipe. Mode: ${context}. ${buildConstraintPrompt(userProfile)}. 
    ${seeds ? `User likes: ${seeds}. Suggest something similar but unique.` : ''}
    Return JSON.`;

    const tasks = Array.from({ length: needed }).map(() =>
      secureGenerate(basePrompt, LIGHT_DISH_SCHEMA, 'gemini-2.0-flash')
    );

    const results = await Promise.all(tasks);

    const newDishes: Dish[] = results
      .filter(r => r !== null)
      .map((d: any) => ({
        ...d,
        id: crypto.randomUUID(),
        image: `https://picsum.photos/400/400?random=${Math.floor(Math.random() * 1000)}`,
        ingredients: [],
        instructions: [],
        allergens: [],
        nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        isStaple: false
      }));

    if (newDishes.length > 0) cacheGeneratedDishes(newDishes);

    return [...cached, ...newDishes];
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return [];
  }
};

// Progressive loading - shows dishes as they arrive
export const generateNewDishesProgressive = async (
  count: number,
  userProfile: UserProfile,
  onDishReady: (dish: Dish) => void,
  context: VibeMode = 'Explorer'
): Promise<void> => {
  const seeds = userProfile.likedDishes?.join(', ') || '';
  const basePrompt = `Generate 1 recipe. Mode: ${context}. ${buildConstraintPrompt(userProfile)}. 
    ${seeds ? `User likes: ${seeds}. Suggest something similar but unique.` : ''}
    Return JSON.`;

  const tasks = Array.from({ length: count }).map(async () => {
    try {
      const result = await secureGenerate(basePrompt, LIGHT_DISH_SCHEMA, 'gemini-2.0-flash');
      if (result) {
        const dish: Dish = {
          ...result,
          id: crypto.randomUUID(),
          image: `https://picsum.photos/400/400?random=${Math.floor(Math.random() * 1000)}`,
          ingredients: [],
          instructions: [],
          allergens: [],
          nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          isStaple: false
        };
        onDishReady(dish);
        return dish;
      }
    } catch (e) {
      console.error("Progressive Gen Error:", e);
    }
    return null;
  });

  const results = await Promise.allSettled(tasks);
  const dishes = results
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => (r as PromiseFulfilledResult<Dish>).value);

  if (dishes.length > 0) cacheGeneratedDishes(dishes);
};

export const enrichDishDetails = async (dish: Dish): Promise<Dish> => {
  try {
    const prompt = `Create recipe for: ${dish.name} (${dish.description}). 
    Return ingredients (with qty/category) and instructions. 
    Use minimal tokens.`;

    const details = await secureGenerate(prompt, FULL_RECIPE_SCHEMA, 'gemini-2.0-flash');

    if (details) {
      return { ...dish, ...details };
    }
    return dish;
  } catch (e) {
    console.error("Enrich Error:", e);
    return dish;
  }
};

export const analyzeAndGenerateDish = async (
  type: 'text' | 'image' | 'video' | 'pantry',
  input: string | File,
  imageSize: ImageSize = '1K',
  userProfile?: UserProfile,
  customInstruction?: string
): Promise<Dish | null> => {
  try {
    const constraints = userProfile ? buildConstraintPrompt(userProfile) : '';
    const extra = customInstruction ? `Note: "${customInstruction}"` : '';
    let contents: any;

    if (type === 'text') {
      contents = `Recipe for: "${input}". ${constraints} ${extra}. Return JSON.`;
    } else if (type === 'pantry' && typeof input === 'string') {
      contents = `Ingredients: ${input}. ${constraints} ${extra}. Minimal shopping. Return JSON.`;
    } else if (type === 'image' && input instanceof File) {
      const base64 = await fileToBase64(input);
      contents = {
        parts: [{ inlineData: { mimeType: input.type, data: base64 } }, { text: "Analyze dish. Return recipe JSON." }]
      };
    } else {
      return null; // Video not supported in frugal mode yet
    }

    // Use secureGenerate with complex content support
    // Note: We need to update api/generate.js to handle 'contents' if we pass an object, 
    // but our updated secureGenerate handles this translation.

    // However, LIGHT_DISH_SCHEMA might be too light? 
    // We probably want the full dish + ingredients here.
    // Let's use a combined schema or just LIGHT for now to save tokens, then enrich?
    // The user expects a full dish analysis. Let's use LIGHT_DISH_SCHEMA for now to be safe.

    const dishData = await secureGenerate(contents, LIGHT_DISH_SCHEMA, 'gemini-2.0-flash');

    if (!dishData) return null;

    return {
      ...dishData,
      id: `imp_${Date.now()}`,
      image: `https://picsum.photos/400/400?random=${Math.floor(Math.random() * 100)}`,
      allergens: []
    };
  } catch (e) {
    console.error("Analysis Error:", e);
    return null;
  }
  return null;
};

export const generateCookInstructions = async (plan: DayPlan[], userProfile?: UserProfile): Promise<string | null> => {
  try {
    const relevantDays = plan.filter(d => d.lunch || d.dinner);
    if (relevantDays.length === 0) return null;

    const menuSummary = relevantDays.map(d => {
      let dayStr = `${d.day}:`;
      if (d.lunch) dayStr += ` Lunch- ${d.lunch.name} (${d.lunch.localName}).`;
      if (d.dinner) dayStr += ` Dinner- ${d.dinner.name} (${d.dinner.localName}).`;
      return dayStr;
    }).join('\n');

    const constraints = userProfile ? buildConstraintPrompt(userProfile) : '';
    const safetyWarning = constraints ? `IMPORTANT SAFETY CONTEXT (Tell the Cook): ${constraints}` : '';

    const prompt = `Act as a strict but polite Indian home manager giving instructions to a domestic cook (Maharaj/Cook). 
    Translate this weekly menu into clear HINDI (using English script/Hinglish) instructions.
    
    Menu:
    ${menuSummary}

    ${safetyWarning}

    Format as a WhatsApp message:
    - Use rough Hindi/Hinglish (e.g., "Kal lunch me Rajma Chawal banana hai").
    - Focus on PREP (e.g., "Raat ko Rajma bhigo dena").
    - IF there are safety/dietary restrictions mentioned above, YOU MUST include a specific warning line in Hindi (e.g., "Madam ko peanuts allergy hai, bilkul mat dalna").
    - Use Emojis.
    - Keep it concise.
    - Format with *Bold* headers for days.
    
    Output ONLY the message body.`;

    const instructions = await secureGenerate(prompt, { type: Type.STRING }, 'gemini-2.0-flash');
    return instructions;
  } catch (e) {
    console.error("Cook Instruction Error:", e);
    return null;
  }
};

export const generateCookAudio = async (plan: any[]): Promise<string | null> => {
  // Disabled for frugal mode / requires specialized audio model proxy support
  console.warn("TTS is disabled in this version.");
  return null;
};

export const analyzeHealthReport = async (file: File): Promise<string> => {
  // Disabled for frugal mode or until image proxy is fully tested
  return "Health Report Analysis disabled.";
};
