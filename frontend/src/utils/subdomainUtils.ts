/**
 * Detect subdomain from current URL
 * For local development, returns null (use X-Subdomain header instead)
 * For production, extracts subdomain from hostname
 */
export function getSubdomain(): string | null {
    const hostname = window.location.hostname;

    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Check if there's a subdomain query parameter for testing
        const params = new URLSearchParams(window.location.search);
        return params.get('subdomain');
    }

    // Production - extract subdomain from hostname
    // e.g., "acme.docutok.com" -> "acme"
    const parts = hostname.split('.');

    if (parts.length >= 3) {
        // Has subdomain
        return parts[0];
    }

    // No subdomain
    return null;
}

/**
 * Check if we're in a branded subdomain context
 */
export function isBrandedRoute(): boolean {
    return getSubdomain() !== null;
}
