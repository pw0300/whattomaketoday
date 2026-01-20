# AI Model Strategy

## Current Implementation
- **Primary Model**: `gemini-2.0-flash`
- **SDK**: `@google/genai`
- **Reasoning**: The "Flash" series offers the best balance of **Latency** (< 2s) and **Cost** (Free tier / low commercial rate) for consumer apps.

## Strategy & Selection
| Feature | Recommended Model | Implementation Status | Why? |
| :--- | :--- | :--- | :--- |
| Feature | Recommended Model | Implementation Status | Why? |
| :--- | :--- | :--- | :--- |
| **Recipe Generation** | `gemini-2.0-flash` | ✅ Live | Fast, cheap, reliable for standard JSON. |
| **Cook Instructions** | `gemini-3.0-flash` | ✅ Live | **Reasoning Model**. Required for complex constraint analysis (Diabetes/Allergy). |
| **Pantry Analysis** | `gemini-2.0-flash` | ⏳ Planned | Multimodal capabilities. |

## Deprecation & Failover Plan
Google often deprecates "Experimental" (exp) models. 
**Reference**: [Gemini Models Documentation](https://ai.google.dev/gemini-api/docs/models)

### Risk Handling
1.  **Avoid Hardcoding**: Do not hardcode "gemini-2.0-flash-exp" deeply. Use a constant `const PRIMARY_MODEL = "gemini-2.0-flash"`.
2.  **Fallbacks**: 
    - If `2.0-flash` is down/rate-limited, fallback to `gemini-2.0-flash-lite` (or standard `gemini-2.0-flash` if using `exp`).
    - `geminiService.ts` should implement a simple retry logic that switches models on 4xx/5xx errors.
    
### Transition Plan
- **Current**: `gemini-2.0-flash` (Stable)
- **Watcher**: Monitor the [Deprecations Page](https://ai.google.dev/gemini-api/docs/deprecations).
- **Action**: When a model is announced for deprecation, we have ~2-6 months. We will institute a "Version Bump" task in our backlog.

## Cost Management
- **Token Usage**:
    - *Input*: User Profile + Pantry List (~500 tokens).
    - *Output*: JSON Recipe (~300 tokens).
- **Optimization**:
    - **System Instructions**: Move static rules (schema definitions) to "System Instructions" to potentially cache context (future feature).
    - **JSON Schema**: Using strict Schema reduces "chatter" and lowers output tokens.
