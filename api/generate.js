
// api/generate.js
// Vercel Serverless Function
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // BOUNTY FIX: Basic Payload Security
    const bodySize = JSON.stringify(req.body).length;
    if (bodySize > 500000) { // 500KB limit
        return res.status(413).json({ error: 'Payload too large' });
    }

    const { prompt, contents, schema, modelName } = req.body;

    // STRICT SECURITY: Only use server-side keys. 
    // Do not allow VITE_ prefixed keys to be used here to encourage separation.
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Server misconfiguration: Missing API Key' });
    }

    try {
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

        // Sanitize: Strip Markdown code blocks if present (Gemini Flash habit)
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        // Parse JSON to ensure validity before sending
        const json = JSON.parse(text);
        return res.status(200).json(json);

    } catch (error) {
        console.error("Gemini API Error:", error);
        return res.status(500).json({ error: 'Failed to generate content', details: error.message });
    }
}
