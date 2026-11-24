import { Smile } from '@b1nd/dodam-design-system/icons/illustration';
import { LoadingSpinner } from '../LoadingSpinner';

export const StateCard = ({
    message,
    onRetry,
    actionLabel,
    onAction,
    isLoading = false,
}: {
    message?: string;
    onRetry?: () => void;
    actionLabel?: string;
    onAction?: () => void;
    isLoading?: boolean;
}) => (
    <section className="card state-card" aria-live="polite">
        {isLoading ? (
            <LoadingSpinner />
        ) : (
            <>
                <Smile size={32} />
                <p className="state-card__message">{message}</p>
                {(onRetry || onAction) && (
                    <button
                        type="button"
                        className="btn btn--assistive btn--block"
                        onClick={onRetry ?? onAction}
                    >
                        {onRetry ? '다시 시도' : actionLabel}
                    </button>
                )}
            </>
        )}
    </section>
);
