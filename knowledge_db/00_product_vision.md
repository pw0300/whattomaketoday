# Product Vision & Essence

## The Essence
**"TadkaSync" (aka ChefSync)** is a hyper-localized, AI-powered kitchen operating system designed for the modern Indian household. It bridges the gap between digital meal planning and physical execution by domestic help (Cooks/Maharajs).

Unlike generic recipe apps, TadkaSync acknowledges the unique workflow of Indian kitchens:
- **Constraint-First**: "What can I make with *this* Gobi and *that* Paneer?"
- **Cook-Centric**: Instructions generated not for the user, but for their cook (in Hindi/Hinglish).
- **Vibe-Driven**: "Strict", "Comfort", or "Explorer" modes to match the user's mood.

## Target Audience
- **The Modern Indian Professional**: Busy, health-conscious, relies on domestic help, but wants control over nutrition and variety.
- **The "Maharaj" (Cook)**: Needs clear, specific instructions without ambiguity.
- **The Home Manager**: Needs to track pantry and ensure groceries are ordered.

## Core Value Proposition
1.  **Swipe to Decide**: Gamified decision making to solve the "Aaj kya banega?" (What to cook today?) fatigue.
2.  **AI Chef Integration**: Gemini-powered recipe generation that respects complex dietary profiles (Jain, Keto, Diabetic) and Pantry availability.
3.  **The "Cook Link" (Core Functionality)**: Bridges the gap between digital planning and physical execution. One-click WhatsApp messages in *Hinglish* ensure the "Maharaj" knows exactly what to prep (e.g., soaking Rajma) and what to cook, with explicit safety warnings.

## Growth & Experimentation
We use a **Feature Flag** system (`featureFlags.ts`) to test "Viral" and "Pro" features without engaging the core utility loop:
- **Viral Feed**: Experimental infinite scroll of trending recipes (YouTube API). Controlled rollout.
- **Premium Features**: AI Image Gen, Social Sharing (Planned).
