import type { AttendanceStatus } from '../../api/weekendStudy';

export type Status = AttendanceStatus | null;

export const STATUS_OPTIONS: { value: Status; label: string; className: string }[] = [
    { value: 'ATTENDANCE', label: '출석', className: 'is-attendance' },
    { value: 'LATE', label: '지각', className: 'is-late' },
    { value: 'ABSENT', label: '결석', className: 'is-absent' },
    { value: null, label: '미체크', className: 'is-unchecked' },
];

export const STATUS_LABEL: Record<AttendanceStatus, string> = {
    ATTENDANCE: '출석',
    LATE: '지각',
    ABSENT: '결석',
};

export const STATUS_CLASS: Record<AttendanceStatus, string> = {
    ATTENDANCE: 'is-attendance',
    LATE: 'is-late',
    ABSENT: 'is-absent',
};
