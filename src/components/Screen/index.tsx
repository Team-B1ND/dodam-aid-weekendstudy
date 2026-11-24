import type { PointerEvent, ReactNode } from 'react';
import { ArrowLeft, Plus } from '@b1nd/dodam-design-system/icons/mono';

const keepControlTaps = (event: PointerEvent<HTMLElement>) => {
    if ((event.target as Element).closest('button, a, input, label, [role="checkbox"], [role="switch"]')) {
        event.stopPropagation();
    }
};

interface Props {
    title: string;
    onBack?: () => void;
    onAdd?: () => void;
    addLabel?: string;
    footer?: ReactNode;
    children: ReactNode;
}

export const Screen = ({ title, onBack, onAdd, addLabel, footer, children }: Props) => (
    <main className="screen" onPointerDown={keepControlTaps}>
        <header className="screen__header">
            {onBack && (
                <button type="button" className="screen__icon" aria-label="뒤로 가기" onClick={onBack}>
                    <ArrowLeft size={24} color="currentColor" />
                </button>
            )}
            <h1 className="screen__title">{title}</h1>
            {onAdd && (
                <button
                    type="button"
                    className="screen__icon screen__icon--end"
                    aria-label={addLabel}
                    onClick={onAdd}
                >
                    <Plus size={24} color="currentColor" />
                </button>
            )}
        </header>

        <div className="screen__body">{children}</div>

        {footer && <div className="screen__footer">{footer}</div>}
    </main>
);
