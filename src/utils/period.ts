import { getToday } from './date';

export const PERIODS = [17, 18, 19, 20] as const;

export const getOngoingPeriod = (date: string) => {
    if (date !== getToday()) return null;
    const hour = new Date().getHours();
    return PERIODS.find((period) => period === hour) ?? null;
};

export const getDefaultPeriod = (date: string) => getOngoingPeriod(date) ?? PERIODS[0];

export const isPeriodOver = (date: string, period: number) => {
    const today = getToday();
    if (date !== today) return date < today;
    return new Date().getHours() >= period + 1;
};

export const formatPeriods = (periods: number[]) => {
    const sorted = [...new Set(periods)].sort((a, b) => a - b);
    const runs: [number, number][] = [];

    for (const period of sorted) {
        const last = runs[runs.length - 1];
        if (last && last[1] === period) last[1] = period + 1;
        else runs.push([period, period + 1]);
    }

    return runs.map(([start, end]) => `${start}–${end}시`).join(', ');
};

export const PERIOD_ITEMS = PERIODS.map((period) => ({ label: `${period}시`, value: period as number }));

export const formatPeriodTimes = (periods: number[]) =>
    formatPeriods(periods)
        .split(', ')
        .map((range) => {
            const [start, end] = range.replace('시', '').split('–');
            return `${start}:00 – ${end}:00`;
        })
        .join(', ');
