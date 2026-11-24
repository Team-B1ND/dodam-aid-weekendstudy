const pad = (n: number) => String(n).padStart(2, '0');

export const toYmd = (date: Date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parse = (ymd: string) => {
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(y, m - 1, d);
};

export const getToday = () => toYmd(new Date());

export const getUpcomingSunday = () => {
    const now = new Date();
    now.setDate(now.getDate() + ((7 - now.getDay()) % 7));
    return toYmd(now);
};

export const addDays = (ymd: string, days: number) => {
    const date = parse(ymd);
    date.setDate(date.getDate() + days);
    return toYmd(date);
};

export const formatDate = (ymd: string) => {
    const date = parse(ymd);
    return `${date.getMonth() + 1}월 ${date.getDate()}일 (${'일월화수목금토'[date.getDay()]})`;
};

export const formatShortDate = (ymd: string) => {
    const date = parse(ymd);
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
};

export const isSunday = (ymd: string) => parse(ymd).getDay() === 0;
