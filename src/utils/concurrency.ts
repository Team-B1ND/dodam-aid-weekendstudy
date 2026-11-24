export const runWithLimit = async <T>(
    tasks: (() => Promise<T>)[],
    limit = 8
) => {
    const results: T[] = [];
    let cursor = 0;

    const worker = async () => {
        while (cursor < tasks.length) {
            const index = cursor++;
            results[index] = await tasks[index]();
        }
    };

    await Promise.all(
        Array.from({ length: Math.min(limit, tasks.length) }, worker)
    );

    return results;
};
