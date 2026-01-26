"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.weeklyTrendAnalysis = exports.dailyIngredientEnrichment = exports.vectorSearch = exports.generate = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const generative_ai_1 = require("@google/generative-ai");
const cors_1 = __importDefault(require("cors"));
// Initialize Admin SDK FIRST (before importing scheduler modules that use it)
admin.initializeApp();
// Now safe to import modules that use admin.firestore()
const ingredientEnrichment_1 = require("./scheduler/ingredientEnrichment");
const trendAnalysis_1 = require("./scheduler/trendAnalysis");
// CORS handler
const corsHandler = (0, cors_1.default)({ origin: true });
// Configuration
// Note: For production, prefer using: firebase functions:config:set gemini.key="YOUR_KEY"
// Then access via functions.config().gemini.key
// Fallback to process.env for local .env support
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
exports.generate = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        var _a, _b;
        // Enforce POST
        if (req.method !== 'POST') {
            res.status(405).send('Method Not Allowed');
            return;
        }
        try {
            const { prompt, contents, schema, modelName } = req.body;
            // Security Check
            // You can replace this with functions.config().gemini.key
            const apiKey = GEMINI_API_KEY || ((_a = functions.config().gemini) === null || _a === void 0 ? void 0 : _a.key);
            if (!apiKey) {
                console.error("Missing GEMINI_API_KEY configuration");
                res.status(500).json({ error: 'Server misconfiguration: Missing API Key' });
                return;
            }
            console.log(`[Generate] Received request for model: ${modelName || "default"}`);
            // Initialize Gemini
            const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
                model: modelName || process.env.GEMINI_MODEL || ((_b = functions.config().gemini) === null || _b === void 0 ? void 0 : _b.model) || "gemini-2.0-flash",
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
        }
        catch (error) {
            console.error("[Generate] Error:", error);
            res.status(500).json({
                error: 'Failed to generate content',
                details: error.message
            });
        }
    });
});
exports.vectorSearch = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        var _a, _b, _c;
        if (req.method !== 'POST') {
            res.status(405).send('Method Not Allowed');
            return;
        }
        try {
            const { query, topK = 5, namespace = 'default' } = req.body;
            // 1. Secrets
            const geminiKey = process.env.GEMINI_API_KEY || ((_a = functions.config().gemini) === null || _a === void 0 ? void 0 : _a.key);
            const pineconeKey = process.env.PINECONE_API_KEY || ((_b = functions.config().pinecone) === null || _b === void 0 ? void 0 : _b.key); // Set via: firebase functions:config:set pinecone.key="..."
            if (!geminiKey || !pineconeKey) {
                console.error("Missing Keys");
                res.status(500).json({ error: 'Server Config Error: Missing Keys' });
                return;
            }
            // 2. Generate Embedding (Gemini)
            const genAI = new generative_ai_1.GoogleGenerativeAI(geminiKey);
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
            console.log(`[VectorSearch] Query: "${query.substring(0, 20)}..." -> ${((_c = queryResponse.matches) === null || _c === void 0 ? void 0 : _c.length) || 0} matches`);
            res.json({ matches: queryResponse.matches || [] });
        }
        catch (error) {
            console.error("[VectorSearch] Error:", error);
            res.status(500).json({ error: error.message });
        }
    });
});
/**
 * Scheduled Jobs
 */
exports.dailyIngredientEnrichment = functions.pubsub.schedule('every 24 hours').onRun(ingredientEnrichment_1.analyzeNewIngredients);
exports.weeklyTrendAnalysis = functions.pubsub.schedule('every sunday 00:00').onRun(trendAnalysis_1.analyzeTrends);
//# sourceMappingURL=index.js.map