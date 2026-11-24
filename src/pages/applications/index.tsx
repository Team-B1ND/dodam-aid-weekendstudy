import { useCallback, useState } from 'react';
import { useRouter } from '@b1nd/aid-kit/navigation';
import { Dropdown } from '@b1nd/dodam-design-system/components';
import { Screen } from '../../components/Screen';
import { StateCard } from '../../components/StateCard';
import { DateField } from '../../components/DateField';
import { Segment } from '../../components/Segment';
import { AuthNotice } from '../../components/NoPermission';
import { ListSkeleton } from '../../components/Skeleton';

import { useQuery } from '../../hooks/useQuery';
import { getAllApplications, getRooms } from '../../api/weekendStudy';
import { sortByStudent, toStudentEntries, TYPE_LABEL } from '../../utils/applications';
import { getUpcomingSunday } from '../../utils/date';
import { formatPeriods, getDefaultPeriod, getOngoingPeriod, PERIOD_ITEMS } from '../../utils/period';
import { formatStudentNumber } from '../../utils/student';
import { FILTER_STYLE } from '../filterStyle';

const ALL = 'all';

const TYPES = [
    { name: '모든 유형', value: ALL },
    { name: '개별 자습', value: 'PERSONAL' },
    { name: '실 대여', value: 'PROJECT' },
];

export const ApplicationsPage = () => {
    const { stack } = useRouter();
    const [date, setDate] = useState(getUpcomingSunday);
    const [period, setPeriod] = useState<number>(() => getDefaultPeriod(date));
    const [type, setType] = useState(ALL);
    const [floor, setFloor] = useState(ALL);
    const [klass, setKlass] = useState(ALL);

    const load = useCallback(
        async () => {
            const [applications, rooms] = await Promise.all([getAllApplications(date), getRooms()]);
            return { entries: toStudentEntries(applications), rooms };
        },
        [date]
    );
    const { data, isLoading, isError, authFailure, retry } = useQuery(load);

    const back = () => stack.pop();

    if (authFailure) {
        return (
            <Screen title="신청 현황" onBack={back}>
                <AuthNotice failure={authFailure} onRetry={retry} />
            </Screen>
        );
    }

    const floorOf = new Map(data?.rooms.map((room) => [room.id, room.floor]));
    const inPeriod = (data?.entries ?? []).filter((entry) => entry.periods.includes(period));

    const floors = [...new Set(data?.rooms.map((room) => room.floor))].sort((a, b) => a - b);
    const classes = [
        ...new Set(
            inPeriod.flatMap(({ applicant: { student } }) =>
                student ? [`${student.grade}-${student.room}`] : []
            )
        ),
    ].sort();

    const visible = sortByStudent(
        inPeriod.filter((entry) => {
            const { student } = entry.applicant;
            if (type !== ALL && entry.type !== type) return false;
            if (floor !== ALL && floorOf.get(entry.roomId ?? -1) !== Number(floor)) return false;
            if (klass !== ALL && `${student?.grade}-${student?.room}` !== klass) return false;
            return true;
        })
    );

    return (
        <Screen title="신청 현황" onBack={back}>
            <DateField label="날짜" value={date} onChange={setDate} />
            <Segment items={PERIOD_ITEMS} value={period} onChange={setPeriod} />

            <div className="chips">
                <Dropdown items={TYPES} value={type} onSelectedItemChange={(item) => setType(item.value)} customStyle={FILTER_STYLE} />
                <Dropdown
                    items={[{ name: '모든 층', value: ALL }, ...floors.map((each) => ({ name: `${each}층`, value: String(each) }))]}
                    value={floor}
                    onSelectedItemChange={(item) => setFloor(item.value)}
                    customStyle={FILTER_STYLE}
                />
                <Dropdown
                    items={[
                        { name: '모든 학반', value: ALL },
                        ...classes.map((each) => ({ name: `${each.replace('-', '학년 ')}반`, value: each })),
                    ]}
                    value={klass}
                    onSelectedItemChange={(item) => setKlass(item.value)}
                    customStyle={FILTER_STYLE}
                />
            </div>

            {isLoading ? (
                <ListSkeleton />
            ) : isError ? (
                <StateCard message="신청 현황을 불러올 수 없어요." onRetry={retry} />
            ) : (
                <>
                    <h2 className="section-title">
                        {period}시 신청 {visible.length}명
                        {getOngoingPeriod(date) === period && <span className="section-title__tag">진행 중</span>}
                    </h2>

                    {visible.length === 0 ? (
                        <StateCard message="이 시간에 신청한 학생이 없어요." />
                    ) : (
                        <ul className="card">
                            {visible.map((entry) => (
                                <li key={entry.key} className="row">
                                    <span className="row__main">
                                        <span className="row__title">{entry.applicant.name}</span>
                                        <span className="row__sub">
                                            {[formatStudentNumber(entry.applicant), TYPE_LABEL[entry.type], entry.place]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </span>
                                        <span className="row__sub">{formatPeriods(entry.periods)}</span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}

        </Screen>
    );
};

export default ApplicationsPage;
