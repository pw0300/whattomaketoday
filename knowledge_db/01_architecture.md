# Technical Architecture

## Tech Stack
- **Frontend**: React + Vite + TailwindCSS.
- **State Management**: Zustand (Persisted to localStorage).
- **Utils**: `firestoreUtils.ts` (Sanitation), `featureFlags.ts` (Rollouts).
- **Backend (Serverless)**: 
    - **Cloud Functions** (Planned): For "Heavy" API calls.
    - **Firebase Firestore**: `users` (Private), `cached_dishes` (Public).
- **AI Engine**: Gemini 2.0 Flash (via `@google/genai`).
- **Dev Tools**: `FirebaseStatus` (Connection Debugger). SDK).
- **Testing**: Vitest (Unit), Playwright (E2E).
- **Deployment**: Vercel.

## High-Level Architecture
```mermaid
graph TD
    User[User Client] -->|React/Vite| UI[App UI]
    UI -->|Zustand| Store[Local State Store]
    UI -->|@google/genai| Gemini[Gemini 2.0 Flash]
    UI -->|Firebase SDK| Auth[Firebase Auth]
    UI -->|Firebase SDK| DB[Firestore DB]
    
    subgraph "AI Services"
        Gemini -->|Generate| Recipes[Recipe JSON]
        Gemini -->|Translate| CookInst[Cook Instructions (Hindi)]
    end

    subgraph "Data Sync"
        Store <-->|Sync| DB
        DB -->|Cache| CachedDishes[Cached Dishes Collection]
    end
```

## Key Services
- **`geminiService.ts`**: Handles all interactions with Google Gemini. Includes robust error handling, retrying, and schema enforcement for JSON outputs.
- **`firebaseService.ts`**: Manages Authentication and State Synchronization. Implements a "Guest-to-User" reconciliation logic.
- **`useStore.ts`**: Central brains of the application. Holds `UserProfile`, `PantryStock`, `WeeklyPlan`, and `AvailableDishes`.

## Data Flow (Recipe Generation)
1.  **Trigger**: User swipes right or requests more dishes.
2.  **Context Building**: `UserProfile` (allergens, likes) + `PantryStock` + `VibeMode`.
3.  **Cache Check**: Query Firestore for existing dishes matching criteria.
4.  **AI Generation**: If cache miss, call Gemini to generate new `Dish` objects.
5.  **hydrate**: Update `useStore` with new dishes.
6.  **Cache Write**: Save newly generated dishes to Firestore for future users.
