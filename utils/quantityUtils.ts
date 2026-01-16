/**
 * Quantity parsing and scaling utilities for recipe ingredients
 */

export const parseQuantity = (qty: string): number | null => {
    const clean = qty.trim();
    const mixedMatch = clean.match(/^(\d+)[\s-](\d+)\/(\d+)$/);
    if (mixedMatch) return parseInt(mixedMatch[1]) + (parseInt(mixedMatch[2]) / parseInt(mixedMatch[3]));
    const fractionMatch = clean.match(/^(\d+)\/(\d+)$/);
    if (fractionMatch) return parseInt(fractionMatch[1]) / parseInt(fractionMatch[2]);
    const decimalMatch = clean.match(/^(\d+(\.\d+)?)$/);
    if (decimalMatch) return parseFloat(decimalMatch[1]);
    return null;
};

export const formatQuantity = (val: number): string => {
    if (val === 0) return "";
    if (Number.isInteger(val)) return val.toString();
    const whole = Math.floor(val);
    const decimal = val - whole;
    const closeTo = (n: number, target: number) => Math.abs(n - target) < 0.05;
    let frac = "";
    if (closeTo(decimal, 0.25)) frac = "¼";
    else if (closeTo(decimal, 0.33)) frac = "⅓";
    else if (closeTo(decimal, 0.5)) frac = "½";
    else if (closeTo(decimal, 0.66)) frac = "⅔";
    else if (closeTo(decimal, 0.75)) frac = "¾";
    else frac = decimal.toFixed(1).replace('.0', '');
    if (frac.startsWith("0.")) return frac;
    return whole > 0 ? `${whole} ${frac}` : frac;
};

export const getScaledQuantity = (rawQty: string, servings: number): string => {
    if (servings === 1) return rawQty;
    const match = rawQty.match(/^([\d\s\/\.-]+)(.*)$/);
    if (match) {
        const numberPart = match[1].trim();
        const textPart = match[2];
        const val = parseQuantity(numberPart);
        if (val !== null) {
            const scaled = val * servings;
            return `${formatQuantity(scaled)}${textPart}`;
        }
    }
    return `${rawQty} (x${servings})`;
};
