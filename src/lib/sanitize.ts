const SCRIPT_STYLE_REGEX = /<(script|style)[\s\S]*?>[\s\S]*?<\/\1>/gi;
const EVENT_HANDLER_REGEX = /on[a-z]+="[^"]*"/gi;
const TAGS_REGEX = /<[^>]*>/g;

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

  // Remove script/style blocks and inline event handlers
  let cleaned = dirty
    .replace(SCRIPT_STYLE_REGEX, "")
    .replace(EVENT_HANDLER_REGEX, "");

  if (allowHTML) {
    return cleaned;
  }

  // Strip remaining HTML tags for plain-text usage
  cleaned = cleaned.replace(TAGS_REGEX, "");

  return cleaned;
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
