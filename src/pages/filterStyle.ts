import type { ComponentProps } from 'react';
import type { Dropdown } from '@b1nd/dodam-design-system/components';

type DropdownStyle = NonNullable<ComponentProps<typeof Dropdown>['customStyle']>;

export const FILTER_STYLE: DropdownStyle = {
    height: '40px',
    gap: '6px',
    padding: '8px 10px',
    '> p': { fontSize: '14px', whiteSpace: 'nowrap' },
    '> div > div': { whiteSpace: 'nowrap', fontSize: '14px' },
};
