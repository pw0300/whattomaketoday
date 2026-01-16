# AI Optimization & Performance Strategy

## 1. Goal
Improve the **relevance, accuracy, and "taste"** of generated recipes without training expensive custom models. We believe "Context is King."

## 2. Knowledge Graph (KG) - "The Brain" (✅ IMPLEMENTED)
Instead of relying solely on Gemini's latent knowledge, we will build a structured JSON/Firestore graph.
- **Implemented as**: `ingredients_master_list.json` + `knowledgeGraphService.ts`
- **Structure**:
    - **Nodes**: `Ingredient` (e.g., "Paneer"), `Dish` (e.g., "Palak Paneer"), `Tag` (e.g., "Keto").
    - **Edges**: 
        - `Paneer` -> *is_essential_for* -> `Palak Paneer`
        - `Gobi` -> *substitutes* -> `Potato` (in Alloo Gobi)
- **Current Coverage**: 18+ core ingredients with substitutes, allergens, and seasonality.

## 3. RAG (Retrieval-Augmented Generation)
We will fetch context *before* asking Gemini to generate.

### Workflow
1.  **Query**: User wants "Dinner" + Pantry: ["Chickpeas", "Tomato"].
2.  **Retrieve**: Search our `Dish` vector database (or heavily curated Firestore collection) for "Chickpea Dinner".
    - *Found*: "Chana Masala", "Hummus Salad".
3.  **Augment**:
    - Take the "Golden Recipe" for Chana Masala.
    - Attach User Constraints (e.g., "Jain - No Onion/Garlic").
4.  **Generate**: 
    - *Prompt*: "Here is a standard Chana Masala recipe. Adapt it for a JAIN user (No Onion/Garlic). Output JSON."
- **Benefit**:
    - **Zero Hallucination**: The base recipe is real.
    - **Perfect Adaptation**: AI focuses only on the *diff* (removing onion), not inventing the dish from scratch.

## 4. Performance Tuning (Fine-Tuning alternatives)
Actual model Fine-Tuning is slow and rigid. We will use **Context Caching** (Gemini Feature).
- **System Instruction Cache**:
    - We have a massive "System Print" describing Indian cooking styles, "Hinglish" nuances, and Safety Rules.
    - utilizing `cache_contents` for this static context reduces latency and input token costs by ~90% for repeated calls.

## 5. The "Tasting" Loop (Reinforcement Learning Lite)
- Every time a user swipes **RIGHT**, we save that `Dish` embedding to their profile.
- Next Generation: We retrieve "Liked Dishes" and instruct Gemini: "User likes rich, creamy textures (History: Butter Chicken, Dal Makhani). Suggest something new matching this profile."

## 6. Solving "Cold Start" (Zero-Latency Strategy) (✅ IMPLEMENTED)
**Problem**: The very first generation (Onboarding -> Deck) takes 5-8 seconds, killing momentum.
**Solution**: AI should never block the first interaction.

### A. The "Starter Pack" Bundle (✅ IMPLEMENTED in `starterRecipes.ts`)
- **Implementation**: We will bundle `starter_recipes.json` (50 highly-rated, diverse recipes) directly in the client JS chunk.
- **Logic (Smart Filtering)**:
  1.  **Onboarding Complete**: User Profile is ready (e.g., "Vegetarian", "No Nuts").
  2.  **Client-Side Filter**: The app *immediately* filters the 50 bundled recipes:
      - `bundled.filter(d => d.diet === profile.diet && !profile.allergens.some(a => d.ingredients.includes(a)))`
  3.  **Instant Render**: The top 5 *matching* recipes are shown (0ms).
  4.  **Background**: Gemini starts generating *hyper-personalized* recipes (contextual matches).
  5.  **Merge**: As AI recipes arrive, they are shuffled in *after* the initial safe matches.

### B. "Next Session" Pre-Fetching
- When a user opens the app, we check: "Does the user have < 10 cards left?"
- If yes, we trigger generation **immediately** while they are viewing the landing screen.
- By the time they click "Deck", new cards are ready.

