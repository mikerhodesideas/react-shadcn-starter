// src/lib/google-ads-script-template.ts
import baseScript from './gads-script.js?raw';  // Note the ?raw suffix

export const getGoogleAdsScript = (sheetUrl: string) => {
    // Sanitize the URL to prevent script injection
    const sanitizedUrl = sheetUrl.replace(/["\\]/g, '\\$&');
    const sheetUrlLine = `const SHEET_URL = "${sanitizedUrl}";\n\n`;
    return sheetUrlLine + baseScript;
};

export const handleCopyScript = async (sheetUrl: string): Promise<boolean> => {
    try {
        const fullScript = getGoogleAdsScript(sheetUrl);
        await navigator.clipboard.writeText(fullScript);
        return true;
    } catch (error) {
        console.error('Failed to copy script:', error);
        return false;
    }
};