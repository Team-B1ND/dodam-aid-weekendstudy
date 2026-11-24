import { useState } from 'react';
import { TextField } from '@b1nd/dodam-design-system/components';
import { Sheet } from '../../components/Sheet';
import type { StudentEntry } from '../../utils/applications';
import { formatDate } from '../../utils/date';
import { formatStudentNumber } from '../../utils/student';
import { STATUS_OPTIONS, type Status } from './status';

export const AttendanceEditSheet = ({
    entry,
    date,
    period,
    current,
    initial,
    error,
    isPending,
    onClose,
    onSave,
}: {
    entry: StudentEntry;
    date: string;
    period: number;
    current: Status;
    initial: Status;
    error: string | null;
    isPending: boolean;
    onClose: () => void;
    onSave: (status: Status, reason: string) => void;
}) => {
    const [status, setStatus] = useState(initial);
    const [reason, setReason] = useState('');

    return (
        <Sheet label="출석 수정" onClose={onClose}>
            <div>
                <h2 className="sheet__title">출석 수정</h2>
                <p className="row__sub">
                    {[entry.applicant.name, formatStudentNumber(entry.applicant), `${formatDate(date)} ${period}시`]
                        .filter(Boolean)
                        .join(' · ')}
                </p>
            </div>

            <p className="warning-text">{period}시 체크 시간이 끝나 수정하려면 사유가 필요해요.</p>

            <div className="status-buttons" role="group" aria-label="출결">
                {STATUS_OPTIONS.map((option) => (
                    <button
                        key={option.label}
                        type="button"
                        className={`status-button ${status === option.value ? option.className : ''}`}
                        aria-pressed={status === option.value}
                        onClick={() => setStatus(option.value)}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            <TextField
                type="text"
                label="사유 (필수)"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                onRemoveClick={() => setReason('')}
            />

            {error && <p className="error-text">{error}</p>}

            <button
                type="button"
                className="btn btn--primary btn--block btn--large"
                disabled={isPending || status === current || !reason.trim()}
                onClick={() => onSave(status, reason.trim())}
            >
                저장
            </button>
        </Sheet>
    );
};
