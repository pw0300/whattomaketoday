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
exports.generate = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const generative_ai_1 = require("@google/generative-ai");
const cors_1 = __importDefault(require("cors"));
// Initialize Admin SDK
admin.initializeApp();
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
//# sourceMappingURL=index.js.map