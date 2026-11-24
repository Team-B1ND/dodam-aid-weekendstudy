import type { ReactNode } from 'react';

export const Sheet = ({
    label,
    onClose,
    children,
}: {
    label: string;
    onClose: () => void;
    children: ReactNode;
}) => (
    <div className="sheet__overlay" onClick={onClose} role="presentation">
        <div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-label={label}
            onClick={(event) => event.stopPropagation()}
        >
            <span className="sheet__handle" aria-hidden="true" />
            {children}
        </div>
    </div>
);
