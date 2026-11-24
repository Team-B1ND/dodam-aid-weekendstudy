import type { BaseResponse, PageResponse } from '@b1nd/api-client';

const MAX_PAGES = 20;

export const fetchAllPages = async <T>(
    load: (page: number) => Promise<BaseResponse<PageResponse<T>>>,
    maxPages = MAX_PAGES
) => {
    const all: T[] = [];

    for (let page = 0; page < maxPages; page++) {
        const res = await load(page);
        all.push(...res.data.content);
        if (!res.data.hasNext) break;
    }

    return all;
};
