import { useState } from 'react';
import { DailyRecords } from './DailyRecords';
import { StudentSummaries } from './StudentSummaries';
import type { RecordsTab } from './tabs';

export const AttendanceRecordsPage = () => {
    const [tab, setTab] = useState<RecordsTab>('daily');
    return tab === 'daily' ? <DailyRecords onTab={setTab} /> : <StudentSummaries onTab={setTab} />;
};

export default AttendanceRecordsPage;
