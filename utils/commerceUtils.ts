
/**
 * Quick Commerce Deep Link Generator
 * Supports: Blinkit, Zepto, Swiggy Instamart
 */

export const generateBlinkitLink = (query: string): string => {
    // Blinkit Search URL (Web/App deep link fallback)
    const encoded = encodeURIComponent(query);
    return `https://blinkit.com/s/?q=${encoded}`;
};

export const generateZeptoLink = (query: string): string => {
    // Zepto doesn't have a public web search URL structure documented consistently, 
    // but we can try a generic intent or fallback to store search. 
    // For now, we'll use a placeholder that redirects to generic web search if needed, 
    // or just use the App specific scheme if known. 
    // Safe Fallback: Google Search constrained to Zepto? No, let's use a generic search intent.
    const encoded = encodeURIComponent(query);
    return `https://zeptonow.com/search?query=${encoded}`;
};

export const generateInstamartLink = (query: string): string => {
    const encoded = encodeURIComponent(query);
    return `https://www.swiggy.com/instamart/search?custom_back=true&query=${encoded}`;
};

export const getCommerceLinks = (ingredientName: string) => {
    return [
        { name: 'Blinkit', url: generateBlinkitLink(ingredientName), color: 'bg-yellow-400 text-black' },
        { name: 'Zepto', url: generateZeptoLink(ingredientName), color: 'bg-purple-600 text-white' },
        { name: 'Instamart', url: generateInstamartLink(ingredientName), color: 'bg-orange-500 text-white' }
    ];
};
