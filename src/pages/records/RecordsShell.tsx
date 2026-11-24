import type { ReactNode } from 'react';
import { useRouter } from '@b1nd/aid-kit/navigation';
import { Screen } from '../../components/Screen';
import { Segment } from '../../components/Segment';
import { RECORD_TABS, type RecordsTab } from './tabs';

export const RecordsShell = ({
    tab,
    onTab,
    keyword,
    onKeyword,
    canExport,
    onExport,
    children,
}: {
    tab: RecordsTab;
    onTab: (tab: RecordsTab) => void;
    keyword: string;
    onKeyword: (keyword: string) => void;
    canExport: boolean;
    onExport: () => void;
    children: ReactNode;
}) => {
    const { stack } = useRouter();

    return (
        <Screen
            title="출석 기록"
            onBack={() => stack.pop()}
            footer={
                <button
                    type="button"
                    className="btn btn--assistive btn--block btn--large"
                    disabled={!canExport}
                    onClick={onExport}
                >
                    엑셀로 내보내기
                </button>
            }
        >
            <Segment items={RECORD_TABS} value={tab} onChange={onTab} />
            <input
                type="search"
                className="search"
                placeholder="이름 또는 학번 검색"
                value={keyword}
                onChange={(event) => onKeyword(event.target.value)}
            />
            {children}
        </Screen>
    );
};
