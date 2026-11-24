const ACCESS_TOKEN_STORAGE_KEY = 'access_token';

export const getAccessToken = () => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
};

export const setAccessToken = (token: string) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
};

type AccessTokenRequester = () => Promise<string | null>;

let requester: AccessTokenRequester | null = null;
let inFlight: Promise<string | null> | null = null;

export const setAccessTokenRequester = (next: AccessTokenRequester | null) => {
    requester = next;
};

export const requestNewAccessToken = () => {
    if (!requester) return Promise.resolve(null);

    inFlight ??= Promise.resolve()
        .then(() => requester?.() ?? null)
        .catch(() => null)
        .finally(() => {
            inFlight = null;
        });

    return inFlight;
};
