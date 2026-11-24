import { useCallback, useState } from 'react';
import { Dropdown } from '@b1nd/dodam-design-system/components';
import { StateCard } from '../../components/StateCard';
import { DateField } from '../../components/DateField';
import { ListSkeleton } from '../../components/Skeleton';
import { AuthNotice } from '../../components/NoPermission';
import { useQuery } from '../../hooks/useQuery';
import { getAllApplications, getAttendanceStatuses } from '../../api/weekendStudy';
import { statusKey, toStudentEntries } from '../../utils/applications';
import { getUpcomingSunday } from '../../utils/date';
import { formatClassroom, formatStudentNumber, matchesKeyword } from '../../utils/student';
import { downloadCsv } from '../../utils/csv';
import { FILTER_STYLE } from '../filterStyle';
import { STATUS_CLASS, STATUS_LABEL } from '../attendance/status';
import { RecordsShell } from './RecordsShell';
import type { RecordsTab } from './tabs';

const ALL = 'all';
const UNCHECKED = 'UNCHECKED';

const STATUS_FILTER = [
    { name: '모든 상태', value: ALL },
    { name: '출석', value: 'ATTENDANCE' },
    { name: '지각', value: 'LATE' },
    { name: '결석', value: 'ABSENT' },
    { name: '미체크', value: UNCHECKED },
];

const loadRecords = async (date: string) => {
    const [statuses, applications] = await Promise.all([getAttendanceStatuses(date), getAllApplications(date)]);
    const placeOf = new Map(
        toStudentEntries(applications).flatMap((entry) =>
            entry.periods.map((period) => [statusKey(entry.applicant.publicId, period), entry.place] as const)
        )
    );
    return statuses.map((row) => ({
        ...row,
        key: statusKey(row.student.publicId, row.period),
        place: placeOf.get(statusKey(row.student.publicId, row.period)) ?? formatClassroom(row.student),
    }));
};

export const DailyRecords = ({ onTab }: { onTab: (tab: RecordsTab) => void }) => {
    const [date, setDate] = useState(getUpcomingSunday);
    const [keyword, setKeyword] = useState('');
    const [status, setStatus] = useState(ALL);
    const [grade, setGrade] = useState(ALL);
    const [klass, setKlass] = useState(ALL);

    const load = useCallback(() => loadRecords(date), [date]);
    const { data, isLoading, isError, authFailure, retry } = useQuery(load);

    const records = data ?? [];
    const grades = [...new Set(records.flatMap(({ student }) => (student.student ? [student.student.grade] : [])))].sort();
    const classes = [...new Set(records.flatMap(({ student }) => (student.student ? [student.student.room] : [])))].sort((a, b) => a - b);

    const visible = records.filter((record) => {
        const { student } = record.student;
        if (!matchesKeyword(record.student, keyword)) return false;
        if (status !== ALL && (record.status ?? UNCHECKED) !== status) return false;
        if (grade !== ALL && String(student?.grade) !== grade) return false;
        if (klass !== ALL && String(student?.room) !== klass) return false;
        return true;
    });

    const exportCsv = () =>
        downloadCsv(`주말자습_출석기록_${date}.csv`, [
            ['학번', '이름', '시간', '장소', '상태', '체크 시각', '사유'],
            ...visible.map((record) => [
                formatStudentNumber(record.student),
                record.student.name,
                `${record.period}:00`,
                record.place,
                record.status ? STATUS_LABEL[record.status] : '미체크',
                record.checkedAt?.replace('T', ' ').slice(0, 16) ?? '',
                record.reason ?? '',
            ]),
        ]);

    return (
        <RecordsShell
            tab="daily"
            onTab={onTab}
            keyword={keyword}
            onKeyword={setKeyword}
            canExport={!isLoading && !isError && visible.length > 0}
            onExport={exportCsv}
        >
            {authFailure ? (
                <AuthNotice failure={authFailure} onRetry={retry} />
            ) : (
                <>
                    <DateField label="날짜" value={date} onChange={setDate} />

                    <div className="chips">
                        <Dropdown items={STATUS_FILTER} value={status} onSelectedItemChange={(item) => setStatus(item.value)} customStyle={FILTER_STYLE} />
                        <Dropdown
                            items={[{ name: '모든 학년', value: ALL }, ...grades.map((each) => ({ name: `${each}학년`, value: String(each) }))]}
                            value={grade}
                            onSelectedItemChange={(item) => setGrade(item.value)}
                            customStyle={FILTER_STYLE}
                        />
                        <Dropdown
                            items={[{ name: '모든 학반', value: ALL }, ...classes.map((each) => ({ name: `${each}반`, value: String(each) }))]}
                            value={klass}
                            onSelectedItemChange={(item) => setKlass(item.value)}
                            customStyle={FILTER_STYLE}
                        />
                    </div>

                    {isLoading ? (
                        <ListSkeleton />
                    ) : isError ? (
                        <StateCard message="출석 기록을 불러올 수 없어요." onRetry={retry} />
                    ) : visible.length === 0 ? (
                        <StateCard message="조건에 맞는 출석 기록이 없어요." />
                    ) : (
                        <ul className="card">
                            {visible.map((record) => (
                                <li key={record.key} className="row">
                                    <span className="row__main">
                                        <span className="row__title">{record.student.name}</span>
                                        <span className="row__sub">
                                            {[formatStudentNumber(record.student), `${record.period}:00`, record.place]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </span>
                                        {record.reason && <span className="row__sub">사유: {record.reason}</span>}
                                    </span>
                                    <span className={`status-text ${record.status ? STATUS_CLASS[record.status] : ''}`}>
                                        {record.status ? STATUS_LABEL[record.status] : '미체크'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}
        </RecordsShell>
    );
};
