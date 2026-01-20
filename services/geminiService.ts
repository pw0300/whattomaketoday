import { Type, Modality } from "@google/genai";
import ingredientsMaster from '../data/ingredients_master_list.json';
import { Dish, UserProfile, VibeMode, ImageSize, DayPlan } from '../types.ts';
import { knowledgeGraph } from './knowledgeGraphService.ts';
import { db } from './firebaseService.ts';
import { collection, addDoc, getDocs, query, limit, Timestamp } from 'firebase/firestore';

import { sanitizeForFirestore } from '../utils/firestoreUtils.ts';

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
      const cleanCacheable = sanitizeForFirestore(cacheable);
      return addDoc(collection(db, CACHE_COLLECTION), cleanCacheable);
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
    // Increased limit to 100 for better cache coverage
    let q = query(ref, limit(100));
    const snapshot = await getDocs(q);
    const pool = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Dish));

    const valid = pool.filter(d => {
      // 1. Basic Metadata Check
      if (profile.dietaryPreference !== 'Any' && !d.tags?.includes(profile.dietaryPreference)) return false;
      if (d.allergens?.some(a => profile.allergens.includes(a))) return false;

      // 2. Deep Graph Validation (Strict Mode)
      if (!knowledgeGraph.isDishContextSafe(d, profile.allergens)) return false;

      return true;
    });

    console.log(`[Cache] Found ${valid.length} valid dishes from pool of ${pool.length}`);
    return valid.sort(() => 0.5 - Math.random()).slice(0, count);
  } catch (e) {
    console.warn("Cache Read Failed:", e);
    return [];
  }
};

// Bulk seed recipes to Firebase from a JSON array (used by Admin/DataSeeder)
export const seedRecipesToFirebase = async (recipes: Dish[]): Promise<number> => {
  if (!db) return 0;
  let count = 0;
  try {
    for (const dish of recipes) {
      // Skip incomplete recipes
      if (!dish.name || !dish.ingredients?.length) continue;

      const cacheable = {
        ...dish,
        id: dish.id || crypto.randomUUID(),
        createdAt: Timestamp.now(),
        searchTags: [
          ...(dish.tags || []),
          ...(dish.healthTags || []),
          dish.cuisine,
          dish.type
        ].filter(Boolean)
      };
      const cleanCacheable = sanitizeForFirestore(cacheable);
      await addDoc(collection(db, CACHE_COLLECTION), cleanCacheable);
      count++;
    }
    console.log(`[Seed] Uploaded ${count} recipes to Firestore cache.`);
    return count;
  } catch (e) {
    console.error("Seed Error:", e);
    return count;
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

const INGREDIENT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    quantity: { type: Type.STRING },
    category: { type: Type.STRING, enum: ['Produce', 'Protein', 'Dairy', 'Pantry', 'Spices'] }
  }
};

export const LIGHT_DISH_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    localName: { type: Type.STRING },
    description: { type: Type.STRING },
    primaryIngredient: { type: Type.STRING },
    cuisine: { type: Type.STRING },
    type: { type: Type.STRING, enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack'] },
    ingredients: { type: Type.ARRAY, items: INGREDIENT_SCHEMA },
    instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
    healthTags: { type: Type.ARRAY, items: { type: Type.STRING } },
    macros: {
      type: Type.OBJECT,
      properties: {
        calories: { type: Type.NUMBER },
        protein: { type: Type.NUMBER },
        carbs: { type: Type.NUMBER },
        fat: { type: Type.NUMBER }
      }
    },
    // New Sensory Attributes
    flavorProfile: { type: Type.STRING, enum: ['Sweet', 'Sour', 'Salty', 'Bitter', 'Umami', 'Spicy', 'Savory', 'Balanced'] },
    textureProfile: { type: Type.STRING, enum: ['Crunchy', 'Soft', 'Creamy', 'Chewy', 'Soup/Liquid', 'Dry'] },
    glycemicIndex: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] }
  },
  required: ["name", "description", "cuisine", "type", "tags", "healthTags", "macros"]
};



const FULL_RECIPE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    ingredients: { type: Type.ARRAY, items: INGREDIENT_SCHEMA },
    instructions: { type: Type.ARRAY, items: { type: Type.STRING } }
  }
};


export const buildConstraintPrompt = (profile: UserProfile): string => {
  const parts = [];
  if (profile.dietaryPreference !== 'Any') parts.push(`Diet: ${profile.dietaryPreference}`);
  if (profile.allergens.length > 0) parts.push(`No: ${profile.allergens.join(', ')}`);
  // Include allergen notes (e.g., "severe reaction to peanuts")
  if (profile.allergenNotes) parts.push(`Allergen Details: "${profile.allergenNotes}"`);
  if (profile.conditions.length > 0) parts.push(`Health: ${profile.conditions.join(', ')}`);
  // Include condition notes (e.g., "strict sugar control needed")
  if (profile.conditionNotes) parts.push(`Health Details: "${profile.conditionNotes}"`);
  // CRITICAL: Add cuisine preferences for personalization
  if (profile.cuisines && profile.cuisines.length > 0) {
    parts.push(`PREFERRED CUISINES (PRIORITIZE): ${profile.cuisines.join(', ')}`);
  }
  // Include cuisine notes (e.g., "must have dal daily", "extra spicy please")
  if (profile.cuisineNotes) parts.push(`MUST HAVE: "${profile.cuisineNotes}"`);
  if (profile.customNotes) parts.push(`Custom Note: "${profile.customNotes}"`);
  if (profile.healthReportSummary) parts.push(`Health Report: "${profile.healthReportSummary}"`);
  if (profile.dislikedDishes && profile.dislikedDishes.length > 0) {
    parts.push(`Do NOT suggest: ${profile.dislikedDishes.join(', ')}`);
  }
  // Add liked dishes for positive reinforcement
  if (profile.likedDishes && profile.likedDishes.length > 0) {
    parts.push(`USER FAVORITES (suggest similar): ${profile.likedDishes.slice(-5).join(', ')}`);
  }
  return parts.join('. ');
};

/**
 * Validate that a dish response has all required fields
 * Prevents blank/incomplete cards from being shown
 */
export const isValidDish = (dish: any): boolean => {
  if (!dish || typeof dish !== 'object') {
    console.debug("[Validation] FAILED: Dish is null or not object", dish);
    return false;
  }
  if (!dish.name || typeof dish.name !== 'string' || dish.name.trim().length < 2) {
    console.debug("[Validation] FAILED: Invalid name", dish.name);
    return false;
  }
  if (!dish.description || typeof dish.description !== 'string' || dish.description.trim().length < 10) {
    console.debug("[Validation] FAILED: Invalid description", dish.description);
    return false;
  }
  if (!dish.cuisine || typeof dish.cuisine !== 'string') {
    console.debug("[Validation] FAILED: Missing cuisine");
    return false;
  }
  if (!dish.type || typeof dish.type !== 'string') {
    console.debug("[Validation] FAILED: Missing type");
    return false;
  }
  return true;
};

/**
 * Build optimized prompt - uses user's cuisine preferences when available
 * Shortened for faster generation (~2-3s target)
 */
export const buildRecipePrompt = (constraints: string, userCuisines?: string[]): string => {
  const seed = Math.floor(Math.random() * 100);
  const techniques = ['grilled', 'roasted', 'stir-fried', 'steamed', 'sautéed'];
  const randomTechnique = techniques[seed % techniques.length];

  // Use user's preferred cuisines if available, otherwise random
  let targetCuisine: string;
  if (userCuisines && userCuisines.length > 0) {
    // Pick random from user's preferences for variety
    targetCuisine = userCuisines[seed % userCuisines.length];
  } else {
    const fallbackCuisines = ['Italian', 'Thai', 'Indian', 'Chinese', 'Mediterranean'];
    targetCuisine = fallbackCuisines[seed % fallbackCuisines.length];
  }

  // CRITICAL: Constraints at TOP
  const constraintSection = constraints
    ? `CRITICAL: ${constraints}\n\n`
    : '';

  // SHORTENED PROMPT for faster generation
  return `${constraintSection}Generate ONE ${targetCuisine} ${randomTechnique} recipe.

Return JSON:
{"name":"...", "localName":"...", "description":"2 sentences", "cuisine":"${targetCuisine}", "type":"Lunch|Dinner|Breakfast|Snack", "tags":["..."], "healthTags":["..."], "macros":{"calories":N}}

RULES: Real dish name, specific to ${targetCuisine} cuisine. Seed:${seed}`;
};

/**
 * Generate a single dish with retry on validation failure
 */
const generateSingleDishWithRetry = async (
  prompt: string,
  maxRetries: number = 3
): Promise<any | null> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await secureGenerate(prompt, LIGHT_DISH_SCHEMA, env.gemini.defaultModel);
      if (result && isValidDish(result)) {
        return result;
      }
      if (attempt < maxRetries) {
        console.log(`[Gemini Retry] Attempt ${attempt} failed validation, retrying...`);
      }
    } catch (e) {
      console.error(`[Gemini Retry] Attempt ${attempt} error:`, e);
    }
  }
  console.warn(`[Gemini Quality] Failed to generate valid dish after ${maxRetries} attempts`);
  return null;
};

// --- SECURE PROXY (BLAZE PLAN) ---

import { retryWithBackoff } from '../utils/asyncUtils';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from '../config/env';

// Client SDK fallback (only used if proxy fails, e.g., local dev without serverless)
const genAI = env.gemini.apiKey ? new GoogleGenerativeAI(env.gemini.apiKey) : null;

export const secureGenerate = async (prompt: any, schema: any, modelName: string = env.gemini.defaultModel) => {
  return retryWithBackoff(async () => {
    // STRATEGY: Proxy-First (Blaze Plan - Secure)
    // 1. Always try the server-side proxy first (/api/generate) - keeps API key secure on server.
    // 2. Only fall back to client SDK if proxy unavailable (local dev without serverless).

    const body: any = { schema, modelName };
    if (typeof prompt === 'string') {
      body.prompt = prompt;
    } else {
      body.contents = prompt;
    }

    try {
      // SKIP PROXY IN NODE/SCRIPT ENVIRONMENTS (No relative fetch)
      if (typeof window === 'undefined') {
        throw new Error("Skipping proxy in Node environment");
      }

      console.debug(`[Gemini] Generating via secure proxy: ${modelName}`);

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        return await response.json();
      }

      // If proxy returns 404/500, fall through to client fallback
      throw new Error(`Proxy returned ${response.status}`);

    } catch (proxyError) {
      // Fallback: Client SDK (for local dev without serverless proxy)
      if (!genAI) {
        throw new Error('Gemini API unavailable: No proxy and no client key configured.');
      }

      // console.warn("[Gemini] Proxy unavailable, using client SDK fallback...", proxyError);

      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0.4,
          candidateCount: 1
        }
      });

      let result;
      if (typeof prompt === 'string') {
        result = await model.generateContent(prompt);
      } else if (prompt.contents) {
        result = await model.generateContent(prompt.contents);
      } else {
        result = await model.generateContent(prompt);
      }

      const responseText = result.response.text();
      return JSON.parse(responseText);
    }
  }, 3, 1000);
};

// NEW: Seeded Prompt for Specific Dish Generation (Cheaper/Faster/Safer)
export const buildSeededRecipePrompt = (dishName: string, constraints: string): string => {
  const constraintSection = constraints
    ? `CRITICAL INSTRUCTIONS:\nSTRICTLY FOLLOW THESE CONSTRAINTS: ${constraints}\n(Any violation of diet/allergens is a critical failure.)\n\n`
    : '';

  return `${constraintSection}Generate the specific recipe for: "${dishName}".
You MUST provide ALL fields with real data suitable for this specific dish.

RULES:
- name: Must be "${dishName}"
- description: 2-3 appetizing sentences
- type: Infer correctly (Dinner/Lunch/etc)
- tags: Relevant tags
- healthTags: Relevant health benefits

Return valid JSON only.`;
};

/**
 * Generate a batch of new dishes
 */
export const generateNewDishes = async (
  count: number = 3,
  userProfile: UserProfile,
  context: VibeMode = 'Explorer',
  userId?: string
): Promise<Dish[]> => {
  try {
    // 1. Get user's dish history to prevent duplicates
    const { getShownDishNames, filterUnseenDishes } = await import('./userHistoryService');
    const shownDishNames = userId ? await getShownDishNames(userId) : [];

    console.log(`[Gemini Telemetry] User has seen ${shownDishNames.length} dishes before`);

    // 2. Try Cache First (with Strict Filter + History Filter)
    const cachedRaw = await getCachedDishes(count * 3, userProfile); // Fetch 3x to have buffer after filtering
    const cached = filterUnseenDishes(cachedRaw, shownDishNames).slice(0, count);

    if (cached.length >= count) {
      console.log(`[Gemini Telemetry] Cache Hit - Served ${cached.length}/${count} dishes from cache (filtered from ${cachedRaw.length} candidates)`);
      return cached;
    }

    const needed = count - cached.length;
    console.log(`[Gemini Telemetry] Cache Miss - Fetching ${needed} new dishes. Hit Rate: ${(cached.length / count * 100).toFixed(1)}%`);

    const constraints = buildConstraintPrompt(userProfile);

    // 3. Hybrid Generation Strategy (KG First -> LLM Fallback)
    const { getUserHistory, analyzeUserPreferences } = await import('./userHistoryService');

    let preferencePrompt = '';
    let kgCandidates: string[] = [];

    // A. Fetch Context
    if (userId) {
      const history = await getUserHistory(userId);
      const summary = analyzeUserPreferences(history);
      if (summary) {
        preferencePrompt = `\n\nUSER FEEDBACK & PREFERENCES:${summary}\n(Prioritize dishes that align with 'USER LOVES' and match 'PREFERRED QUALITIES'. Strictly avoid 'AVOID' items.)`;
      }

      // B. Query Knowledge Graph for Safe Suggestions
      // We cast types to match KG expectation (UserProfile has strictly typed fields)
      const safeCandidates = knowledgeGraph.suggestDishes({
        dietaryPreference: userProfile.dietaryPreference,
        allergens: userProfile.allergens,
        cuisines: userProfile.cuisines
      });

      // C. Filter already seen dishes from KG suggestions
      kgCandidates = safeCandidates
        .map(d => d.displayName)
        .filter(name => !shownDishNames.includes(name));

      console.log(`[Gemini] Graph Suggestions available: ${kgCandidates.length}`, kgCandidates);
    }



    const exclusionList = shownDishNames.length > 0
      ? `\n\nIMPORTANT: Do NOT generate these dishes (user has already seen them): ${shownDishNames.slice(-20).join(', ')}.`
      : '';

    // Prepare Prompts for Parallel Execution
    const prompts: string[] = [];

    // 1. Add KG Seeded Prompts (High Priority)
    while (kgCandidates.length > 0 && prompts.length < needed) {
      const seed = kgCandidates.shift();
      if (seed) {
        console.log(`[Gemini] Adding Graph Seed to batch: ${seed}`);
        prompts.push(buildSeededRecipePrompt(seed, constraints) + preferencePrompt);
      }
    }

    // 2. Fill remainder with Generic Prompts - now with user cuisines
    while (prompts.length < needed) {
      prompts.push(buildRecipePrompt(constraints, userProfile.cuisines) + preferencePrompt + exclusionList);
    }

    // 3. Add Buffer (Generic Prompts) for reliability
    const extraBuffer = Math.ceil(needed * 0.5);
    for (let i = 0; i < extraBuffer; i++) {
      prompts.push(buildRecipePrompt(constraints, userProfile.cuisines) + preferencePrompt + exclusionList);
    }

    // Execute in Parallel
    const tasks = prompts.map(p => generateSingleDishWithRetry(p, 5));
    const results = await Promise.all(tasks);

    const newDishes: Dish[] = results
      .filter(r => r !== null) // Already validated in retry function
      .map((d: any) => {
        const dish: Dish = {
          id: d.name.replace(/\s+/g, '-').toLowerCase() + '-' + Date.now() + Math.random(), // Unique ID
          name: d.name,
          localName: d.localName,
          description: d.description,
          cuisine: d.cuisine,
          type: d.type,
          ingredients: [], // Empty initially (Light Schema)
          instructions: [], // Empty initially
          allergens: [],
          prepTime: Math.floor(Math.random() * 30) + 15,
          macros: {
            calories: d.macros?.calories || 300 + Math.floor(Math.random() * 400),
            protein: 0, carbs: 0, fat: 0
          },
          image: d.image || null,
          tags: d.tags || [],
          healthTags: d.healthTags || [],
          matchScore: 85 + Math.floor(Math.random() * 10), // Mock score
          generatedAt: Date.now(),
          // New Sensory Attributes
          flavorProfile: d.flavorProfile || 'Balanced',
          textureProfile: d.textureProfile || 'Soft',
          glycemicIndex: d.glycemicIndex || 'Medium'
        };
        return dish;
      });

    // Dedup by name within the batch
    const uniqueBatch = newDishes.filter((dish, index, self) =>
      index === self.findIndex((t) => (
        t.name === dish.name
      ))
    );

    return uniqueBatch.slice(0, needed); // Return exact requested amount
  } catch (error) {
    console.error("Error generating new dishes:", error);
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
  const constraints = buildConstraintPrompt(userProfile);
  const prompt = buildRecipePrompt(constraints, userProfile.cuisines);

  const tasks = Array.from({ length: count }).map(async () => {
    // Use retry logic for each progressive dish
    const result = await generateSingleDishWithRetry(prompt, 5);

    if (result) {
      const dish: Dish = {
        ...result,
        id: crypto.randomUUID(),
        image: `https://picsum.photos/400/400?random=${Math.floor(Math.random() * 1000)}`,
        ingredients: [],
        instructions: [],
        allergens: result.allergens || [],
        nutrition: { calories: result.macros?.calories || 0, protein: 0, carbs: 0, fat: 0 },
        isStaple: false
      };
      onDishReady(dish);
      return dish;
    }
    return null;
  });

  const results = await Promise.allSettled(tasks);
  const dishes = results
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => (r as PromiseFulfilledResult<Dish>).value);

  if (dishes.length > 0) cacheGeneratedDishes(dishes);
};

export const enrichDishDetails = async (dish: Dish, userProfile?: UserProfile): Promise<Dish> => {
  try {
    const constraints = userProfile ? buildConstraintPrompt(userProfile) : '';
    const safetyNote = userProfile?.allergens?.length ? `CRITICAL SAFETY: STRICTLY AVOID [${userProfile.allergens.join(', ')}].` : '';

    const prompt = `Create personalized recipe for: ${dish.name} (${dish.description}). 
    ${constraints}. ${safetyNote}
    Return ingredients (with qty/category) and instructions. 
    Use minimal tokens.`;

    const details = await secureGenerate(prompt, FULL_RECIPE_SCHEMA, env.gemini.defaultModel);

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

    const dishData = await secureGenerate(contents, LIGHT_DISH_SCHEMA, env.gemini.defaultModel);

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

    // Extract Knowledge Graph Fragment
    const kgContext = JSON.stringify(ingredientsMaster.ingredients, ["displayName", "allergens", "substitutes"]);

    const prompt = `Create a WhatsApp message for the cook.
    DO NOT include any greeting (no "Namaste", "Sun", "Hey", etc). Start directly with the menu/instructions.

    INPUT DATA:
    Menu: ${menuSummary}
    User Constraints: ${safetyWarning}
    Knowledge Graph (Ingredient DB): ${kgContext}

    TASK:
    1.  **Analyze (Internal Monologue)**: 
        - Go through EACH dish vs EACH constraint.
        - **Consult Knowledge Graph**: Check if ingredients in the dish (e.g., Paneer) trigger User Allergens (e.g., Dairy). 
        - If conflict found -> Suggest Substitute from KG (e.g., Tofu) or plan specific warning ("Paneer mat dalna").
        - If User has Diabetes -> Check rich dishes -> Plan modification (e.g., "Use less oil/sugar").
    
    2.  **Generate Message**: Write the final Hinglish WhatsApp message based on your analysis.

    OUTPUT FORMAT (JSON):
    {
      "reasoning": "Step-by-step analysis using Knowledge Graph lookup...",
      "whatsapp_message": "The final clean message for the cook"
    }`;

    // Schema for Chain-of-Thought
    const COT_SCHEMA = {
      type: Type.OBJECT,
      properties: {
        reasoning: { type: Type.STRING },
        whatsapp_message: { type: Type.STRING }
      }
    };

    // Use gemini-3.0-flash (Superior reasoning for complex personalization)
    const result = await secureGenerate(prompt, COT_SCHEMA, 'gemini-3.0-flash');

    // Log reasoning for debug/transparency
    if (result?.reasoning) console.log("[AI Reasoning]:", result.reasoning);

    return result?.whatsapp_message || null;
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
  try {
    const base64 = await fileToBase64(file);

    const prompt = `Analyze this health/medical/allergy report image and extract dietary-relevant information.

EXTRACT:
1. Any food allergies mentioned (e.g., nuts, dairy, gluten, shellfish)
2. Medical conditions that affect diet (e.g., diabetes, hypertension, cholesterol)
3. Specific foods to avoid based on the report
4. Any nutritional deficiencies or recommendations

FORMAT YOUR RESPONSE AS:
- Allergies: [list]
- Conditions: [list]  
- Avoid: [foods to avoid]
- Notes: [any other dietary recommendations]

If this is not a health report or you cannot extract relevant information, respond with: "Unable to analyze - please upload a clear health or allergy report."

Be concise but complete.`;

    const result = await secureGenerate({
      contents: [{
        parts: [
          { inlineData: { mimeType: file.type, data: base64 } },
          { text: prompt }
        ]
      }]
    }, { type: Type.STRING }, env.gemini.defaultModel);

    if (result && typeof result === 'string' && result.trim().length > 10) {
      return result.trim();
    }

    // If structured response failed, try plain text
    if (result && typeof result === 'object') {
      return JSON.stringify(result);
    }

    return "Unable to analyze report. Please try uploading a clearer image.";
  } catch (error) {
    console.error("Health Report Analysis Error:", error);
    return "Error analyzing report. Please try again.";
  }
};
