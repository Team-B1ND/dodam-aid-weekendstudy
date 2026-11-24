import { useCallback, useState } from 'react';
import { useRouter } from '@b1nd/aid-kit/navigation';
import { Dropdown } from '@b1nd/dodam-design-system/components';
import { Screen } from '../../components/Screen';
import { StateCard } from '../../components/StateCard';
import { DateField } from '../../components/DateField';
import { Segment } from '../../components/Segment';
import { ListSkeleton } from '../../components/Skeleton';
import { AuthNotice } from '../../components/NoPermission';
import { useQuery } from '../../hooks/useQuery';
import { cancelAttendance, checkAttendance, getAllApplications, getAttendanceStatuses } from '../../api/weekendStudy';
import { getErrorMessage } from '../../api/error';
import { sortByStudent, statusKey, toStudentEntries, type StudentEntry } from '../../utils/applications';
import { getUpcomingSunday } from '../../utils/date';
import { formatPeriods, getDefaultPeriod, isPeriodOver, PERIOD_ITEMS } from '../../utils/period';
import { formatStudentNumber } from '../../utils/student';
import { runWithLimit } from '../../utils/concurrency';
import { FILTER_STYLE } from '../filterStyle';
import { AttendanceEditSheet } from './AttendanceEditSheet';
import { STATUS_OPTIONS, type Status } from './status';

const ALL = 'all';

const save = (entry: StudentEntry, date: string, period: number, status: Status, reason?: string) =>
    status
        ? checkAttendance(entry.applicant.publicId, { date, period, status, reason })
        : cancelAttendance(entry.applicant.publicId, { date, period });

const loadRoster = async (date: string) => {
    const [applications, statuses] = await Promise.all([getAllApplications(date), getAttendanceStatuses(date)]);
    return {
        entries: toStudentEntries(applications),
        statuses: new Map(statuses.map((row) => [statusKey(row.student.publicId, row.period), row.status])),
    };
};

export const AttendanceCheckPage = () => {
    const { stack } = useRouter();
    const [date, setDate] = useState(getUpcomingSunday);
    const [period, setPeriod] = useState<number>(() => getDefaultPeriod(date));
    const [place, setPlace] = useState(ALL);
    const [changed, setChanged] = useState<Record<string, Status>>({});
    const [pending, setPending] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<{ entry: StudentEntry; status: Status } | null>(null);

    const load = useCallback(() => loadRoster(date), [date]);
    const { data, isLoading, isError, authFailure, retry } = useQuery(load);

    const back = () => stack.pop();

    if (authFailure) {
        return (
            <Screen title="출석 체크" onBack={back}>
                <AuthNotice failure={authFailure} onRetry={retry} />
            </Screen>
        );
    }

    const keyOf = (entry: StudentEntry) => `${date}|${statusKey(entry.applicant.publicId, period)}`;
    const statusOf = (entry: StudentEntry): Status => {
        const key = keyOf(entry);
        if (key in changed) return changed[key];
        return data?.statuses.get(statusKey(entry.applicant.publicId, period)) ?? null;
    };

    const inPeriod = sortByStudent((data?.entries ?? []).filter((entry) => entry.periods.includes(period)));
    const places = [...new Set(inPeriod.map((entry) => entry.place))].sort();
    const visible = inPeriod.filter((entry) => place === ALL || entry.place === place);
    const unchecked = visible.filter((entry) => !statusOf(entry));
    const isOver = isPeriodOver(date, period);

    const apply = async (entries: StudentEntry[], status: Status, reason?: string) => {
        const keys = entries.map(keyOf);
        setError(null);
        setPending((prev) => new Set([...prev, ...keys]));

        const failures = (
            await runWithLimit(
                entries.map((entry, index) => async () => {
                    try {
                        await save(entry, date, period, status, reason);
                        setChanged((prev) => ({ ...prev, [keys[index]]: status }));
                        return null;
                    } catch (e) {
                        console.error(e);
                        return getErrorMessage(e, '출석을 체크하지 못했어요.');
                    }
                }),
                6
            )
        ).filter((message): message is string => message !== null);

        setPending((prev) => new Set([...prev].filter((key) => !keys.includes(key))));
        return failures;
    };

    const applyAndReport = async (entries: StudentEntry[], status: Status) => {
        const failures = await apply(entries, status);
        if (failures.length === 1) setError(failures[0]);
        else if (failures.length > 1) setError(`${failures.length}명을 체크하지 못했어요. ${failures[0]}`);
    };

    const handleTap = (entry: StudentEntry, status: Status) => {
        if (statusOf(entry) === status) return;
        if (isOver) setEditing({ entry, status });
        else void applyAndReport([entry], status);
    };

    const isUnavailable = isLoading || isError;

    return (
        <Screen title="출석 체크" onBack={back}>
            <DateField label="날짜" value={date} onChange={setDate} />
            <Segment items={PERIOD_ITEMS} value={period} onChange={setPeriod} />

            <div className="chips chips--spread">
                <Dropdown
                    items={[{ name: '모든 장소', value: ALL }, ...places.map((each) => ({ name: each, value: each }))]}
                    value={place}
                    onSelectedItemChange={(item) => setPlace(item.value)}
                    customStyle={FILTER_STYLE}
                />
                <button
                    type="button"
                    className="btn btn--assistive btn--small"
                    disabled={isUnavailable || isOver || unchecked.length === 0}
                    onClick={() => void applyAndReport(unchecked, 'ATTENDANCE')}
                >
                    전원 출석
                </button>
            </div>

            {isLoading ? (
                <ListSkeleton withButtons />
            ) : isError ? (
                <StateCard message="출석 명단을 불러올 수 없어요." onRetry={retry} />
            ) : (
                <>
                    <p className="hint">
                        {period}시 신청 {visible.length}명 · {isOver ? '체크 시간 종료' : `미체크 ${unchecked.length}명`}
                    </p>

                    {error && !editing && <p className="error-banner">{error}</p>}

                    {visible.length === 0 ? (
                        <StateCard message="이 시간에 출석 체크할 학생이 없어요." />
                    ) : (
                        <ul className="card">
                            {visible.map((entry) => {
                                const current = statusOf(entry);
                                const isPending = pending.has(keyOf(entry));

                                return (
                                    <li key={entry.key} className="row row--stack">
                                        <span className="row__inline">
                                            <span className="row__title">{entry.applicant.name}</span>
                                            <span className="row__sub">
                                                {formatStudentNumber(entry.applicant)} · {formatPeriods(entry.periods)}
                                            </span>
                                        </span>
                                        <div className="status-buttons" role="group" aria-label={`${entry.applicant.name} 출결`}>
                                            {STATUS_OPTIONS.map((option) => (
                                                <button
                                                    key={option.label}
                                                    type="button"
                                                    className={`status-button ${current === option.value ? option.className : ''}`}
                                                    aria-pressed={current === option.value}
                                                    disabled={isPending}
                                                    onClick={() => handleTap(entry, option.value)}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </>
            )}

            {editing && (
                <AttendanceEditSheet
                    entry={editing.entry}
                    date={date}
                    period={period}
                    current={statusOf(editing.entry)}
                    initial={editing.status}
                    error={error}
                    isPending={pending.has(keyOf(editing.entry))}
                    onClose={() => {
                        setEditing(null);
                        setError(null);
                    }}
                    onSave={async (status, reason) => {
                        const failures = await apply([editing.entry], status, reason);
                        if (failures.length) setError(failures[0]);
                        else setEditing(null);
                    }}
                />
            )}
        </Screen>
    );
};

export default AttendanceCheckPage;
