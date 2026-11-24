import { useCallback, useState } from 'react';
import { useRouter } from '@b1nd/aid-kit/navigation';
import { ChevronRight } from '@b1nd/dodam-design-system/icons/mono';
import { Screen } from '../../components/Screen';
import { StateCard } from '../../components/StateCard';
import { AuthNotice } from '../../components/NoPermission';
import { useQuery } from '../../hooks/useQuery';
import { getAttendanceStatuses } from '../../api/weekendStudy';
import { formatDate, getUpcomingSunday } from '../../utils/date';
import { getDefaultPeriod, getOngoingPeriod } from '../../utils/period';
import { PATHS } from '../../routes';

const MENUS: { path: string; title: string; description: string }[] = [
];

export const HomePage = () => {
    const { stack } = useRouter();
    const [date] = useState(getUpcomingSunday);
    const ongoing = getOngoingPeriod(date);
    const period = getDefaultPeriod(date);

    const load = useCallback(() => getAttendanceStatuses(date, period), [date, period]);
    const { data, isLoading, isError, authFailure, retry } = useQuery(load);

    if (authFailure) {
        return (
            <Screen title="주말 자습 관리">
                <AuthNotice failure={authFailure} onRetry={retry} />
            </Screen>
        );
    }

    const rows = data ?? [];
    const attended = rows.filter((row) => row.status === 'ATTENDANCE' || row.status === 'LATE').length;
    const unchecked = rows.filter((row) => row.status === null).length;

    return (
        <Screen title="주말 자습 관리">
            {isLoading || isError ? (
                <StateCard isLoading={isLoading} message="오늘 현황을 불러올 수 없어요." onRetry={retry} />
            ) : (
                <section className="card summary">
                    <div className="summary__head">
                        <h2 className="summary__date">{formatDate(date)}</h2>
                        <span className={`badge${ongoing === null ? ' badge--muted' : ''}`}>
                            {ongoing === null ? `${period}시 기준` : `${period}시 진행 중`}
                        </span>
                    </div>

                    <dl className="summary__stats">
                        <div>
                            <dd>{rows.length}명</dd>
                            <dt>신청</dt>
                        </div>
                        <div>
                            <dd className="is-brand">{attended}명</dd>
                            <dt>출석</dt>
                        </div>
                        <div>
                            <dd className="is-muted">{unchecked}명</dd>
                            <dt>미체크</dt>
                        </div>
                    </dl>

                    <button
                        type="button"
                        className="btn btn--primary btn--block btn--large"
                        onClick={() => stack.push(PATHS.attendance)}
                    >
                        출석 체크하기
                    </button>
                </section>
            )}

            <nav className="card" aria-label="관리 메뉴">
                {MENUS.map((menu) => (
                    <button
                        key={menu.path}
                        type="button"
                        className="row row--button"
                        onClick={() => stack.push(menu.path)}
                    >
                        <span className="row__main">
                            <span className="row__title">{menu.title}</span>
                            <span className="row__sub">{menu.description}</span>
                        </span>
                        <ChevronRight size={20} color="currentColor" />
                    </button>
                ))}
            </nav>
        </Screen>
    );
};

export default HomePage;
