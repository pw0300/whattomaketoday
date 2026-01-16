/**
 * Firestore Utilities
 */

/**
 * Recursively removes undefined values from an object or replaces them with null,
 * because Firestore does not support 'undefined'.
 * 
 * @param obj The object to sanitize
 * @returns A new object with no undefined values
 */
export const sanitizeForFirestore = (obj: any): any => {
    if (obj === null || obj === undefined) return null;
    if (typeof obj !== 'object') return obj;
    if (obj instanceof Date) return obj;

    // Handle Arrays
    if (Array.isArray(obj)) {
        return obj.map(v => sanitizeForFirestore(v)).filter(v => v !== undefined);
    }

    // Handle Objects
    const newObj: any = {};
    for (const key in obj) {
        const value = obj[key];
        if (value !== undefined) {
            newObj[key] = sanitizeForFirestore(value);
        }
        // Note: We skip keys with undefined values entirely
    }
    return newObj;
};
