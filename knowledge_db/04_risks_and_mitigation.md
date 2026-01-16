# Risks & Mitigation Plans

## 1. Technical Risks

### A. Gemini API Latency & Reliability
- **Risk**: User stares at a spinner for 10s.
- **Mitigation Plan**:
    1.  **Optimistic UI**: Show a "Skeleton Card" immediately.
    2.  **Streaming**: Implement `streamGenerateContent` to show text as it streams (already partially handled by `generateNewDishesProgressive`).
    3.  **Fallback Queue**: Keep 5 "Generic/Fallback" recipes locally (e.g., "Masala Omelette", "Khichdi") to show if API fails completely.

### B. Offline Mode Sync
- **Risk**: User edits "Pantry" offline, then "Weekly Plan" on another device. Conflict!
- **Mitigation Plan**:
    1.  **Last-Write-Wins (LWW)**: For V1, the latest timestamp overwrites.
    2.  **User Prompt**: If extensive drift is detected (e.g., versions differ by > 1 hour), prompt user: "Cloud data is newer. Overwrite local?"

## 2. Product Risks

### A. "The Cook Didn't Understand"
- **Risk**: AI generates "Sauté the shallots" and the cook doesn't know what "Shallots" are or explicit sautéing technique.
- **Mitigation Plan**:
    1.  **Feedback Loop**: User explicitly rates the "Cook Instruction" (Thumbs Up/Down).
    2.  **Simplification Prompt**: Force the AI to use *extremely* simple Hindi. "Pyaz bhun lo" instead of "Sauté onions".
    3.  **Audio Mode (Future)**: Use Gemini's Audio capabilities to generate a *Voice Note* in Hindi.

### B. API Costs Scaling
- **Risk**: Viral Feed feature checks thousands of videos.
- **Mitigation Plan**:
    1.  **Central Server Cache**: We must NOT let every client fetch from YouTube/Gemini directly for the same viral video.
    2.  **Architecture Change**: Move simple extraction logic to a Cloud Function that runs *once* per trending video and saves to Firestore. Clients only read Firestore.

## 3. Data Integrity
- **Risk**: AI suggests "Peanuts" for a nut-allergic user.
- **Mitigation Plan**:
    1.  **Post-Processing Validator**: simple TypeScript function that scans the generated JSON for forbidden words ("peanut", "mungfalli") *before* rendering.
    2.  **Strict Mode**: If allergy is severe, show a big "⚠️ AI Generated - Please Verify Ingredients" banner on every card.
## 4. Open Product Loops (✅ RESOLVED)
All 4 critical loops identified in the audit have been **closed**:

### A. The "Safety Lag" Loop (Fixed)
- **Fix**: `App.tsx` triggers `validateDeck()` immediately upon profile update (e.g., new allergy).
- **Result**: Unsafe dishes are silently purged from the deck.

### B. The "Shopping -> Pantry" Loop (Fixed)
- **Fix**: `GroceryList` now calls `togglePantryItem()` when an item is checked off.
- **Result**: Bought items automatically appear in available inventory.

### C. The "Negative Feedback" Loop (Fixed)
- **Fix**: Swiping LEFT adds the dish name to `userProfile.dislikedDishes`.
- **Result**: `geminiService` adds "Do NOT suggest: [Dishes]" to the prompt.

### D. The "Gamification" Loop (Fixed)
- **Fix**: Cooking a meal (`onCook`) increments `userProfile.credits` by +3.
- **Result**: Gamification wallet reflects actual usage.
