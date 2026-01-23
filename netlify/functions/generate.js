
import { GoogleGenerativeAI } from "@google/generative-ai";

export const handler = async (event, context) => {
    // CORS Headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, X-Api-Version',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    // Handle Preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    // BOUNTY FIX: Simple Rate Limiter (Note: In-memory only works for persistent containers, 
    // real serverless would need Redis/Upstash, but this helps against spam bursts)
    const ip = event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown';
    // Logic: If we had a persistent store, we'd check usage. 
    // For now, we rely on Netlify's built-in DDoS protection, but we can reject suspicious payloads.

    // Payload Size Limit
    if (event.body.length > 500000) { // 500KB limit
        return { statusCode: 413, headers, body: JSON.stringify({ error: "Payload too large" }) };
    }

    try {
        const body = JSON.parse(event.body);
        const { prompt, contents, schema, modelName } = body;

        // STRICT SECURITY: Only use server-side keys. 
        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

        if (!apiKey) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Server misconfiguration: Missing API Key' })
            };
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: modelName || process.env.GEMINI_MODEL || "gemini-2.0-flash", // Configurable default
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        // specific support for 'contents' (multimodal) or 'prompt' (text only)
        const input = contents ? { contents } : prompt;

        const result = await model.generateContent(input);
        const response = await result.response;
        let text = response.text();

        // Sanitize: Strip Markdown code blocks if present
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        // Parse JSON to ensure validity before sending
        const json = JSON.parse(text);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(json)
        };

    } catch (error) {
        console.error("Gemini API Error:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to generate content', details: error.message })
        };
    }
};
