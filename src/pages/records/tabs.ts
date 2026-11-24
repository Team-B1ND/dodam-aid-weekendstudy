export type RecordsTab = 'daily' | 'summary';

export const RECORD_TABS: { label: string; value: RecordsTab }[] = [
    { label: '기록', value: 'daily' },
    { label: '학생별 누적', value: 'summary' },
];
