import type { ReactNode } from 'react';
import './index.css';

interface Props {
    label: string;
    onClose: () => void;
    children: ReactNode;
}

export const Dialog = ({ label, onClose, children }: Props) => (
    <div className="dialog__overlay" onClick={onClose} role="presentation">
        <div
            className="dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={label}
        >
            {children}
        </div>
    </div>
);

export default Dialog;
