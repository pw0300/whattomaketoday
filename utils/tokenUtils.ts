/**
 * Simple token estimation for Gemini
 * Rough heuristic: 1 token ≈ 4 characters
 */
export const estimateTokens = (text: string): number => {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
};
