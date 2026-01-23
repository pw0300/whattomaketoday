import { Type, Modality } from "@google/genai";
import ingredientsMaster from '../data/ingredients_master_list.json';
import { Dish, UserProfile, VibeMode, ImageSize, DayPlan } from '../types.ts';
import { knowledgeGraph } from './knowledgeGraphService.ts';
import { db } from './firebaseService.ts';
import { collection, addDoc, getDocs, query, limit, Timestamp } from 'firebase/firestore';
import { chunkArray } from '../utils/asyncUtils';

import { sanitizeForFirestore } from '../utils/firestoreUtils.ts';

// --- CACHING LAYER ---
const CACHE_COLLECTION = 'cached_dishes';
import { contextManager } from './contextManagerService';
import { pineconeService } from './pineconeService';

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
    // ingredients and instructions removed for latency optimization (now in METADATA_DISH_SCHEMA)
    // but kept here if needed for legacy or full generation checks
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
    flavorProfile: { type: Type.STRING, enum: ['Sweet', 'Sour', 'Salty', 'Bitter', 'Umami', 'Spicy', 'Savory', 'Balanced'] },
    textureProfile: { type: Type.STRING, enum: ['Crunchy', 'Soft', 'Creamy', 'Chewy', 'Soup/Liquid', 'Dry'] },
    glycemicIndex: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] }
  },
  required: ["name", "description", "cuisine", "type", "tags", "healthTags", "macros"]
};

// Optimized for Latency (Feed Generation)
// Excludes expensive fields: ingredients, instructions
export const METADATA_DISH_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    localName: { type: Type.STRING },
    description: { type: Type.STRING },
    cuisine: { type: Type.STRING },
    type: { type: Type.STRING, enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack'] },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
    healthTags: { type: Type.ARRAY, items: { type: Type.STRING } },
    macros: {
      type: Type.OBJECT,
      properties: {
        calories: { type: Type.NUMBER }
      }
    },
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


// --- TOKEN BUDGETING & OPTIMIZATION ---

export const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

// Strict budgeting for speed
const BUDGETS = {
  feed: 1000,      // Fast (<2s)
  cook: 3000,      // Detailed (~4s)
  analyze: 4000    // Complex (~5-8s)
};

export const getConstrainedContext = (context: string, maxTokens: number): string => {
  const tokens = estimateTokens(context);
  if (tokens <= maxTokens) return context;
  console.debug(`[Context] Truncating context from ${tokens} to ${maxTokens} tokens`);
  return context.slice(0, maxTokens * 4);
};

export const buildConstraintPrompt = (profile: UserProfile): string => {
  const parts = [];
  if (profile.dietaryPreference !== 'Any') parts.push(`Diet: ${profile.dietaryPreference}`);
  if (profile.allergens.length > 0) parts.push(`No: ${profile.allergens.join(', ')}`);

  // Critical restrictions first (always kept)
  let context = parts.join('. ');

  const optionalParts = [];
  if (profile.allergenNotes) optionalParts.push(`Allergen Details: "${profile.allergenNotes}"`);
  if (profile.conditions.length > 0) optionalParts.push(`Health: ${profile.conditions.join(', ')}`);
  if (profile.conditionNotes) optionalParts.push(`Health Details: "${profile.conditionNotes}"`);

  if (profile.cuisines && profile.cuisines.length > 0) {
    optionalParts.push(`PREFERRED CUISINES (PRIORITIZE): ${profile.cuisines.join(', ')}`);
  }
  if (profile.cuisineNotes) optionalParts.push(`MUST HAVE: "${profile.cuisineNotes}"`);
  if (profile.customNotes) optionalParts.push(`Custom Note: "${profile.customNotes}"`);
  if (profile.healthReportSummary) optionalParts.push(`Health Report: "${profile.healthReportSummary}"`);
  if (profile.dislikedDishes && profile.dislikedDishes.length > 0) {
    optionalParts.push(`Do NOT suggest: ${profile.dislikedDishes.join(', ')}`);
  }
  if (profile.likedDishes && profile.likedDishes.length > 0) {
    optionalParts.push(`USER FAVORITES (suggest similar): ${profile.likedDishes.slice(-5).join(', ')}`);
  }

  // Append optional parts until budget hit (Feed Budget used here as default)
  const budget = BUDGETS.feed - estimateTokens(context);
  const optionalContext = getConstrainedContext(optionalParts.join('. '), Math.max(0, budget));

  return context + (optionalContext ? '. ' + optionalContext : '');
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

  // MINIMAL PROMPT - schema enforces structure, no need for verbose instructions
  return `${constraintSection}${targetCuisine} ${randomTechnique} dish. Seed:${seed}`;
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
      const result = await secureGenerate(prompt, METADATA_DISH_SCHEMA, 'feed');
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

// --- SECURE PROXY (BLAZE PLAN) ---

import { retryWithBackoff } from '../utils/asyncUtils';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from '../config/env';
import {
  selectModel,
  TaskType,
  embeddingCache,
  requestCoalescer,
  checkSemanticDuplicate,
  getTokenBudget,
  truncateToTokenBudget
} from './aiOptimizationService';

// Client SDK fallback (only used if proxy fails, e.g., local dev without serverless)
const genAI = env.gemini.apiKey ? new GoogleGenerativeAI(env.gemini.apiKey) : null;

/**
 * Enhanced secure generation with Adaptive Model Selection
 */
export const secureGenerate = async (
  prompt: any,
  schema: any,
  taskType: TaskType = 'feed'
) => {
  // Coalesce identical requests (Dedup)
  const promptStr = typeof prompt === 'string' ? prompt : JSON.stringify(prompt);
  const coalesceKey = `gen:${taskType}:${promptStr.slice(0, 50)}:${JSON.stringify(schema).length}`;

  return requestCoalescer.request(coalesceKey, async () => {
    return retryWithBackoff(async () => {
      // STRATEGY: Proxy-First (Blaze Plan - Secure)
      // 1. Always try the server-side proxy first (/api/generate) - keeps API key secure on server.
      // 2. Only fall back to client SDK if proxy unavailable (local dev without serverless).

      // Optimization: Select optimal model and budget
      const modelConfig = selectModel(taskType);
      const tokenBudget = getTokenBudget(taskType);

      // Optimization: Truncate prompt if needed
      const safePrompt = typeof prompt === 'string'
        ? truncateToTokenBudget(prompt, tokenBudget.maxInputTokens)
        : prompt;

      const body: any = {
        schema,
        modelName: modelConfig.model,
        config: {
          maxOutputTokens: modelConfig.maxOutputTokens,
          temperature: modelConfig.temperature
        }
      };

      if (typeof safePrompt === 'string') {
        body.prompt = safePrompt;
      } else {
        body.contents = safePrompt;
      }

      try {
        // SKIP PROXY IN NODE/SCRIPT ENVIRONMENTS (No relative fetch)
        if (typeof window === 'undefined') {
          throw new Error("Skipping proxy in Node environment");
        }

        console.debug(`[Gemini] Generating via secure proxy: ${modelConfig.model} (Task: ${taskType})`);

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

        const model = genAI.getGenerativeModel({
          model: modelConfig.model,
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature: modelConfig.temperature,
            candidateCount: 1,
            maxOutputTokens: modelConfig.maxOutputTokens
          }
        });

        let result;
        if (typeof safePrompt === 'string') {
          result = await model.generateContent(safePrompt);
        } else if (safePrompt.contents) {
          result = await model.generateContent(safePrompt.contents);
        } else {
          result = await model.generateContent(safePrompt);
        }

        const responseText = result.response.text();
        return JSON.parse(cleanJsonOutput(responseText));
      }
    }, 3, 1000);
  });
};

// Helper: Strip Markdown wrapping (```json ... ```)
const cleanJsonOutput = (text: string): string => {
  let clean = text.trim();
  // Remove markdown code blocks if present
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```(?:json)?/i, '').replace(/```$/, '');
  }
  return clean.trim();
};

/**
 * Enhanced embedding with LRU Caching
 */
export const generateEmbedding = async (text: string): Promise<number[] | null> => {
  // Optimization: Check cache first (saves ~200ms and API cost)
  const cached = embeddingCache.get(text);
  if (cached) return cached;

  try {
    // Optimization: Request coalescing for identical in-flight embeddings
    return await requestCoalescer.request(`embed:${text}`, async () => {
      // Use client SDK directly for now as proxy support for embeddings is not yet configured in vite.config.ts
      if (!genAI) {
        console.warn("[Gemini] Embedding disabled - No client API key.");
        return null;
      }

      const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
      const result = await model.embedContent(text);
      const embedding = result.embedding.values;

      // Cache for future use
      if (embedding) {
        embeddingCache.set(text, embedding);
      }

      return embedding;
    });
  } catch (e) {
    console.error("Embedding Error:", e);
    return null;
  }
};

// NEW: Seeded Prompt for Specific Dish Generation (Cheaper/Faster/Safer)
export const buildSeededRecipePrompt = (dishName: string, constraints: string): string => {
  const constraintSection = constraints
    ? `CRITICAL INSTRUCTIONS:\nSTRICTLY FOLLOW THESE CONSTRAINTS: ${constraints}\n(Any violation of diet/allergens is a critical failure.)\n\n`
    : '';

  return `${constraintSection}"${dishName}". Complete all schema fields.`;
};

/**
 * Generate a batch of new dishes
 */
// --- SPECULATIVE PRE-GENERATION ---

let preGeneratedDishes: Dish[] = [];
let isPrefetching = false;
const PREFETCH_THRESHOLD = 2;

export const prefetchDishes = async (userId: string, profile: UserProfile) => {
  // Don't prefetch if we have enough buffer or already working
  if (preGeneratedDishes.length >= 3 || isPrefetching) return;

  isPrefetching = true;
  console.log(`[Gemini Latency] Starting background pre-generation...`);
  try {
    const background = await generateNewDishes(3, profile, 'Explorer', userId, true);
    if (background.length > 0) {
      preGeneratedDishes.push(...background);
      console.log(`[Gemini Latency] Pre-fetched ${background.length} dishes. Buffer size: ${preGeneratedDishes.length}`);
    }
  } catch (e) {
    console.warn(`[Gemini Latency] Pre-fetch failed`, e);
  } finally {
    isPrefetching = false;
  }
};

/**
 * Generate a batch of new dishes
 */
export const generateNewDishes = async (
  count: number = 3,
  userProfile: UserProfile,
  context: VibeMode = 'Explorer',
  userId?: string,
  isBackground: boolean = false
): Promise<Dish[]> => {
  try {
    // 0. Check Pre-generated Buffer (if not a background call)
    if (!isBackground && preGeneratedDishes.length > 0) {
      const needed = count;
      const served = preGeneratedDishes.splice(0, needed);
      console.log(`[Gemini Latency] Instant Serve: ${served.length} dishes from pre-fetch buffer.`);

      // Trigger refill if low
      if (preGeneratedDishes.length < PREFETCH_THRESHOLD && userId) {
        prefetchDishes(userId, userProfile);
      }

      if (served.length >= count) return served;

      // If we need more, fallback to standard generation for remainder
      const remainder = count - served.length;
      console.log(`[Gemini Latency] Partial Hit. fetching ${remainder} more directly.`);
      const more = await generateNewDishes(remainder, userProfile, context, userId, true); // Recursive as background to skip buffer check
      return [...served, ...more];
    }

    // 1. Get user's dish history to prevent duplicates
    const { getShownDishNames, filterUnseenDishes } = await import('./userHistoryService');
    const shownDishNames = userId ? await getShownDishNames(userId) : [];

    // 2. Try Cache First (with Strict Filter + History Filter)
    const cachedRaw = await getCachedDishes(count * 3, userProfile); // Fetch 3x to have buffer after filtering
    const cached = filterUnseenDishes(cachedRaw, shownDishNames).slice(0, count);

    if (cached.length >= count) {
      console.log(`[Gemini Telemetry] Cache Hit - Served ${cached.length}/${count} dishes from cache`);
      return cached;
    }

    const constraints = buildConstraintPrompt(userProfile);
    const needed = count - cached.length;

    // --- 2.5 SEMANTIC CACHE LOOKASIDE (Pinecone) ---
    // If we still need dishes, try finding semantically similar ones in Vector DB
    // This is much faster (~200ms) than generating new ones (~2-3s)
    let vectorCached: Dish[] = [];
    if (needed > 0 && userId) {
      try {
        // Create a search query based on current context
        const queryText = `${constraints} ${userProfile.cuisines.join(' ')} ${contextManager.getCondensedMemory()?.summary || ''}`.trim();
        console.log(`[Gemini] Semantic Search Query: "${queryText.slice(0, 50)}..."`);

        const similar = await pineconeService.search(queryText, 'dishes', count * 2);

        // Map metadata back to Dish objects
        vectorCached = similar
          .filter(match => match.score && match.score > 0.85) // High confidence threshold
          .map(match => match.metadata as unknown as Dish) // Cast metadata back to Dish
          .filter(d => isValidDish(d) && !shownDishNames.includes(d.name)); // Validate & Dedup

        console.log(`[Gemini] Vector Cache Hit: Found ${vectorCached.length} similar dishes.`);
      } catch (e) {
        console.warn("[Gemini] Vector Search Failed:", e);
      }
    }

    const availableCache = [...cached, ...vectorCached];
    // Filter duplicates between standard cache and vector cache
    const uniqueAvailable = availableCache.filter((dish, index, self) =>
      index === self.findIndex((t) => (t.name === dish.name))
    ).slice(0, count);

    if (uniqueAvailable.length >= count) {
      console.log(`[Gemini Telemetry] Total Cache Hit - Served ${uniqueAvailable.length} dishes`);
      return uniqueAvailable;
    }

    // Update needed count after checking vector cache
    const generationNeeded = count - uniqueAvailable.length;
    // ------------------------------------------------
    const { getUserHistory, analyzeUserPreferences } = await import('./userHistoryService');

    let preferencePrompt = '';
    let kgCandidates: string[] = [];

    // A. Fetch Context
    if (userId) {
      // 1. Initialize Session Context
      if (!contextManager.currentSession) contextManager.initSession(userId);

      // 2. Get Optimization Context (Tiered)
      // Use 'feed' mode for minimal token usage
      preferencePrompt = contextManager.getOptimizedContext('feed');

      // 3. Fallback to full history if no condensed memory yet
      if (!preferencePrompt) {
        const history = await getUserHistory(userId);
        const summary = analyzeUserPreferences(history);
        if (summary) {
          preferencePrompt = getConstrainedContext(`\n\nUSER FEEDBACK:${summary}`, 200);
        }
      }

      // 4. Record this generation event
      // (Will be recorded in validation step ideally, but good to track intent here)

      const safeCandidates = knowledgeGraph.suggestDishes({
        dietaryPreference: userProfile.dietaryPreference,
        allergens: userProfile.allergens,
        cuisines: userProfile.cuisines
      });

      kgCandidates = safeCandidates
        .map(d => d.displayName)
        .filter(name => !shownDishNames.includes(name));
    }

    const exclusionList = shownDishNames.length > 0
      ? `\nAvoid: ${shownDishNames.slice(-10).join(', ')}`
      : '';

    const prompts: string[] = [];

    // 1. Add KG Seeded Prompts
    while (kgCandidates.length > 0 && prompts.length < generationNeeded) {
      const seed = kgCandidates.shift();
      if (seed) prompts.push(buildSeededRecipePrompt(seed, constraints) + preferencePrompt);
    }

    // 2. Fill remainder
    while (prompts.length < generationNeeded + 1) { // Add +1 buffer
      prompts.push(buildRecipePrompt(constraints, userProfile.cuisines) + preferencePrompt + exclusionList);
    }

    // 3. Optimized Parallel Execution
    // Split into chunks to balance load, although usually we just want them all fast.
    // For large batches (e.g. 5+), chunking helps. For 3, we just fire all.
    const CHUNK_SIZE = 2;
    const taskChunks = chunkArray(prompts, CHUNK_SIZE);

    const allResults = [];
    for (const chunk of taskChunks) {
      const chunkTasks = chunk.map(p => generateSingleDishWithRetry(p, 3)); // Lower retries for speed
      const chunkResults = await Promise.all(chunkTasks);
      allResults.push(...chunkResults);
      // If we have enough valid results, stop early (optimization)
      const validCount = allResults.filter(r => r !== null).length;
      if (validCount >= generationNeeded) break;
    }

    const newDishes: Dish[] = allResults
      .filter(r => r !== null)
      .map((d: any) => {
        const dish: Dish = {
          id: d.name.replace(/\s+/g, '-').toLowerCase() + '-' + Date.now() + Math.random(),
          name: d.name,
          localName: d.localName,
          description: d.description,
          cuisine: d.cuisine,
          type: d.type,
          ingredients: [],
          instructions: [],
          allergens: [],
          prepTime: Math.floor(Math.random() * 30) + 15,
          macros: {
            calories: d.macros?.calories || 300 + Math.floor(Math.random() * 400),
            protein: 0, carbs: 0, fat: 0
          },
          image: d.image || null,
          tags: d.tags || [],
          healthTags: d.healthTags || [],
          matchScore: 85 + Math.floor(Math.random() * 10),
          generatedAt: Date.now(),
          flavorProfile: d.flavorProfile || 'Balanced',
          textureProfile: d.textureProfile || 'Soft',
          glycemicIndex: d.glycemicIndex || 'Medium'
        };
        return dish;
      });

    // Dedup 
    const uniqueBatch = newDishes.filter((dish, index, self) =>
      index === self.findIndex((t) => (t.name === dish.name))
    );

    // --- UPSERT NEW DISHES TO VECTOR DB ---
    // Make them available for future semantic searches
    if (uniqueBatch.length > 0) {
      // Run in background to not block response
      (async () => {
        try {
          const vectorRecords = uniqueBatch.map(d => {
            // Sanitize metadata for Pinecone (only supports strings, numbers, booleans, list of strings)
            const metadata: any = { ...d, _type: 'dish' };

            // Handle Nulls
            metadata.image = d.image || '';
            metadata.localName = d.localName || '';

            // Serialize Objects/Arrays of Objects
            if (d.macros) metadata.macros = JSON.stringify(d.macros);
            if (d.ingredients) metadata.ingredients = JSON.stringify(d.ingredients);
            if (d.instructions) metadata.instructions = JSON.stringify(d.instructions);
            // tags and healthTags are arrays of strings, which Pinecone supports naturally

            return {
              id: d.id,
              text: `${d.name} ${d.description} ${d.cuisine} ${d.tags?.join(' ')}`,
              metadata
            };
          });

          await pineconeService.upsert(vectorRecords, 'dishes');
          console.log(`[Gemini] Upserted ${uniqueBatch.length} new dishes to Vector DB.`);
        } catch (e) {
          console.error("[Gemini] Vector Upsert Failed:", e);
        }
      })();
    }
    // --------------------------------------

    return [...uniqueAvailable, ...uniqueBatch].slice(0, count);
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

    // --- VECTOR OPTIMIZATION START ---
    // 1. Get User Persona for Personalization
    const personaContext = contextManager.getCondensedMemory();
    const personaHint = personaContext?.summary
      ? `User Persona: "${personaContext.summary}". Adjust flavors/difficulty accordingly.`
      : '';

    // 2. Fetch Similar Recipes from Vector DB to guide style
    let styleHint = '';
    try {
      const similar = await pineconeService.search(`${dish.name} ${dish.cuisine}`, 'dishes', 2);
      if (similar.length > 0) {
        const examples = similar.map(m => (m.metadata as any)?.name).filter(Boolean).join(', ');
        styleHint = examples ? `Reference style from: ${examples}.` : '';
      }
    } catch (vecErr) {
      console.warn("[enrichDishDetails] Vector search failed:", vecErr);
    }
    // --- VECTOR OPTIMIZATION END ---

    const prompt = `Create personalized recipe for: ${dish.name} (${dish.description}). 
    ${constraints}. ${safetyNote}
    ${personaHint}
    ${styleHint}
    Return ingredients (with qty/category) and instructions. 
    Use minimal tokens.`;

    const details = await secureGenerate(prompt, FULL_RECIPE_SCHEMA, 'enrich');

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

    // SECURITY FIX: Sanitize user input to prevent prompt injection
    const sanitizedInstruction = customInstruction
      ? customInstruction
        .replace(/[{}"'`\\]/g, '') // Remove braces, quotes, escapes
        .replace(/\n/g, ' ')       // Remove newlines
        .slice(0, 200)             // Limit length
      : '';
    const extra = sanitizedInstruction ? `Note: ${sanitizedInstruction}` : '';

    // --- VECTOR OPTIMIZATION: Inject User Persona ---
    const personaContext = contextManager.getCondensedMemory();
    const personaHint = personaContext?.summary
      ? `User goal: ${personaContext.summary}.`
      : '';
    // -------------------------------------------------

    let contents: any;

    if (type === 'text') {
      contents = `Recipe for: "${input}". ${constraints} ${personaHint} ${extra}. Return JSON.`;
    } else if (type === 'pantry' && typeof input === 'string') {
      contents = `Ingredients: ${input}. ${constraints} ${personaHint} ${extra}. Minimal shopping. Return JSON.`;
    } else if (type === 'image' && input instanceof File) {
      const base64 = await fileToBase64(input);
      contents = {
        parts: [{ inlineData: { mimeType: input.type, data: base64 } }, { text: `Analyze dish. ${personaHint} Return recipe JSON.` }]
      };
    } else {
      return null; // Video not supported in frugal mode yet
    }

    const dishData = await secureGenerate(contents, LIGHT_DISH_SCHEMA, 'feed');

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

    // Extract Optimized Knowledge Graph Fragment & Context
    const kgContext = userProfile
      ? knowledgeGraph.getRelevantSafetyContext(userProfile.allergens, userProfile.conditions)
      : "No constraints provided.";

    // Add session context (e.g. if they just searched for "low carb")
    const sessionContext = contextManager.getOptimizedContext('cook');

    // --- VECTOR OPTIMIZATION: Fetch Prep Tips for Dishes ---
    let vectorPrepTips = '';
    try {
      const dishNames = relevantDays
        .flatMap(d => [d.lunch?.name, d.dinner?.name])
        .filter(Boolean) as string[];

      if (dishNames.length > 0) {
        const prepQuery = dishNames.slice(0, 3).join(' ') + ' prep instructions soaking marinating';
        const prepResults = await pineconeService.search(prepQuery, 'dishes', 3);
        const tips = prepResults
          .map(m => (m.metadata as any)?.text)
          .filter(Boolean)
          .slice(0, 2);
        if (tips.length > 0) {
          vectorPrepTips = `\nPrep Tips from Database:\n${tips.join('\n')}`;
        }
      }
    } catch (vecErr) {
      console.warn("[generateCookInstructions] Vector prep search failed:", vecErr);
    }
    // --------------------------------------------------------

    // Truncate menu summary if too long (unlikely but safe)
    const cleanMenu = menuSummary.slice(0, 1000);

    const prompt = `Create a WhatsApp message for the cook.
    DO NOT include any greeting (no "Namaste", "Sun", "Hey", etc). Start directly with the menu/instructions.

    INPUT DATA:
    Menu: ${cleanMenu}
    User Constraints: ${safetyWarning}
    Recent Context: ${sessionContext}
    Knowledge Graph Safety Rules:
    ${kgContext}
    ${vectorPrepTips}

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

    // Use gemini-3-flash-preview (State of the Art Speed & Reasoning)
    const result = await secureGenerate(prompt, COT_SCHEMA, 'cook');

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

EXTRACT (as JSON):
{
  "allergies": ["list of food allergies"],
  "conditions": ["list of medical conditions"],
  "avoid_keywords": ["general foods/categories to avoid based on report"],
  "notes": "any other recommendations"
}

If not a health report: return { "error": "Unable to analyze" }`;

    // Step 1: Get structured extraction from LLM
    const HEALTH_SCHEMA = {
      type: Type.OBJECT,
      properties: {
        allergies: { type: Type.ARRAY, items: { type: Type.STRING } },
        conditions: { type: Type.ARRAY, items: { type: Type.STRING } },
        avoid_keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
        notes: { type: Type.STRING },
        error: { type: Type.STRING }
      }
    };

    const extraction = await secureGenerate({
      contents: [{
        parts: [
          { inlineData: { mimeType: file.type, data: base64 } },
          { text: prompt }
        ]
      }]
    }, HEALTH_SCHEMA, 'analyze');

    if (extraction?.error) {
      return "Unable to analyze report. Please try uploading a clearer image.";
    }

    // --- VECTOR RAG STEP: Map extracted conditions to specific ingredients ---
    let ragMappedIngredients: string[] = [];
    try {
      const conditionsToMap = [
        ...(extraction?.conditions || []),
        ...(extraction?.avoid_keywords || [])
      ];

      if (conditionsToMap.length > 0) {
        const ragQuery = conditionsToMap.join(' ') + ' ingredients avoid diet restrictions';
        console.log(`[analyzeHealthReport] RAG Query: "${ragQuery}"`);

        const ragResults = await pineconeService.search(ragQuery, 'knowledge_graph', 5);

        // Extract ingredient names from KG that match conditions
        ragMappedIngredients = ragResults
          .filter(m => m.score && m.score > 0.7)
          .map(m => (m.metadata as any)?.name || (m.metadata as any)?.text)
          .filter(Boolean);

        console.log(`[analyzeHealthReport] RAG Mapped ${ragMappedIngredients.length} ingredients:`, ragMappedIngredients);
      }
    } catch (ragErr) {
      console.warn("[analyzeHealthReport] RAG mapping failed:", ragErr);
    }
    // -------------------------------------------------------------------------

    // Format final output combining extraction + RAG mapping
    const allergiesStr = extraction?.allergies?.length > 0
      ? `- Allergies: ${extraction.allergies.join(', ')}`
      : '';
    const conditionsStr = extraction?.conditions?.length > 0
      ? `- Conditions: ${extraction.conditions.join(', ')}`
      : '';
    const avoidStr = extraction?.avoid_keywords?.length > 0
      ? `- Avoid: ${extraction.avoid_keywords.join(', ')}`
      : '';
    const ragStr = ragMappedIngredients.length > 0
      ? `- Specific Ingredients to Exclude (Auto-Mapped): ${ragMappedIngredients.join(', ')}`
      : '';
    const notesStr = extraction?.notes
      ? `- Notes: ${extraction.notes}`
      : '';

    const finalOutput = [allergiesStr, conditionsStr, avoidStr, ragStr, notesStr]
      .filter(Boolean)
      .join('\n');

    return finalOutput || "Unable to analyze report. Please try uploading a clearer image.";
  } catch (error) {
    console.error("Health Report Analysis Error:", error);
    return "Error analyzing report. Please try again.";
  }
};
