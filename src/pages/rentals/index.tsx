import { useCallback, useState } from 'react';
import { useRouter } from '@b1nd/aid-kit/navigation';
import { Dropdown } from '@b1nd/dodam-design-system/components';
import { ChevronRight } from '@b1nd/dodam-design-system/icons/mono';
import { Screen } from '../../components/Screen';
import { StateCard } from '../../components/StateCard';
import { DateField } from '../../components/DateField';
import { ListSkeleton } from '../../components/Skeleton';
import { AuthNotice } from '../../components/NoPermission';
import { useQuery } from '../../hooks/useQuery';
import { getApplications, getRooms, type Application } from '../../api/weekendStudy';
import { getUpcomingSunday } from '../../utils/date';
import { formatPeriods, PERIODS } from '../../utils/period';
import { FILTER_STYLE } from '../filterStyle';
import { leaderLabel } from '../../utils/applications';
import { RentalSheet } from './RentalSheet';

const ALL = 'all';

const PERIOD_FILTER = [
    { name: '모든 시간', value: ALL },
    ...PERIODS.map((period) => ({ name: formatPeriods([period]), value: String(period) })),
];

export const RentalsPage = () => {
    const { stack } = useRouter();
    const [date, setDate] = useState(getUpcomingSunday);
    const [period, setPeriod] = useState(ALL);
    const [room, setRoom] = useState(ALL);
    const [selected, setSelected] = useState<Application | null>(null);

    const load = useCallback(async () => {
        const [applications, rooms] = await Promise.all([getApplications(date, 'PROJECT'), getRooms()]);
        return { applications, rooms };
    }, [date]);
    const { data, isLoading, isError, authFailure, retry } = useQuery(load);

    const back = () => stack.pop();

    if (authFailure) {
        return (
            <Screen title="실 대여" onBack={back}>
                <AuthNotice failure={authFailure} onRetry={retry} />
            </Screen>
        );
    }

    const visible = (data?.applications ?? []).filter(
        (application) =>
            (period === ALL || application.periods.includes(Number(period))) &&
            (room === ALL || String(application.room?.id) === room)
    );

    return (
        <Screen title="실 대여" onBack={back}>
            <DateField label="날짜" value={date} onChange={setDate} />

            <div className="chips">
                <Dropdown items={PERIOD_FILTER} value={period} onSelectedItemChange={(item) => setPeriod(item.value)} customStyle={FILTER_STYLE} />
                <Dropdown
                    items={[
                        { name: '모든 실', value: ALL },
                        ...(data?.rooms ?? []).map((each) => ({ name: each.name, value: String(each.id) })),
                    ]}
                    value={room}
                    onSelectedItemChange={(item) => setRoom(item.value)}
                    customStyle={FILTER_STYLE}
                />
            </div>

            {isLoading ? (
                <ListSkeleton rows={3} />
            ) : isError ? (
                <StateCard message="실 대여 신청을 불러올 수 없어요." onRetry={retry} />
            ) : (
                <>
                    <h2 className="section-title">실 대여 {visible.length}건</h2>
                    {visible.length === 0 ? (
                        <StateCard message="실 대여 신청이 없어요." />
                    ) : (
                        <ul className="card">
                            {visible.map((application) => (
                                <li key={application.id}>
                                    <button type="button" className="row row--button" onClick={() => setSelected(application)}>
                                        <span className="row__main">
                                            <span className="row__title">{application.name}</span>
                                            <span className="row__sub">
                                                {application.room?.name ?? '-'} · {formatPeriods(application.periods)}
                                            </span>
                                            <span className="row__sub">{leaderLabel(application)}</span>
                                        </span>
                                        <ChevronRight size={20} color="currentColor" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}

            {selected && <RentalSheet application={selected} onClose={() => setSelected(null)} />}
        </Screen>
    );
};

export default RentalsPage;
