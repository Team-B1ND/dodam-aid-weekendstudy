import { createApiClient } from '@b1nd/api-client';
import type { ApiClient, BaseResponse } from '@b1nd/api-client';
import { AuthError, getStatusCode, isAuthStatus } from './error';
import { getAccessToken, requestNewAccessToken } from './token';
import { isTokenExpired } from './jwt';

const BASE_URL = import.meta.env.DEV ? '' : import.meta.env.VITE_API_URL;

const client = createApiClient(BASE_URL);

type RequestConfig = Parameters<ApiClient['get']>[1];

const withAuthHeader = (config: RequestConfig = {}): RequestConfig => {
    const token = getAccessToken();
    if (!token) return config;

    return {
        ...config,
        headers: {
            ...config.headers,
            Authorization: `Bearer ${token}`,
        },
    };
};

const withTokenRetry = async <T>(
    send: () => Promise<BaseResponse<T>>
): Promise<BaseResponse<T>> => {
    try {
        return await send();
    } catch (error) {
        if (!isAuthStatus(getStatusCode(error))) throw error;

        const previousToken = getAccessToken();

        if (isTokenExpired(previousToken) === false) {
            throw new AuthError('forbidden', { cause: error });
        }

        const token = await requestNewAccessToken();

        if (!token || token === previousToken) {
            throw new AuthError('expired', { cause: error });
        }

        try {
            return await send();
        } catch (retryError) {
            throw new AuthError(
                getStatusCode(retryError) === 403 ? 'forbidden' : 'expired',
                { cause: retryError }
            );
        }
    }
};

export const apiClient = {
    get: <T = unknown>(url: string, config?: RequestConfig) =>
        withTokenRetry(() => client.get<T>(url, withAuthHeader(config))),
    post: <T = unknown>(url: string, data?: unknown, config?: RequestConfig) =>
        withTokenRetry(() => client.post<T>(url, data, withAuthHeader(config))),
    put: <T = unknown>(url: string, data?: unknown, config?: RequestConfig) =>
        withTokenRetry(() => client.put<T>(url, data, withAuthHeader(config))),
    patch: <T = unknown>(url: string, data?: unknown, config?: RequestConfig) =>
        withTokenRetry(() => client.patch<T>(url, data, withAuthHeader(config))),
    delete: <T = unknown>(url: string, config?: RequestConfig) =>
        withTokenRetry(() => client.delete<T>(url, withAuthHeader(config))),
};
