import { Calendar } from '@b1nd/dodam-design-system/icons/mono';
import { addDays, formatDate, isSunday } from '../../utils/date';

export const DateField = ({
    label,
    value,
    onChange,
    min,
}: {
    label: string;
    value: string;
    onChange: (date: string) => void;
    min?: string;
}) => {
    const handleChange = (next: string) => {
        if (!next) return;
        let sunday = next;
        while (!isSunday(sunday)) sunday = addDays(sunday, 1);
        onChange(sunday);
    };

    return (
        <label className="field">
            <span className="field__label">{label}</span>
            <span className="date-field">
                {formatDate(value)}
                <Calendar size={20} color="currentColor" />
                <input
                    type="date"
                    className="date-field__input"
                    value={value}
                    min={min}
                    onChange={(event) => handleChange(event.target.value)}
                    onClick={(event) => event.currentTarget.showPicker?.()}
                />
            </span>
        </label>
    );
};
