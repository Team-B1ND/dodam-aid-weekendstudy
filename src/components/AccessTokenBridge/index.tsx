import { useEffect, useRef } from 'react';
import { useBridgeProvider, type Action } from '@b1nd/aid-kit/bridge-kit/web';
import { setAccessToken, setAccessTokenRequester } from '../../api/token';

const TOKEN_REQUEST_TIMEOUT_MS = 5_000;

type Resolve = (token: string | null) => void;

const OAUTH_GET_TOKEN = 'OAUTH_GET_TOKEN' as Action;

const extractAccessToken = (payload: unknown, depth = 0): string | null => {
    if (depth > 3) return null;
    if (typeof payload === 'string') return payload || null;
    if (typeof payload !== 'object' || payload === null) return null;

    const record = payload as Record<string, unknown>;
    if (record.success === false) return null;

    const direct = record.accessToken ?? record.access_token ?? record.token;
    if (typeof direct === 'string' && direct) return direct;

    return 'data' in record ? extractAccessToken(record.data, depth + 1) : null;
};

export const AccessTokenBridge = () => {
    const bridge = useBridgeProvider();
    const resolveRef = useRef<Resolve | null>(null);

    useEffect(() => {
        const unsubscribe = bridge.subscribe(OAUTH_GET_TOKEN, async (data) => {
            const accessToken = extractAccessToken(data);
            if (accessToken) setAccessToken(accessToken);
            else console.error('브리지 토큰 응답을 해석하지 못했어요:', data);

            resolveRef.current?.(accessToken);
            resolveRef.current = null;

            return {};
        });

        setAccessTokenRequester(
            () =>
                new Promise<string | null>((resolve) => {
                    const finish: Resolve = (token) => {
                        window.clearTimeout(timer);
                        if (resolveRef.current === finish) resolveRef.current = null;
                        resolve(token);
                    };

                    const timer = window.setTimeout(
                        () => finish(null),
                        TOKEN_REQUEST_TIMEOUT_MS
                    );

                    resolveRef.current = finish;
                    bridge.send(OAUTH_GET_TOKEN);
                })
        );

        return () => {
            unsubscribe();
            setAccessTokenRequester(null);
        };
    }, [bridge]);

    return null;
};

export default AccessTokenBridge;
