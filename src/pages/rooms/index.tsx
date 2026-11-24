import { useState } from 'react';
import { useRouter } from '@b1nd/aid-kit/navigation';
import { Switch } from '@b1nd/dodam-design-system/components';
import { Screen } from '../../components/Screen';
import { StateCard } from '../../components/StateCard';
import { Segment } from '../../components/Segment';
import { ListSkeleton } from '../../components/Skeleton';
import { Dialog } from '../../components/Dialog';
import { AuthNotice } from '../../components/NoPermission';
import { useQuery } from '../../hooks/useQuery';
import { deleteRoom, getAllRooms, setRoomEnabled, type Room } from '../../api/weekendStudy';
import { getErrorMessage } from '../../api/error';
import { RoomSheet } from './RoomSheet';

const ALL = 0;
const FLOOR_ITEMS = [
    { label: '전체', value: ALL },
    { label: '2층', value: 2 },
    { label: '3층', value: 3 },
];

export const RoomsPage = () => {
    const { stack } = useRouter();
    const [floor, setFloor] = useState(ALL);
    const [editing, setEditing] = useState<Room | null | undefined>(undefined);
    const [deleting, setDeleting] = useState<Room | null>(null);
    const [isPending, setIsPending] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [toggling, setToggling] = useState<Set<number>>(new Set());

    const { data, isLoading, isError, authFailure, refetch, retry } = useQuery(getAllRooms);

    const back = () => stack.pop();

    if (authFailure) {
        return (
            <Screen title="실 관리" onBack={back}>
                <AuthNotice failure={authFailure} onRetry={retry} />
            </Screen>
        );
    }

    const rooms = [...(data ?? [])].sort(
        (a, b) => a.floor - b.floor || a.name.localeCompare(b.name, 'ko', { numeric: true })
    );
    const visible = rooms.filter((room) => floor === ALL || room.floor === floor);

    const toggle = async (room: Room) => {
        setError(null);
        setToggling((prev) => new Set(prev).add(room.id));
        try {
            await setRoomEnabled(room.id, !room.enabled);
            await refetch();
        } catch (e) {
            console.error(e);
            setError(getErrorMessage(e, '실 사용 여부를 바꾸지 못했어요.'));
        } finally {
            setToggling((prev) => {
                const next = new Set(prev);
                next.delete(room.id);
                return next;
            });
        }
    };

    const remove = async (room: Room) => {
        setIsPending(true);
        setDeleteError(null);
        try {
            await deleteRoom(room.id);
            setDeleting(null);
            void refetch();
        } catch (e) {
            console.error(e);
            setDeleteError(getErrorMessage(e, '실을 삭제하지 못했어요.'));
        } finally {
            setIsPending(false);
        }
    };

    return (
        <Screen title="실 관리" onBack={back} onAdd={() => setEditing(null)} addLabel="실 추가">
            <Segment items={FLOOR_ITEMS} value={floor} onChange={setFloor} />

            {error && <p className="error-banner">{error}</p>}

            {isLoading ? (
                <ListSkeleton rows={4} />
            ) : isError ? (
                <StateCard message="실 목록을 불러올 수 없어요." onRetry={retry} />
            ) : visible.length === 0 ? (
                <StateCard message="등록된 실이 없어요." actionLabel="실 추가하기" onAction={() => setEditing(null)} />
            ) : (
                <>
                    <ul className="card">
                        {visible.map((room) => (
                            <li key={room.id} className={`row${room.enabled ? '' : ' row--muted'}`}>
                                <button
                                    type="button"
                                    className="row__main row__tap"
                                    aria-label={`${room.name} 수정`}
                                    onClick={() => setEditing(room)}
                                >
                                    <span className="row__title">{room.name}</span>
                                    <span className="row__sub">{room.floor}층</span>
                                </button>
                                <Switch
                                    checked={room.enabled}
                                    disabled={toggling.has(room.id)}
                                    onChange={() => void toggle(room)}
                                />
                            </li>
                        ))}
                    </ul>
                    <p className="hint">사용하지 않는 실은 꺼두면 학생 신청 목록에 나오지 않아요.</p>
                </>
            )}

            {editing !== undefined && (
                <RoomSheet
                    room={editing}
                    onClose={() => setEditing(undefined)}
                    onDelete={(room) => {
                        setEditing(undefined);
                        setDeleteError(null);
                        setDeleting(room);
                    }}
                    onSaved={() => {
                        setEditing(undefined);
                        void refetch();
                    }}
                />
            )}

            {deleting && (
                <Dialog label="실 삭제" onClose={() => !isPending && setDeleting(null)}>
                    <h2 className="dialog__title">{deleting.name}을(를) 삭제할까요?</h2>
                    <p className="dialog__row">삭제한 실은 학생 신청 목록에서 사라져요.</p>
                    {deleteError && <p className="dialog__error">{deleteError}</p>}
                    <div className="dialog__action-row">
                        <button
                            type="button"
                            className="dialog__button dialog__button--neutral"
                            disabled={isPending}
                            onClick={() => setDeleting(null)}
                        >
                            닫기
                        </button>
                        <button
                            type="button"
                            className="dialog__button dialog__button--danger"
                            disabled={isPending}
                            onClick={() => void remove(deleting)}
                        >
                            삭제
                        </button>
                    </div>
                </Dialog>
            )}
        </Screen>
    );
};

export default RoomsPage;
