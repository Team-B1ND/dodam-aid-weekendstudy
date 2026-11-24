import { SegmentedButton } from '@b1nd/dodam-design-system/components';

export const Segment = <T extends string | number>({
    items,
    value,
    onChange,
}: {
    items: { label: string; value: T }[];
    value: T;
    onChange: (value: T) => void;
}) => (
    <SegmentedButton
        data={items.map((item) => ({
            text: item.label,
            value: String(item.value),
            isActive: item.value === value,
        }))}
        setData={() => {}}
        onBlockClick={(next) => {
            const item = items.find((each) => String(each.value) === next);
            if (item) onChange(item.value);
        }}
        width="100%"
    />
);
