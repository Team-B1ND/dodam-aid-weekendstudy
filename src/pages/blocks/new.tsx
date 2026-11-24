import { useState } from 'react';
import { useRouter } from '@b1nd/aid-kit/navigation';
import { Checkbox, Switch, TextField } from '@b1nd/dodam-design-system/components';
import { Screen } from '../../components/Screen';
import { StateCard } from '../../components/StateCard';
import { DateField } from '../../components/DateField';
import { AuthNotice } from '../../components/NoPermission';
import { useQuery } from '../../hooks/useQuery';
import { blockRoom, getRooms } from '../../api/weekendStudy';
import { getErrorMessage } from '../../api/error';
import { getUpcomingSunday } from '../../utils/date';
import { formatPeriods, PERIODS } from '../../utils/period';

const toggle = <T,>(list: T[], item: T) =>
    list.includes(item) ? list.filter((each) => each !== item) : [...list, item];

export const NewBlockPage = () => {
    const { stack } = useRouter();
    const [roomIds, setRoomIds] = useState<number[]>([]);
    const [date, setDate] = useState(getUpcomingSunday);
    const [description, setDescription] = useState('');
    const [periods, setPeriods] = useState<number[]>([]);
    const [isWeekly, setIsWeekly] = useState(false);
    const [endAt, setEndAt] = useState(date);
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { data: rooms, isLoading, isError, authFailure, retry } = useQuery(getRooms);

    const back = () => stack.pop();

    if (authFailure) {
        return (
            <Screen title="사용 제한 등록" onBack={back}>
                <AuthNotice failure={authFailure} onRetry={retry} />
            </Screen>
        );
    }

    const lastDay = isWeekly ? endAt : date;
    const canSubmit = !isPending && roomIds.length > 0 && periods.length > 0 && description.trim() !== '';

    const submit = async () => {
        setIsPending(true);
        setError(null);
        const body = { startAt: date, endAt: lastDay, periods, description: description.trim() };
        const done: number[] = [];

        try {
            for (const roomId of roomIds) {
                await blockRoom(roomId, body);
                done.push(roomId);
            }
            stack.pop();
        } catch (e) {
            console.error(e);
            setRoomIds((prev) => prev.filter((id) => !done.includes(id)));
            const message = getErrorMessage(e, '사용 제한을 등록하지 못했어요.');
            setError(done.length ? `${done.length}개 실은 등록했어요. 나머지: ${message}` : message);
            setIsPending(false);
        }
    };

    return (
        <Screen
            title="사용 제한 등록"
            onBack={back}
            footer={
                <div className="button-row">
                    <button type="button" className="btn btn--assistive btn--large" onClick={back}>
                        취소
                    </button>
                    <button
                        type="button"
                        className="btn btn--negative btn--large btn--grow"
                        disabled={!canSubmit}
                        onClick={() => void submit()}
                    >
                        제한 등록하기
                    </button>
                </div>
            }
        >
            {isLoading || isError ? (
                <StateCard isLoading={isLoading} message="실 목록을 불러올 수 없어요." onRetry={retry} />
            ) : (
                <>
                    <section className="form-section">
                        <h2 className="section-title">실 선택</h2>
                        <div className="check-grid">
                            {rooms?.map((room) => (
                                <label key={room.id} className="check-item">
                                    <Checkbox
                                        selected={roomIds.includes(room.id)}
                                        onClick={() => setRoomIds((prev) => toggle(prev, room.id))}
                                    />
                                    {room.name}
                                </label>
                            ))}
                        </div>
                    </section>

                    <DateField
                        label="날짜"
                        value={date}
                        onChange={(next) => {
                            setDate(next);
                            if (endAt < next) setEndAt(next);
                        }}
                    />

                    <TextField
                        type="text"
                        label="사유"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        onRemoveClick={() => setDescription('')}
                    />

                    <section className="form-section">
                        <h2 className="section-title">시간</h2>
                        <div className="check-grid">
                            {PERIODS.map((period) => (
                                <label key={period} className="check-item">
                                    <Checkbox
                                        selected={periods.includes(period)}
                                        onClick={() => setPeriods((prev) => toggle(prev, period))}
                                    />
                                    {formatPeriods([period])}
                                </label>
                            ))}
                        </div>
                    </section>

                    <div className="field">
                        <span className="section-title">매주 반복</span>
                        <Switch checked={isWeekly} onChange={() => setIsWeekly((prev) => !prev)} />
                    </div>
                    {isWeekly && <DateField label="종료일" value={endAt} min={date} onChange={setEndAt} />}

                    {error && <p className="error-banner">{error}</p>}
                </>
            )}
        </Screen>
    );
};

export default NewBlockPage;
