
import { describe, it, expect } from 'vitest';
import { generateBlinkitLink, generateZeptoLink, generateInstamartLink } from './commerceUtils';

describe('commerceUtils', () => {
    it('should generate correct Blinkit links', () => {
        expect(generateBlinkitLink('Maggi')).toBe('https://blinkit.com/s/?q=Maggi');
        expect(generateBlinkitLink('Red Chillies')).toBe('https://blinkit.com/s/?q=Red%20Chillies');
    });

    it('should generate correct Zepto links', () => {
        expect(generateZeptoLink('Milk')).toBe('https://zeptonow.com/search?query=Milk');
    });

    it('should generate correct Instamart links', () => {
        expect(generateInstamartLink('Bread')).toBe('https://www.swiggy.com/instamart/search?custom_back=true&query=Bread');
    });
});
