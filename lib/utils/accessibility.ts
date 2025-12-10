/**
 * Accessibility utilities for improving keyboard navigation and screen reader support
 */

/**
 * Handles keyboard navigation for lists
 * Supports Arrow Up/Down, Home, End, Enter, Space
 */
export function handleListKeyNavigation(
  event: React.KeyboardEvent,
  items: HTMLElement[],
  currentIndex: number,
  onSelect?: (index: number) => void
): number | null {
  let nextIndex = currentIndex;

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      nextIndex = Math.min(currentIndex + 1, items.length - 1);
      break;
    case 'ArrowUp':
      event.preventDefault();
      nextIndex = Math.max(currentIndex - 1, 0);
      break;
    case 'Home':
      event.preventDefault();
      nextIndex = 0;
      break;
    case 'End':
      event.preventDefault();
      nextIndex = items.length - 1;
      break;
    case 'Enter':
    case ' ':
      event.preventDefault();
      if (onSelect) {
        onSelect(currentIndex);
      }
      return null;
    default:
      return null;
  }

  items[nextIndex]?.focus();
  return nextIndex;
}

/**
 * Generates unique IDs for form elements and ARIA labels
 */
let idCounter = 0;
export function generateId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

/**
 * Announces a message to screen readers using ARIA live region
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Traps focus within a modal/dialog
 */
export function trapFocus(container: HTMLElement, event: KeyboardEvent) {
  if (event.key !== 'Tab') return;

  const focusableElements = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement?.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement?.focus();
  }
}

/**
 * Checks if an element meets WCAG color contrast requirements
 * Returns true if contrast ratio >= 4.5:1 for normal text
 */
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  largeText: boolean = false
): boolean {
  const minRatio = largeText ? 3 : 4.5;
  const ratio = getContrastRatio(foreground, background);
  return ratio >= minRatio;
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get relative luminance of a color
 */
function getRelativeLuminance(color: string): number {
  // This is a simplified version - production code would use full color parsing
  const rgb = hexToRgb(color);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}
