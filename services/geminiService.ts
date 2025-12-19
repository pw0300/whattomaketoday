
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Dish, Allergen, VibeMode, ImageSize, Cuisine, DietaryPreference, UserProfile, DayPlan } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    chefAdvice: { type: Type.STRING }
  }
};

const buildConstraintPrompt = (profile: UserProfile): string => {
  return `
    **CONSTRAINTS:**
    Dietary: ${profile.dietaryPreference}. Allergens: ${profile.allergens.join(', ')}.
    Notes: "${profile.allergenNotes || 'None'}". Health: ${profile.conditions.join(', ')}.
    Summary: "${profile.healthReportSummary || 'None'}".
  `;
};

export const generateNewDishes = async (
  count: number, 
  userProfile: UserProfile,
  context: VibeMode = 'Explorer'
): Promise<Dish[]> => {
  try {
    const prompt = `Generate ${count} meal ideas. Mode: ${context}. 
    ${buildConstraintPrompt(userProfile)}
    Cuisines: ${userProfile.cuisines.join(', ')}.
    Return high-fidelity JSON. For localName, use native language name if applicable.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Speed over logic for deck filling
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
      const rawDishes = JSON.parse(response.text.replace(/```json/g, '').replace(/```/g, '').trim());
      return rawDishes.map((d: any, idx: number) => ({
        ...d,
        id: `ai_${Date.now()}_${idx}`,
        image: `https://picsum.photos/400/400?random=${Math.floor(Math.random() * 1000)}`,
        allergens: [] 
      }));
    }
    return [];
  } catch (error) {
    console.error("Gemini Error:", error);
    return [];
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
        let model = 'gemini-3-pro-preview'; // Pro for high-logic analysis

        const constraints = userProfile ? buildConstraintPrompt(userProfile) : '';
        const extra = customInstruction ? `**User Note:** "${customInstruction}"` : '';

        if (type === 'text') {
            contents = `Find real recipe for: "${input}". ${constraints} ${extra}. Return JSON.`;
        } else if (type === 'pantry' && typeof input === 'string') {
            contents = `MYSTERY BASKET: Use these ingredients: ${input}. ${constraints} ${extra}. Minimize extra shopping. Return JSON.`;
        } else if (type === 'image' && input instanceof File) {
            const base64 = await fileToBase64(input);
            contents = {
                parts: [{ inlineData: { mimeType: input.type, data: base64 } }, { text: "Analyze dish and return recipe JSON." }]
            };
        } else if (type === 'video' && input instanceof File) {
            const base64 = await fileToBase64(input);
            contents = {
                parts: [{ inlineData: { mimeType: input.type, data: base64 } }, { text: "Analyze video, identify dish, steps, macros. Return JSON." }]
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

export const generateVoiceBriefing = async (plan: DayPlan[]): Promise<string | null> => {
    const instructions = plan.filter(d => (d.lunch?.userNotes || d.dinner?.userNotes)).map(d => ({
        day: d.day,
        lunch: d.lunch?.name,
        notes: d.lunch?.userNotes || d.dinner?.userNotes
    }));

    if (instructions.length === 0) return null;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `You are a caring Indian grandmother (Dadi). Briefly tell the cook the special notes for the week in HINDI. Keep it warm but firm. ${JSON.stringify(instructions)}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
                },
            },
        });

        const rawBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (rawBase64) {
            const binaryString = atob(rawBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
            const wavBuffer = addWavHeader(bytes);
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
            model: 'gemini-3-pro-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType: file.type, data: base64 } },
                    { text: "Analyze health report. Extract dietary implications only. Concise list of foods to avoid and nutrients to prioritize." }
                ]
            }
        });
        return response.text || "Report analyzed.";
    } catch (e) {
        return "Analysis failed.";
    }
};
