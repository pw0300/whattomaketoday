
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Dish, Allergen, VibeMode, ImageSize, Cuisine, DietaryPreference, UserProfile, DayPlan } from '../types';
import { db } from './firebaseService';
import { collection, addDoc, getDocs, query, where, limit, Timestamp } from 'firebase/firestore';

const getApiKey = () => import.meta.env.VITE_GEMINI_API_KEY || 'MISSING_KEY';
const ai = new GoogleGenAI({ apiKey: getApiKey() });

// --- CACHING LAYER ---
const CACHE_COLLECTION = 'cached_dishes';

export const cacheGeneratedDishes = async (dishes: Dish[]) => {
  if (!db) return;
  try {
    const promises = dishes.map(dish => {
      // Flatten for indexing
      const cacheable = {
        ...dish,
        createdAt: Timestamp.now(),
        // Index health tags into the search array for broader matching
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
    // Simple Strategy: Fetch dishes matching diet/cuisine preference
    // Note: Firestore 'array-contains-any' is limited to 10 items

    let q = query(ref, limit(20)); // Fetch pool

    // Improved Query could go here (e.g. where('macros.calories', '<', target))
    // but for now we fetch a pool and filter in memory for speed & variety

    const snapshot = await getDocs(q);
    const pool = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Dish));

    // Local Filter
    const valid = pool.filter(d => {
      // Must match diet
      if (profile.dietaryPreference !== 'Any' && !d.tags?.includes(profile.dietaryPreference)) return false;

      // Must NOT have allergens
      if (d.allergens?.some(a => profile.allergens.includes(a))) return false;

      // New: Must match Health Conditions (optimistic matching)
      // If user has 'Diabetes', prioritize 'Diabetic-Friendly' or 'Low-Carb'
      if (profile.conditions.length > 0) {
        // Strict Check: Drop if explicitly bad (e.g. High Sugar for Diabetic) - implementing basic safe-guard
        // For now, we prefer dishes that HAVE the tag or are neutral.
        // Ideally, we'd check for CONFLICTS, but we'll use inclusion for relevance.
        const healthRelevant = d.healthTags?.some(t =>
          (profile.conditions.includes('Diabetes' as any) && (t === 'Diabetic-Friendly' || t === 'Low-Carb' || t === 'Keto')) ||
          (profile.conditions.includes('PCOS' as any) && (t === 'PCOS-Friendly' || t === 'High-Protein')) ||
          (profile.conditions.includes('Hypertension' as any) && (t === 'Heart-Healthy'))
        );
        // If a specific condition exists, boost relevance. 
        // For strict filtering, uncomment: if (!healthRelevant) return false;
      }
      return true;
    });

    // Shuffle and slice
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

const addWavHeader = (pcmData: Uint8Array, sampleRate: number = 24000, numChannels: number = 1): ArrayBuffer => {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const dataSize = pcmData.length;
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  const wavFile = new Uint8Array(44 + dataSize);
  wavFile.set(new Uint8Array(header), 0);
  wavFile.set(pcmData, 44);
  return wavFile.buffer;
};

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
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    healthTags: {
      type: Type.ARRAY,
      items: { type: Type.STRING, enum: ['Diabetic-Friendly', 'PCOS-Friendly', 'Heart-Healthy', 'High-Protein', 'Low-Carb', 'Keto', 'Gluten-Free'] }
    },
    chefAdvice: { type: Type.STRING }
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

// Helper to call our own Serverless Backend (Vercel)
const secureGenerate = async (prompt: string, schema: any, modelName: string = "gemini-2.5-flash-preview") => {
  try {
    // 1. Try Secure Proxy
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, schema, modelName })
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      // Fallthrough
    }

    // 2. Fallback: Direct Client Call (For Dev convenience if Proxy isn't running)
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      console.warn("Using Client-Side API Key (Fallback). Deploy to Vercel for full security.");
      const client = new GoogleGenAI({ apiKey });

      const response = await client.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });

      if (response.text) {
        return JSON.parse(response.text);
      }
    }

    throw new Error("No API connection method worked (Proxy failed + No local key).");

  } catch (error) {
    console.error("Secure Generate Error:", error);
    return null;
  }
};

export const generateNewDishes = async (
  count: number,
  userProfile: UserProfile,
  context: VibeMode = 'Explorer'
): Promise<Dish[]> => {
  try {
    // 1. Try Cache First (Optimization)
    const cached = await getCachedDishes(count, userProfile);
    if (cached.length >= count) {
      console.log(`[Gemini] Served ${cached.length} from Cache!`);
      return cached;
    }

    const needed = count - cached.length;
    console.log(`[Gemini] Cache Miss. Fetching ${needed} new dishes from API...`);

    // 2. API Generation if Cache exhausted
    const prompt = `Generate ${needed} meal ideas. Mode: ${context}. 
    ${buildConstraintPrompt(userProfile)}
    Cuisines: ${userProfile.cuisines.join(', ') || 'Any'}.
    Important: Categorize with healthTags (e.g. Diabetic-Friendly, Keto, Heart-Healthy) based on ingredients.
    Return JSON. For localName, use native name.`;

    const generated = await secureGenerate(prompt, { type: Type.ARRAY, items: LIGHT_DISH_SCHEMA }, 'gemini-2.5-flash-preview');

    if (!generated || !Array.isArray(generated)) return cached; // Return whatever we found in cache

    const newDishes = generated.map((d: any) => ({
      ...d,
      id: crypto.randomUUID(),
      ingredients: [], // Lazy load
      instructions: [], // Lazy load
      nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      isStaple: false
    }));

    // 3. Cache the new results for future users (Async)
    cacheGeneratedDishes(newDishes);

    return [...cached, ...newDishes];
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return [];
  }
};


export const enrichDishDetails = async (dish: Dish): Promise<Dish> => {
  try {
    const prompt = `Create recipe for: ${dish.name} (${dish.description}). 
    Return ingredients (with qty/category) and instructions. 
    Use minimal tokens.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ingredients: DISH_SCHEMA.properties.ingredients,
            instructions: DISH_SCHEMA.properties.instructions
          }
        }
      }
    });

    if (response.text) {
      const details = JSON.parse(response.text);
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
    let contents: any;
    let model = 'gemini-2.5-flash-preview'; // Default to Flash for cost

    const constraints = userProfile ? buildConstraintPrompt(userProfile) : '';
    const extra = customInstruction ? `Note: "${customInstruction}"` : '';

    if (type === 'text') {
      contents = `Recipe for: "${input}". ${constraints} ${extra}. Return JSON.`;
    } else if (type === 'pantry' && typeof input === 'string') {
      contents = `Ingredients: ${input}. ${constraints} ${extra}. Minimal shopping. Return JSON.`;
    } else if (type === 'image' && input instanceof File) {
      const base64 = await fileToBase64(input);
      contents = {
        parts: [{ inlineData: { mimeType: input.type, data: base64 } }, { text: "Analyze dish. Return recipe JSON." }]
      };
    } else if (type === 'video' && input instanceof File) {
      model = 'gemini-3-flash-preview'; // Video might need newer Flash
      const base64 = await fileToBase64(input);
      contents = {
        parts: [{ inlineData: { mimeType: input.type, data: base64 } }, { text: "Analyze video, identify dish. Return JSON." }]
      };
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: DISH_SCHEMA
      }
    });

    if (!response.text) return null;
    const dishData = JSON.parse(response.text.replace(/```json/g, '').replace(/```/g, '').trim());

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

export const generateCookAudio = async (plan: DayPlan[]): Promise<string | null> => {
  // Filter for today/tomorrow or just send the whole passed array
  // For "Aaj Kya Banau", we'll assume the input 'plan' is the relevant set of meals

  const ctx = plan.map(d => ({
    day: d.day,
    lunch: d.lunch ? `${d.lunch.name} (${d.lunch.primaryIngredient})` : 'Kuch nahi',
    dinner: d.dinner ? `${d.dinner.name} (${d.dinner.primaryIngredient})` : 'Kuch nahi',
    note: d.lunch?.userNotes || d.dinner?.userNotes || ''
  }));

  if (ctx.length === 0) return null;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview", // Note: TTS model name varies, assuming standard or specific endpoint
      contents: [{
        parts: [{
          text: `Role: Head Chef (Indian). Speak in HINGLISH (Mix of Hindi/English). 
            Task: Tell the cook what to make. 
            Data: ${JSON.stringify(ctx)}. 
            Style: Authoritative but polite. "Aaj lunch mein [Dish] banana hai..."`
        }]
      }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
      },
    });

    const rawBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (rawBase64) {
      // Convert to WAV/Audio Buffer
      // Note: The raw data from Gemini is often PCM. We apply the WAV header.
      const binaryString = atob(rawBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      const wavBuffer = addWavHeader(bytes, 24000, 1);

      let binary = '';
      const wavBytes = new Uint8Array(wavBuffer);
      for (let i = 0; i < wavBytes.byteLength; i++) binary += String.fromCharCode(wavBytes[i]);
      return btoa(binary);
    }
    return null;
  } catch (e) {
    console.error("TTS Error", e);
    return null;
  }
};

export const analyzeHealthReport = async (file: File): Promise<string> => {
  try {
    const base64 = await fileToBase64(file);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview', // Switch to Flash
      contents: {
        parts: [
          { inlineData: { mimeType: file.type, data: base64 } },
          { text: "Extract dietary rules. Avoid & Prioritize lists. Max 50 words." }
        ]
      }
    });
    return response.text || "Report analyzed.";
  } catch (e) {
    return "Analysis failed.";
  }
};
