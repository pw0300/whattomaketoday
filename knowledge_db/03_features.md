# Key Features

## 1. Tinder-Style Meal Selection ("The Swipe Deck")
- **Problem**: Decision fatigue. Listing 20 options makes users anxious.
- **Solution**: Show **ONE** card at a time.
    - **Swipe Right**: Approve (Add to "Approved" list).
    - **Swipe Left**: Reject (Never show again).
    - **Swipe Up**: Mark as "Staple" (Eating it today, but don't add to permanent validation list).
- **Tech**: `framer-motion` for physics-based gestures.

## 2. Smart Onboarding (Zero-Latency)
- **Problem**: First recipe generation takes 8s, leading to drop-offs.
- **Solution**: "Starter Pack" Implementation.
    - **Asset**: 50 pre-validated recipes bundled in client (`starterRecipes.ts`).
    - **Logic**: Filters explicitly by user Allergens & Diet (0ms load).
    - **Fail-Safe**: If filtering yields < 3 recipes, falls back to API.
- **Outcome**: Users swipe immediately while AI generates personalized content in background.

## 3. Knowledge Graph Intelligence
- **Implementation**: Structured `ingredients_master_list.json` + `knowledgeGraphService.ts`.
- **Capabilities**:
    - **Validation**: Checks if "Pantry Items" are real ingredients.
    - **Smart Substitutes**: Suggests "Tofu" if "Paneer" is missing.
    - **Dish Matching**: Matches Pantry inventory to Dish Templates (70% threshold).

## 4. Telemetry & Analytics
- **Strategy**: Privacy-first logging to console/analytics provider.
- **Key Metrics**:
    - **Cache Hit Rate**: Percentage of dishes served from Store vs API.
    - **Starter Pack Utilization**: How often the bundle is used.
    - **KG Usage**: Validation success rates.

## 5. Experimental Features (Flagged)
**Controlled via `lib/featureFlags.ts`**

### A. Viral Recipe Feed (`viral_feed`)
- **Concept**: TikTok-style infinite scroll of trending YouTube Shorts/Instagram Reels (curated for Indian cooking).
- **Goal**: Discovery engine to inspire "Impulse Cooking".
- **Status**: Beta / Soft Launch.
- **Tech**: YouTube Data API + Firestore Caching for trending video IDs.

## 6. Offline-First Architecture
- **Problem**: Kitchens often have poor WiFi.
- **The "Killer Feature"**: Bridges the gap between the App (User) and the Kitchen (Cook).
- **Workflow**:
    1.  **Selection**: User finalizes the `WeeklyPlan`.
    2.  **Generation**: App generates a **Daily Summary** or **Weekly Plan** text block.
    3.  **Transmission**: One-tap "Send via WhatsApp" button opens the native app with the pre-filled message.
- **Message Structure (The "Golden Format")**:
    - **Header**: Date/Week Greeting (e.g., "📅 Menu for *Mon, 12th*").
    - **Meal Blocks**:
        - *Lunch*: "Rajma Chawal + Bhindi Fry".
        - *Prep Step*: "🔴 *Raat ko Rajma bhigo dena*" (Soak kidney beans at night).
        - *Dinner*: "Paneer Bhurji + Roti".
    - **Safety & Alerts** (CRITICAL):
        - **Allergens**: Explicit warning in Hinglish: *"⚠️ Dhyaan rakhna: Madam ko PEANUTS se allergy hai. Galti se bhi mat dalna."*
        - **Health**: *"Oil kam use karna (Heart patient)."*
- **Technology**:
    - **Prompt Engineering**: Gemini 2.0 Flash is instructed to act as a "Strict Indian Home Manager".
    - **Localization**: Output is strictly **Hinglish** (Hindi in English script) for maximum readability by domestic staff.

## 3. Smart Pantry & Frugal AI
- **Problem**: "I have X, Y, Z. What can I make?"
- **Solution**:
    - User inputs pantry items (text or photo).
    - AI uses this as a **hard constraint** for generation.
    - **Frugal Architecture**: Uses `gemini-2.0-flash` (lower cost) and caches results to minimize tokens.

## 4. Offline-First Architecture
- **Problem**: Kitchens often have poor WiFi.
- **Solution**:
    - `zustand/persist` saves all state to `localStorage`.
    - App works 100% offline (except for *new* generation).
    - Syncs to Firebase silently when connection returns.
