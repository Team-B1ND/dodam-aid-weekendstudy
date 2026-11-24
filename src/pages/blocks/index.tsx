import { useEffect, useRef, useState } from 'react';
import { useRouter } from '@b1nd/aid-kit/navigation';
import { Screen } from '../../components/Screen';
import { StateCard } from '../../components/StateCard';
import { Dialog } from '../../components/Dialog';
import { AuthNotice } from '../../components/NoPermission';
import { ListSkeleton } from '../../components/Skeleton';
import { useQuery } from '../../hooks/useQuery';
import { getAllRooms, getRoomBlocks, unblockRoom } from '../../api/weekendStudy';
import { getErrorMessage } from '../../api/error';
import { formatDate, formatShortDate, getToday } from '../../utils/date';
import { formatPeriods } from '../../utils/period';
import { PATHS } from '../../routes';

interface BlockGroup {
    key: string;
    roomId: number;
    roomName: string;
    description: string;
    startAt: string;
    endAt: string;
    periods: number[];
    blockIds: number[];
}

const loadGroups = async () => {
    const rooms = await getAllRooms();
    const blocksByRoom = await Promise.all(rooms.map((room) => getRoomBlocks(room.id)));
    const today = getToday();
    const groups = new Map<string, BlockGroup>();

    rooms.forEach((room, index) => {
        for (const block of blocksByRoom[index]) {
            if (block.endAt < today) continue;
            const key = [room.id, block.description, block.startAt, block.endAt].join('|');
            const group = groups.get(key) ?? {
                key,
                roomId: room.id,
                roomName: room.name,
                description: block.description,
                startAt: block.startAt,
                endAt: block.endAt,
                periods: [],
                blockIds: [],
            };
            group.periods.push(block.period);
            group.blockIds.push(block.id);
            groups.set(key, group);
        }
    });

    return [...groups.values()].sort((a, b) => a.startAt.localeCompare(b.startAt));
};

const isWeekly = (group: BlockGroup) => group.startAt !== group.endAt;

const scheduleOf = (group: BlockGroup) =>
    `${isWeekly(group) ? '매주 일' : formatDate(group.startAt)} · ${formatPeriods(group.periods)}`;

export const BlocksPage = () => {
    const { stack } = useRouter();
    const [target, setTarget] = useState<BlockGroup | null>(null);
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { data, isLoading, isError, authFailure, refetch, retry } = useQuery(loadGroups);

    const stackLength = stack.current.length;
    const previousLength = useRef(stackLength);
    useEffect(() => {
        if (stackLength < previousLength.current) void refetch();
        previousLength.current = stackLength;
    }, [stackLength, refetch]);

    const back = () => stack.pop();

    if (authFailure) {
        return (
            <Screen title="실 사용 제한" onBack={back}>
                <AuthNotice failure={authFailure} onRetry={retry} />
            </Screen>
        );
    }

    const release = async (group: BlockGroup) => {
        setIsPending(true);
        setError(null);
        try {
            for (const blockId of group.blockIds) await unblockRoom(group.roomId, blockId);
            setTarget(null);
        } catch (e) {
            console.error(e);
            setError(getErrorMessage(e, '사용 제한을 해제하지 못했어요.'));
        } finally {
            setIsPending(false);
            void refetch();
        }
    };

    return (
        <Screen title="실 사용 제한" onBack={back} onAdd={() => stack.push(PATHS.newBlock)} addLabel="사용 제한 등록">
            {isLoading ? (
                <ListSkeleton rows={3} />
            ) : isError ? (
                <StateCard message="사용 제한 목록을 불러올 수 없어요." onRetry={retry} />
            ) : data?.length === 0 ? (
                <>
                    <StateCard
                        message="등록된 사용 제한이 없어요."
                        actionLabel="사용 제한 등록하기"
                        onAction={() => stack.push(PATHS.newBlock)}
                    />
                    <p className="hint">해제하면 그 시간은 바로 다시 신청할 수 있어요.</p>
                </>
            ) : (
                <>
                    <ul className="card">
                        {data?.map((group) => (
                            <li key={group.key} className="row">
                                <span className="row__main">
                                    <span className="row__title">{group.roomName}</span>
                                    <span className="row__sub">{scheduleOf(group)}</span>
                                    <span className="row__sub">
                                        {group.description}
                                        {isWeekly(group) && ` · ${formatShortDate(group.endAt)}까지`}
                                    </span>
                                </span>
                                <button
                                    type="button"
                                    className="btn btn--assistive btn--small"
                                    onClick={() => {
                                        setError(null);
                                        setTarget(group);
                                    }}
                                >
                                    해제
                                </button>
                            </li>
                        ))}
                    </ul>
                    <p className="hint">해제하면 그 시간은 바로 다시 신청할 수 있어요.</p>
                </>
            )}

            {target && (
                <Dialog label="사용 제한 해제" onClose={() => !isPending && setTarget(null)}>
                    <h2 className="dialog__title">사용 제한을 해제하시겠어요?</h2>
                    <p className="dialog__row">
                        {target.roomName} {scheduleOf(target).replace(' · ', ' ')} 제한이 풀려요.
                    </p>
                    {error && <p className="dialog__error">{error}</p>}
                    <div className="dialog__action-row">
                        <button
                            type="button"
                            className="dialog__button dialog__button--neutral"
                            disabled={isPending}
                            onClick={() => setTarget(null)}
                        >
                            닫기
                        </button>
                        <button
                            type="button"
                            className="dialog__button dialog__button--danger"
                            disabled={isPending}
                            onClick={() => void release(target)}
                        >
                            해제
                        </button>
                    </div>
                </Dialog>
            )}
        </Screen>
    );
};

export default BlocksPage;
