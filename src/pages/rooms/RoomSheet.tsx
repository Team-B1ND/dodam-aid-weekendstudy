import { useState } from 'react';
import { TextField } from '@b1nd/dodam-design-system/components';
import { Sheet } from '../../components/Sheet';
import { Segment } from '../../components/Segment';
import { createRoom, updateRoom, type Room } from '../../api/weekendStudy';
import { getErrorMessage } from '../../api/error';

const FLOORS = [
    { label: '2층', value: 2 },
    { label: '3층', value: 3 },
];

export const RoomSheet = ({
    room,
    onClose,
    onSaved,
    onDelete,
}: {
    room: Room | null;
    onClose: () => void;
    onSaved: () => void;
    onDelete: (room: Room) => void;
}) => {
    const [name, setName] = useState(room?.name ?? '');
    const [floor, setFloor] = useState(room?.floor ?? FLOORS[0].value);
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const save = async () => {
        setIsPending(true);
        setError(null);
        try {
            const body = { name: name.trim(), floor };
            await (room ? updateRoom(room.id, body) : createRoom(body));
            onSaved();
        } catch (e) {
            console.error(e);
            setError(getErrorMessage(e, '실을 저장하지 못했어요.'));
            setIsPending(false);
        }
    };

    return (
        <Sheet label={room ? '실 수정' : '실 추가'} onClose={onClose}>
            <h2 className="sheet__title">{room ? '실 수정' : '실 추가'}</h2>

            <TextField
                type="text"
                label="실 이름"
                value={name}
                onChange={(event) => setName(event.target.value)}
                onRemoveClick={() => setName('')}
            />

            <div className="sheet__group">
                <span className="field__label">층</span>
                <Segment items={FLOORS} value={floor} onChange={setFloor} />
            </div>

            {error && <p className="error-text">{error}</p>}

            <div className="button-row">
                {room && (
                    <button type="button" className="btn btn--negative btn--large" onClick={() => onDelete(room)}>
                        삭제
                    </button>
                )}
                <button
                    type="button"
                    className="btn btn--primary btn--large btn--grow"
                    disabled={isPending || !name.trim()}
                    onClick={() => void save()}
                >
                    저장
                </button>
            </div>
        </Sheet>
    );
};
