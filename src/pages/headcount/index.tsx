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
import { getAllApplications, getRooms } from '../../api/weekendStudy';
import { toStudentEntries, type StudentEntry } from '../../utils/applications';
import { getUpcomingSunday } from '../../utils/date';
import { getDefaultPeriod, getOngoingPeriod, PERIOD_ITEMS } from '../../utils/period';
import { FILTER_STYLE } from '../filterStyle';

const ALL = 'all';
type Group = 'floor' | 'room';

const GROUPS: { label: string; value: Group }[] = [
    { label: '층 별', value: 'floor' },
    { label: '실 별', value: 'room' },
];

export const HeadcountPage = () => {
    const { stack } = useRouter();
    const [date, setDate] = useState(getUpcomingSunday);
    const [period, setPeriod] = useState<number>(() => getDefaultPeriod(date));
    const [group, setGroup] = useState<Group>('floor');
    const [floor, setFloor] = useState(ALL);

    const load = useCallback(async () => {
        const [applications, rooms] = await Promise.all([getAllApplications(date), getRooms()]);
        return { entries: toStudentEntries(applications), rooms };
    }, [date]);
    const { data, isLoading, isError, authFailure, retry } = useQuery(load);

    const back = () => stack.pop();

    if (authFailure) {
        return (
            <Screen title="인원 조회" onBack={back}>
                <AuthNotice failure={authFailure} onRetry={retry} />
            </Screen>
        );
    }

    const rooms = data?.rooms ?? [];
    const floorOf = new Map(rooms.map((room) => [room.id, room.floor]));
    const floors = [...new Set(rooms.map((room) => room.floor))].sort((a, b) => a - b);
    const entries = (data?.entries ?? []).filter((entry) => entry.periods.includes(period));

    const count = (match: (entry: StudentEntry) => boolean) =>
        new Set(entries.filter(match).map((entry) => entry.applicant.publicId)).size;
    const inFloor = (entry: StudentEntry) =>
        floor === ALL || (entry.roomId !== null && floorOf.get(entry.roomId) === Number(floor));

    const groups =
        group === 'floor'
            ? floors
                  .filter((each) => floor === ALL || each === Number(floor))
                  .map((each) => ({
                      key: `floor-${each}`,
                      label: `${each}층`,
                      count: count((entry) => entry.roomId !== null && floorOf.get(entry.roomId) === each),
                  }))
            : rooms
                  .filter((room) => floor === ALL || room.floor === Number(floor))
                  .map((room) => ({ key: `room-${room.id}`, label: room.name, count: count((entry) => entry.roomId === room.id) }));

    const classroom =
        floor === ALL ? [{ key: 'classroom', label: '교실 (개별 자습)', count: count((entry) => entry.type === 'PERSONAL') }] : [];
    const total = count((entry) => (floor === ALL ? true : entry.type === 'PROJECT' && inFloor(entry)));

    return (
        <Screen title="인원 조회" onBack={back}>
            <DateField label="날짜" value={date} onChange={setDate} />
            <Segment items={PERIOD_ITEMS} value={period} onChange={setPeriod} />
            <Segment items={GROUPS} value={group} onChange={setGroup} />

            <div className="chips">
                <Dropdown
                    items={[{ name: '모든 층', value: ALL }, ...floors.map((each) => ({ name: `${each}층`, value: String(each) }))]}
                    value={floor}
                    onSelectedItemChange={(item) => setFloor(item.value)}
                    customStyle={FILTER_STYLE}
                />
            </div>

            {isLoading ? (
                <ListSkeleton rows={4} />
            ) : isError ? (
                <StateCard message="인원을 불러올 수 없어요." onRetry={retry} />
            ) : (
                <>
                    <h2 className="section-title">
                        {period}시 인원 {total}명
                        {getOngoingPeriod(date) === period && <span className="section-title__tag">진행 중</span>}
                    </h2>
                    <ul className="card">
                        {[...groups, ...classroom, { key: 'total', label: '전체', count: total }].map((item) => (
                            <li key={item.key} className={`row${item.key === 'total' ? ' row--total' : ''}`}>
                                <span className="row__main row__title">{item.label}</span>
                                <span className="row__title">{item.count}명</span>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </Screen>
    );
};

export default HeadcountPage;
