import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import cors from "cors";

// Initialize Admin SDK FIRST (before importing scheduler modules that use it)
admin.initializeApp();

// Now safe to import modules that use admin.firestore()
import { analyzeNewIngredients } from "./scheduler/ingredientEnrichment";
import { analyzeTrends } from "./scheduler/trendAnalysis";

// CORS handler
const corsHandler = cors({ origin: true });

// Configuration
// Note: For production, prefer using: firebase functions:config:set gemini.key="YOUR_KEY"
// Then access via functions.config().gemini.key
// Fallback to process.env for local .env support
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

export const generate = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        // Enforce POST
        if (req.method !== 'POST') {
            res.status(405).send('Method Not Allowed');
            return;
        }

        try {
            const { prompt, contents, schema, modelName } = req.body;

            // Security Check
            // You can replace this with functions.config().gemini.key
            const apiKey = GEMINI_API_KEY || functions.config().gemini?.key;

            if (!apiKey) {
                console.error("Missing GEMINI_API_KEY configuration");
                res.status(500).json({ error: 'Server misconfiguration: Missing API Key' });
                return;
            }

            console.log(`[Generate] Received request for model: ${modelName || "default"}`);

            // Initialize Gemini
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
                model: modelName || process.env.GEMINI_MODEL || functions.config().gemini?.model || "gemini-2.0-flash", // Configurable default
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: schema
                }
            });

            // Prepare Input
            const input = contents ? { contents } : prompt;

            // Generate
            const result = await model.generateContent(input);
            const response = await result.response;
            let text = response.text();

            // Sanitize
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();

            console.log(`[Generate] Success. Response length: ${text.length}`);
            console.log(`[Generate] Output snippet: ${text.substring(0, 100)}`);

            // Return JSON
            res.json(JSON.parse(text));

        } catch (error: any) {
            console.error("[Generate] Error:", error);
            res.status(500).json({
                error: 'Failed to generate content',
                details: error.message
            });
        }
    });
});


export const vectorSearch = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        if (req.method !== 'POST') {
            res.status(405).send('Method Not Allowed');
            return;
        }

        try {
            const { query, topK = 5, namespace = 'default' } = req.body;

            // 1. Secrets
            const geminiKey = process.env.GEMINI_API_KEY || functions.config().gemini?.key;
            const pineconeKey = process.env.PINECONE_API_KEY || functions.config().pinecone?.key; // Set via: firebase functions:config:set pinecone.key="..."

            if (!geminiKey || !pineconeKey) {
                console.error("Missing Keys");
                res.status(500).json({ error: 'Server Config Error: Missing Keys' });
                return;
            }

            // 2. Generate Embedding (Gemini)
            const genAI = new GoogleGenerativeAI(geminiKey);
            const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
            const result = await model.embedContent(query);
            const embedding = result.embedding.values;

            if (!embedding) {
                res.status(500).json({ error: 'Failed to generate embedding' });
                return;
            }

            // 3. Query Pinecone (Node SDK)
            // Dynamic import not needed here as we are in Node env, but standard import is fine
            const { Pinecone } = require('@pinecone-database/pinecone');
            const pc = new Pinecone({ apiKey: pineconeKey });
            const index = pc.index("tadkasync-main");

            const queryResponse = await index.namespace(namespace).query({
                vector: embedding,
                topK: topK,
                includeMetadata: true
            });

            console.log(`[VectorSearch] Query: "${query.substring(0, 20)}..." -> ${queryResponse.matches?.length || 0} matches`);

            res.json({ matches: queryResponse.matches || [] });

        } catch (error: any) {
            console.error("[VectorSearch] Error:", error);
            res.status(500).json({ error: error.message });
        }
    });
});

/**
 * Scheduled Jobs
 */
export const dailyIngredientEnrichment = functions.pubsub.schedule('every 24 hours').onRun(analyzeNewIngredients);

export const weeklyTrendAnalysis = functions.pubsub.schedule('every sunday 00:00').onRun(analyzeTrends);
