import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param dirty - The potentially unsafe HTML string
 * @param allowHTML - Whether to allow HTML tags (default: false for plain text)
 * @returns Sanitized string
 */
export function sanitizeHTML(dirty: string, allowHTML: boolean = false): string {
  if (!dirty || typeof dirty !== "string") {
    return "";
  }

  if (allowHTML) {
    // Allow basic formatting HTML tags but sanitize dangerous content
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br", "a"],
      ALLOWED_ATTR: ["href"],
      ALLOW_DATA_ATTR: false,
    });
  } else {
    // Strip all HTML tags (plain text mode)
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });
  }
}

/**
 * Sanitize plain text content (strips all HTML)
 * @param text - The text to sanitize
 * @returns Sanitized plain text
 */
export function sanitizeText(text: string): string {
  return sanitizeHTML(text, false);
}

/**
 * Sanitize user input for display in React components
 * React already escapes content by default, but this provides extra safety
 * @param input - User input string
 * @returns Sanitized string safe for display
 */
export function sanitizeUserInput(input: string | null | undefined): string {
  if (!input) return "";
  return sanitizeText(String(input));
}
