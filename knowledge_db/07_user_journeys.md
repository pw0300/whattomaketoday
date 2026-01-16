# User Journey Map

## 1. The "Happy Path" (Target Flow)
**Persona**: "Riya", a busy professional. New user. Online (4G/5G).

| Step | User Action | System Response | Key Technology |
| :--- | :--- | :--- | :--- |
| **1. Install** | Opens Web App / PWA. | Standard Launch. | Vite PWA |
| **2. Onboard** | Selects "Vegetarian", "Medium Spice", "No Nuts". | Saves Profile to LocalStorage. | Zustand Persist |
| **3. Instant Load** | Clicks "Get Started". | **(0ms)** Shows 5 recipes from `Starter Pack` that match "Veg + No Nuts". | **Client-Side Filter** |
| **4. Browse** | Swipes Right on "Paneer Tikka". | Adds to "Approved List". Triggers background Gemini fetch. | Optimistic UI |
| **5. Plan** | Goes to "Weekly Planner", drags Paneer Tikka to "Monday Dinner". | Updates `WeeklyPlan` state. | Drag-and-Drop |
| **6. Sync** | Click "Send to Cook". | **Native Share Sheet** opens with pre-filled WhatsApp message. | **Cook Link** / Web Share API |
| **7. Device Switch** | Riya logs in on iPad. | Profile, Pantry, and Plan appear instantly. | **Firebase Sync** |

## 2. The "Smart Pantry" Flow (Happy Path B)
**Persona**: "Riya", late home, has random ingredients.
| Step | User Action | System Response | Key Technology |
| :--- | :--- | :--- | :--- |
| **1. Input** | Opens "Pantry" tab. Toggles "Paneer", "Capsicum", "Tomato". | Updates `pantryStock` state. | Zustand |
| **2. Generate** | Apps asks: "What to make?". Riya selects "Dinner". | AI generates recipes using *only* available items (or +1 spice). | **Constraint Generation** |
| **3. Result** | Shows "Paneer Jalfrezi". | "You have 100% ingredients!" | Match Score |
| **4. Action** | Swipes Right -> Add to Plan. | Moves ingredients from "Stock" to "Allocated". | Inventory Logic |

## 3. Critical Paths (High-Value Edge Cases)

### A. The "Allergen Minefield"
**Scenario**: User has a specific, severe allergy (e.g., Shellfish).
1.  **Input**: User selects "Shellfish Allergy" in Onboarding.
2.  **Starter Pack**: App filters out *Prawn Curry* from the bundled JSON.
3.  **Browse**: User requests new dishes.
4.  **Generation**: Gemini generates "Goan Fish Curry".
5.  **Safety Net**: Client-Side Validator detects "prawn/shrimp" keywords in the JSON response.
6.  **Outcome**: The card is **silently discarded** before rendering. User never sees the risk.

### B. The "Empty Pantry"
**Scenario**: User wants to cook but has no grocieries.
1.  **Input**: User goes to "Shopping List" view (Empty).
2.  **Action**: User Plans 3 meals.
3.  **Auto-Fill**: App extracts ingredients from the 3 meals -> Populates Shopping List.
4.  **Action**: User toggles "I have Salt/Oil".
5.  **Outcome**: Final list is copied to WhatsApp for the Quick Commerce delivery guy.

## 3. Breaking Paths (Failure Modes)

### A. The "Offline Start" (Hard Stop)
**Scenario**: User installs PWA, then goes into flight mode, then opens App for **First Time**.
- **State**: No Profile, No Cache.
- **Fail**: "Welcome! We need internet for setup."
- **Mitigation**: Meaningful Error Screen. *Do not crash*.

### B. The "Gemini Loop of Death" (API Fail)
**Scenario**: Google Cloud is down (500 Error).
1.  **Action**: User swipes through all 5 Starter Cards.
2.  **Fetch**: App tries to fetch more -> Fails.
3.  **Retry**: App tries 3 times with backoff -> Fails.
4.  **Fallback**: App switches to `offline_backup_recipes.json` (Generic "Dal Chawal", "Khichdi").
5.  **Feedback**: Toast Message: *"AI is sleeping. Showing standard recipes."*

### C. The "Cook Confusion"
**Scenario**: Cook cannot read English script (Hinglish).
- **Fail**: Cook ignores the message.
- **Feedback**: User reports "Cook didn't understand".
- **Mitigation**: Future Feature -> **Audio Message** file generated via TTS.
