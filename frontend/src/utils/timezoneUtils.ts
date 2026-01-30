import { formatInTimeZone } from 'date-fns-tz';

/**
 * Format a UTC datetime string in the user's timezone
 * @param utcDateString - ISO 8601 datetime string from the backend
 * @param timezone - IANA timezone string (e.g., 'America/Los_Angeles')
 * @param formatString - date-fns format string (default: 'PPpp')
 * @returns Formatted date string in the user's timezone
 */
export function formatInUserTimezone(
    utcDateString: string | null | undefined,
    timezone: string,
    formatString: string = 'PPpp' // e.g., "Apr 29, 2026, 1:15 PM"
): string {
    if (!utcDateString) return 'N/A';

    try {
        // If the date string is naive (no timezone info), assume it's UTC and append 'Z'
        // SQLALchemy/Pydantic often return naive ISO strings for UTC datetimes
        let dateToFormat = utcDateString;
        if (typeof utcDateString === 'string' &&
            !utcDateString.endsWith('Z') &&
            !utcDateString.includes('+') &&
            !/-\d{2}:\d{2}$/.test(utcDateString)) {
            dateToFormat = utcDateString + 'Z';
        }

        return formatInTimeZone(dateToFormat, timezone, formatString);
    } catch (error) {
        console.error('Error formatting date:', error);
        return utcDateString;
    }
}

/**
 * Get a list of common timezones for the timezone picker
 */
export function getCommonTimezones(): string[] {
    return [
        'America/Los_Angeles',   // Pacific Time
        'America/Denver',        // Mountain Time
        'America/Chicago',       // Central Time
        'America/New_York',      // Eastern Time
        'America/Anchorage',     // Alaska Time
        'Pacific/Honolulu',      // Hawaii Time
        'Europe/London',         // GMT/BST
        'Europe/Paris',          // Central European Time
        'Europe/Berlin',         // Central European Time
        'Asia/Tokyo',            // Japan Standard Time
        'Asia/Shanghai',         // China Standard Time
        'Asia/Dubai',            // Gulf Standard Time
        'Asia/Kolkata',          // India Standard Time
        'Australia/Sydney',      // Australian Eastern Time
        'Pacific/Auckland',      // New Zealand Time
    ];
}

/**
 * Get all available IANA timezones
 * This is a comprehensive list, but for most apps, getCommonTimezones() is sufficient
 */
export function getAllTimezones(): string[] {
    // Return a comprehensive list of IANA timezones
    // For a full list, you could use Intl.supportedValuesOf('timeZone') in modern browsers
    if (typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl) {
        try {
            return (Intl as any).supportedValuesOf('timeZone');
        } catch {
            // Fallback to common timezones
            return getCommonTimezones();
        }
    }
    return getCommonTimezones();
}

/**
 * Get timezone label with offset for display
 * @param timezone - IANA timezone string
 * @returns Formatted label like "America/Los_Angeles (PST, UTC-8)"
 */
export function getTimezoneLabel(timezone: string): string {
    try {
        const now = new Date();
        const formatted = formatInTimeZone(now, timezone, 'zzz (OOOO)');
        return `${timezone} (${formatted})`;
    } catch {
        return timezone;
    }
}

/**
 * Format a relative time (e.g., "2 hours ago")
 * @param utcDateString - ISO 8601 datetime string
 * @param timezone - User's timezone
 * @returns Relative time string
 */
export function formatRelativeTime(
    utcDateString: string | null | undefined,
    timezone: string
): string {
    if (!utcDateString) return 'N/A';

    try {
        const date = new Date(utcDateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        // For older dates, show the formatted date
        return formatInUserTimezone(utcDateString, timezone, 'PP');
    } catch (error) {
        console.error('Error formatting relative time:', error);
        return utcDateString;
    }
}
