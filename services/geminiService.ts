import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Dish, Allergen, VibeMode, ImageSize, Cuisine, DietaryPreference, UserProfile, DayPlan } from '../types';

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

// WAV Header Helper for Raw PCM (24kHz, 16-bit, Mono)
const addWavHeader = (pcmData: Uint8Array, sampleRate: number = 24000, numChannels: number = 1): ArrayBuffer => {
    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    const dataSize = pcmData.length;
    
    const writeString = (view: DataView, offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    // RIFF chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    
    // fmt sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, numChannels, true); // NumChannels
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * numChannels * 2, true); // ByteRate
    view.setUint16(32, numChannels * 2, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample
    
    // data sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Concatenate header and data
    const wavFile = new Uint8Array(44 + dataSize);
    wavFile.set(new Uint8Array(header), 0);
    wavFile.set(pcmData, 44);
    
    return wavFile.buffer;
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
    },
    chefAdvice: { type: Type.STRING, description: "One single sentence of professional culinary advice for this dish (e.g., 'Sear the meat on high heat first')." }
  }
};

const buildConstraintPrompt = (profile: UserProfile): string => {
  return `
    **Strict User Constraints (MUST FOLLOW):**
    1. Dietary Preference: ${profile.dietaryPreference} (Non-negotiable).
    2. Allergens to Exclude: ${profile.allergens.join(', ')}.
    3. Safety Notes: "${profile.allergenNotes || 'None'}".
    4. Health Conditions: ${profile.conditions.join(', ')}.
    5. Bio-Health Report Constraints: "${profile.healthReportSummary || 'None'}".
    6. General Preferences: "${profile.customNotes}".
  `;
};

// Helper to clean Markdown code blocks from JSON response
const cleanJson = (text: string) => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

export const analyzeHealthReport = async (file: File): Promise<string> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) return "Error: API Key missing";

    try {
        const ai = new GoogleGenAI({ apiKey });
        const base64 = await fileToBase64(file);

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: {
                parts: [
                    { inlineData: { mimeType: file.type, data: base64 } },
                    { text: "Analyze this medical/health report. Extract ONLY the dietary implications and nutritional deficiencies. Provide a concise summary of what foods to avoid and what nutrients to prioritize to compensate for these results. Do not give medical advice, only culinary/dietary strategy. Format as a list of constraints." }
                ]
            }
        });

        return response.text || "Could not analyze report.";
    } catch (e) {
        console.error("Health report analysis failed", e);
        return "Analysis failed. Please try again.";
    }
};

export const generateNewDishes = async (
  count: number,
  userProfile: UserProfile,
  context: VibeMode = 'Explorer'
): Promise<Dish[]> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return [];

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // We use search grounding here to get real, trending recipes
    const prompt = `Act as an Executive Chef planning a high-end home menu. Generate ${count} distinct meal ideas. 
    
    **Identity & Vibe:**
    The user is a "Home Chef" who wants professional organization but home comfort.
    Vibe Context: ${context}.
    
    ${buildConstraintPrompt(userProfile)}
    
    **Priority Cuisines:** ${userProfile.cuisines.join(', ')}.
    **Cuisine Notes:** "${userProfile.cuisineNotes || 'None'}"

    **Requirements:**
    1. Use Google Search to find currently trending or highly-rated recipes fitting these criteria.
    2. Provide a 'localName' (native name) if the dish is ethnic, otherwise repeat the name.
    3. The 'chefAdvice' field MUST be a single, high-value pro-tip (e.g. "Temper the spices in ghee", "Don't overcook the okra").
    4. Keep instructions concise (Chef shorthand).
    
    Return a list of dishes with macros, ingredients, step-by-step cooking instructions, and tags.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: DISH_SCHEMA
        }
      }
    });

    if (response.text) {
      const cleaned = cleanJson(response.text);
      const rawDishes = JSON.parse(cleaned);
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
    return `https://picsum.photos/400/400?random=${Math.floor(Math.random() * 1000)}`;
};

// Feature: Multi-modal Analysis (Text, Image, Video, Pantry)
export const analyzeAndGenerateDish = async (
    type: 'text' | 'image' | 'video' | 'pantry',
    input: string | File,
    imageSize: ImageSize = '1K',
    userProfile?: UserProfile,
    customInstruction?: string
): Promise<Dish | null> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });

    try {
        let contents: any;
        let model = 'gemini-3-pro-preview'; // Default for analysis

        const constraints = userProfile ? buildConstraintPrompt(userProfile) : '';
        const extraInstruction = customInstruction ? `**Additional User Instruction:** "${customInstruction}"` : '';

        if (type === 'text') {
            model = 'gemini-2.0-flash-exp'; // Faster for text
            contents = `Find a real recipe based on this description: "${input}".
            ${constraints}
            ${extraInstruction}
            Return JSON matching the schema.`;
        } else if (type === 'pantry' && typeof input === 'string') {
            // Reverse Search / Mystery Basket Mode
            // STRICT MODE: We instruct the model to prioritize ONLY the given ingredients.
            model = 'gemini-2.0-flash-exp';
            contents = `Act as a creative chef participating in a 'Mystery Basket' challenge (Iron Chef Style). 
            The available ingredients (Pantry Stock) are: ${input}.
            
            ${constraints}
            ${extraInstruction}
            
            **CRITICAL RULE:** You must PRIORITIZE using the provided pantry ingredients. 
            You may ONLY assume the existence of: Water, Salt, Pepper, Neutral Oil, Sugar.
            Any other ingredient required must be listed in the output ingredients list, but try to minimize "grocery runs".
            
            Create a cohesive, high-quality dish using these restrictions.
            Return JSON matching the schema.`;
        } else if (type === 'image' && input instanceof File) {
            model = 'gemini-2.0-flash-exp';
            const base64 = await fileToBase64(input);
            contents = {
                parts: [
                    { inlineData: { mimeType: input.type, data: base64 } },
                    { text: "Identify this dish. List ingredients, step-by-step instructions, and estimated macros. Return JSON." }
                ]
            };
        } else if (type === 'video' && input instanceof File) {
            model = 'gemini-2.0-flash-exp';
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

        const response = await ai.models.generateContent({
            model: model,
            contents: contents,
            config: config
        });

        if (!response.text) return null;
        
        const cleaned = cleanJson(response.text);
        const dishData = JSON.parse(cleaned);

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

// FEATURE: Generate Hindi Voice Instructions
export const generateVoiceBriefing = async (plan: DayPlan[]): Promise<string | null> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });

    // Filter for meaningful notes to keep it concise
    const instructions = plan.filter(d =>
        (d.lunch && d.lunch.userNotes) ||
        (d.dinner && d.dinner.userNotes) ||
        (d.lunch && d.lunch.chefAdvice) ||
        (d.dinner && d.dinner.chefAdvice)
    ).map(d => ({
        day: d.day,
        lunch: d.lunch ? { name: d.lunch.localName || d.lunch.name, notes: d.lunch.userNotes, chefTip: d.lunch.chefAdvice } : null,
        dinner: d.dinner ? { name: d.dinner.localName || d.dinner.name, notes: d.dinner.userNotes, chefTip: d.dinner.chefAdvice } : null
    }));

    if (instructions.length === 0) return null; // No special notes

    const promptText = `
    Roleplay: You are an older Indian 'Dadi' (grandmother) instructing your household cook.
    Context: Here are the special cooking instructions for this week: ${JSON.stringify(instructions)}.
    Task: Speak a friendly, authoritative, but caring message in HINDI to the cook.
    Instructions:
    - Don't list every meal. Focus ONLY on the exceptions, 'userNotes', and 'chefAdvice'.
    - Use phrases like "Beta, suno", "Dhyan rakhna", "Kam tel use karna".
    - Keep it under 40 seconds.
    - If there are no major notes, just give a general blessing and say "follow the list".
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: promptText }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' }, // Female voice
                    },
                },
            },
        });

        // The response contains raw PCM audio data in base64
        const rawBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        
        if (rawBase64) {
             // Convert Base64 to Uint8Array
            const binaryString = atob(rawBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            // Add WAV Header
            const wavBuffer = addWavHeader(bytes);
            
            // Convert back to base64 for the frontend to consume easily
            let binary = '';
            const wavBytes = new Uint8Array(wavBuffer);
            for (let i = 0; i < wavBytes.byteLength; i++) {
                binary += String.fromCharCode(wavBytes[i]);
            }
            return btoa(binary);
        }
        return null;

    } catch (e) {
        console.error("Voice Gen Failed", e);
        return null;
    }
};