const EXPIRY_LEEWAY_SECONDS = 10;

const decodePayload = (token: string): Record<string, unknown> | null => {
    const payload = token.split('.')[1];
    if (!payload) return null;

    try {
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(
            atob(base64)
                .split('')
                .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
                .join('')
        );

        const parsed: unknown = JSON.parse(json);
        return typeof parsed === 'object' && parsed !== null
            ? (parsed as Record<string, unknown>)
            : null;
    } catch {
        return null;
    }
};

export const isTokenExpired = (token: string | null): boolean | null => {
    if (!token) return true;

    const payload = decodePayload(token);
    const exp = payload?.exp;
    if (typeof exp !== 'number') return null;

    return exp - EXPIRY_LEEWAY_SECONDS <= Date.now() / 1000;
};
