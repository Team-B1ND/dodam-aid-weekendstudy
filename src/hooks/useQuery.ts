import { useCallback, useEffect, useRef, useState } from 'react';
import { getAuthFailure, type AuthFailure } from '../api/error';

export const useQuery = <T>(load: () => Promise<T>) => {
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [authFailure, setAuthFailure] = useState<AuthFailure | null>(null);
    const requestId = useRef(0);

    const refetch = useCallback(async () => {
        const id = ++requestId.current;

        try {
            const next = await load();
            if (id !== requestId.current) return;
            setData(next);
            setIsError(false);
            setAuthFailure(null);
        } catch (error) {
            if (id !== requestId.current) return;
            console.error(error);
            const failure = getAuthFailure(error);
            if (failure) setAuthFailure(failure);
            else setIsError(true);
        } finally {
            if (id === requestId.current) setIsLoading(false);
        }
    }, [load]);

    useEffect(() => {
        void Promise.resolve().then(() => {
            setIsLoading(true);
            setData(null);
            return refetch();
        });

        const refreshWhenVisible = () => {
            if (document.visibilityState === 'visible') void refetch();
        };
        document.addEventListener('visibilitychange', refreshWhenVisible);
        return () => document.removeEventListener('visibilitychange', refreshWhenVisible);
    }, [refetch]);

    const retry = useCallback(() => {
        setIsLoading(true);
        setIsError(false);
        void refetch();
    }, [refetch]);

    return { data, isLoading, isError, authFailure, refetch, retry };
};
