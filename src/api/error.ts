export const getStatusCode = (error: unknown): number | null => {
    if (typeof error !== 'object' || error === null) return null;

    const { status, response } = error as {
        status?: unknown;
        response?: { status?: unknown };
    };

    if (typeof status === 'number') return status;
    if (typeof response?.status === 'number') return response.status;
    return null;
};

export const isAuthStatus = (status: number | null) =>
    status === 401 || status === 403;

export type AuthFailure =
    | 'expired'
    | 'forbidden';

export class AuthError extends Error {
    readonly reason: AuthFailure;

    constructor(reason: AuthFailure, options?: { cause?: unknown }) {
        super(
            reason === 'forbidden'
                ? '주말 자습 관리 권한이 없어요.'
                : '로그인 정보가 만료됐어요.',
            options
        );
        this.name = 'AuthError';
        this.reason = reason;
    }
}

export const getAuthFailure = (error: unknown): AuthFailure | null =>
    error instanceof AuthError ? error.reason : null;

export const getErrorMessage = (error: unknown, fallback: string) => {
    const message = (error as { message?: unknown } | null)?.message;
    return typeof message === 'string' && message && !(error instanceof Error)
        ? message
        : fallback;
};
