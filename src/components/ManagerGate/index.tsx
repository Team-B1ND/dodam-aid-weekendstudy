import type { ReactNode } from 'react';
import { Actions, useBridgeProvider } from '@b1nd/aid-kit/bridge-kit/web';
import { useQuery } from '../../hooks/useQuery';
import { getMyRoles, MANAGER_ROLE } from '../../api/user';
import { LoadingSpinner } from '../LoadingSpinner';
import { NoPermission, SessionExpired } from '../NoPermission';
import { StateCard } from '../StateCard';

export const ManagerGate = ({ children }: { children: ReactNode }) => {
    const { send } = useBridgeProvider();
    const { data: roles, isLoading, isError, authFailure, retry } = useQuery(getMyRoles);

    if (roles?.includes(MANAGER_ROLE)) return children;

    return (
        <main className="screen">
            <div className="screen__body screen__body--centered">
                {isLoading ? (
                    <LoadingSpinner />
                ) : authFailure === 'expired' ? (
                    <SessionExpired onRetry={retry} />
                ) : isError ? (
                    <StateCard message="계정 정보를 불러올 수 없어요." onRetry={retry} />
                ) : (
                    <>
                        <NoPermission />
                        <button
                            type="button"
                            className="btn btn--assistive btn--block btn--large"
                            onClick={() => send(Actions.NAVIGATION_POP)}
                        >
                            도담도담으로 돌아가기
                        </button>
                    </>
                )}
            </div>
        </main>
    );
};
