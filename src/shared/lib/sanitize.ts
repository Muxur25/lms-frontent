/**
 * Enterprise XSS Protection Utility
 * Ensures that any HTML content (e.g. course descriptions, AI responses)
 * rendered dangerously in React is safe from XSS attacks.
 * 
 * Note: For full production, integrate DOMPurify (`npm install dompurify`).
 * This serves as the architectural wrapper.
 */

export const sanitizeHtml = (dirtyHtml: string): string => {
  if (!dirtyHtml) return '';
  
  // Basic fallback sanitization (removes script tags)
  // Replace with: return DOMPurify.sanitize(dirtyHtml);
  
  return dirtyHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/onerror=/gi, '')
    .replace(/onload=/gi, '');
};

/**
 * React helper for safe HTML rendering
 * Usage: <div {...safeHtml(data.content)} />
 */
export const safeHtml = (dirtyHtml: string) => {
  return {
    dangerouslySetInnerHTML: {
      __html: sanitizeHtml(dirtyHtml)
    }
  };
};
