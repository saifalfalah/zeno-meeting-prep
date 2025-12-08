/**
 * Timezone utility functions for handling date/time conversions
 */

/**
 * Convert a date to a specific timezone
 */
export function convertToTimezone(date: Date, timezone: string): Date {
  return new Date(
    date.toLocaleString("en-US", {
      timeZone: timezone,
    })
  );
}

/**
 * Format a date with timezone
 */
export function formatDateWithTimezone(
  date: Date,
  timezone: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
    ...options,
  };

  return date.toLocaleString("en-US", {
    ...defaultOptions,
    timeZone: timezone,
  });
}

/**
 * Get relative time string (e.g., "in 2 hours", "5 minutes ago")
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (diffMins < -60) {
    if (diffHours < -24) {
      return `${Math.abs(diffDays)} days ago`;
    }
    return `${Math.abs(diffHours)} hours ago`;
  } else if (diffMins < 0) {
    return `${Math.abs(diffMins)} minutes ago`;
  } else if (diffMins < 60) {
    return `in ${diffMins} minutes`;
  } else if (diffHours < 24) {
    return `in ${diffHours} hours`;
  } else {
    return `in ${diffDays} days`;
  }
}

/**
 * Detect user's timezone
 */
export function detectTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Check if a date is in the past
 */
export function isPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

/**
 * Check if a date is today
 */
export function isToday(date: Date, timezone?: string): boolean {
  const today = timezone ? convertToTimezone(new Date(), timezone) : new Date();
  const compareDate = timezone ? convertToTimezone(date, timezone) : date;

  return (
    today.getFullYear() === compareDate.getFullYear() &&
    today.getMonth() === compareDate.getMonth() &&
    today.getDate() === compareDate.getDate()
  );
}
