import { useCallback, useState } from 'react';
import { Dropdown } from '@b1nd/dodam-design-system/components';
import { StateCard } from '../../components/StateCard';
import { ListSkeleton } from '../../components/Skeleton';
import { AuthNotice } from '../../components/NoPermission';
import { useQuery } from '../../hooks/useQuery';
import { getAttendanceSummaries } from '../../api/weekendStudy';
import { formatShortDate, toYmd } from '../../utils/date';
import { formatStudentNumber, matchesKeyword } from '../../utils/student';
import { downloadCsv } from '../../utils/csv';
import { FILTER_STYLE } from '../filterStyle';
import { RecordsShell } from './RecordsShell';
import type { RecordsTab } from './tabs';

const ALL = 'all';

const MONTHS = Array.from({ length: 6 }, (_, index) => {
    const now = new Date();
    const month = new Date(now.getFullYear(), now.getMonth() - index, 1);
    return {
        name: `${month.getFullYear()}년 ${month.getMonth() + 1}월`,
        value: toYmd(month).slice(0, 7),
    };
});

const rangeOf = (month: string) => {
    const [year, monthIndex] = month.split('-').map(Number);
    return { startAt: `${month}-01`, endAt: toYmd(new Date(year, monthIndex, 0)) };
};

export const StudentSummaries = ({ onTab }: { onTab: (tab: RecordsTab) => void }) => {
    const [month, setMonth] = useState(MONTHS[0].value);
    const [klass, setKlass] = useState(ALL);
    const [keyword, setKeyword] = useState('');
    const { startAt, endAt } = rangeOf(month);

    const load = useCallback(() => getAttendanceSummaries(startAt, endAt), [startAt, endAt]);
    const { data, isLoading, isError, authFailure, retry } = useQuery(load);

    const classes = [
        ...new Set((data ?? []).flatMap(({ student }) => (student.student ? [`${student.student.grade}-${student.student.room}`] : []))),
    ].sort();

    const visible = (data ?? []).filter(({ student }) => {
        if (!matchesKeyword(student, keyword)) return false;
        if (klass !== ALL && `${student.student?.grade}-${student.student?.room}` !== klass) return false;
        return true;
    });

    const exportCsv = () =>
        downloadCsv(`주말자습_학생별누적_${month}.csv`, [
            ['이름', '학번', '출석', '지각', '결석'],
            ...visible.map(({ student, attendance, late, absent }) => [
                student.name,
                formatStudentNumber(student),
                attendance,
                late,
                absent,
            ]),
        ]);

    return (
        <RecordsShell
            tab="summary"
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
                    <div className="chips">
                        <Dropdown items={MONTHS} value={month} onSelectedItemChange={(item) => setMonth(item.value)} customStyle={FILTER_STYLE} />
                        <Dropdown
                            items={[
                                { name: '모든 반', value: ALL },
                                ...classes.map((each) => ({ name: `${each.replace('-', '학년 ')}반`, value: each })),
                            ]}
                            value={klass}
                            onSelectedItemChange={(item) => setKlass(item.value)}
                            customStyle={FILTER_STYLE}
                        />
                    </div>

                    <p className="hint">
                        선택한 기간 기준 ({formatShortDate(startAt)} ~ {formatShortDate(endAt)})
                    </p>

                    {isLoading ? (
                        <ListSkeleton />
                    ) : isError ? (
                        <StateCard message="학생별 누적을 불러올 수 없어요." onRetry={retry} />
                    ) : visible.length === 0 ? (
                        <StateCard message="조건에 맞는 출석 기록이 없어요." />
                    ) : (
                        <ul className="card">
                            {visible.map(({ student, attendance, late, absent }) => (
                                <li key={student.publicId} className="row">
                                    <span className="row__main">
                                        <span className="row__title">{student.name}</span>
                                        <span className="row__sub">
                                            {formatStudentNumber(student)}
                                            {student.student && ` · ${student.student.grade}학년 ${student.student.room}반`}
                                        </span>
                                    </span>
                                    <span className="counts">
                                        출석 <b className="is-attendance">{attendance}</b>
                                        지각 <b className="is-late">{late}</b>
                                        결석 <b className="is-absent">{absent}</b>
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
