import type { Applicant, Application, WeekendStudyType } from '../api/weekendStudy';
import { formatClassroom } from './student';

export interface StudentEntry {
    key: string;
    applicationId: string;
    applicant: Applicant;
    type: WeekendStudyType;
    place: string;
    roomId: number | null;
    periods: number[];
    isLeader: boolean;
    leaderName: string;
}

export const TYPE_LABEL: Record<WeekendStudyType, string> = {
    PERSONAL: '개별 자습',
    PROJECT: '실 대여',
};

export const toStudentEntries = (applications: Application[]): StudentEntry[] =>
    applications.flatMap((application) =>
        [application.leader, ...application.members].map((applicant) => ({
            key: `${application.id}:${applicant.publicId}`,
            applicationId: application.id,
            applicant,
            type: application.type,
            place:
                application.type === 'PROJECT'
                    ? application.room?.name ?? '실 미정'
                    : formatClassroom(applicant),
            roomId: application.room?.id ?? null,
            periods: application.periods,
            isLeader: applicant.publicId === application.leader.publicId,
            leaderName: application.leader.name,
        }))
    );

const studentOrder = ({ applicant: { student } }: StudentEntry) =>
    student ? student.grade * 10000 + student.room * 100 + student.number : Number.MAX_SAFE_INTEGER;

export const sortByStudent = (entries: StudentEntry[]) =>
    [...entries].sort((a, b) => studentOrder(a) - studentOrder(b));


export const leaderLabel = (application: Application) =>
    `대표 ${application.leader.name}${application.members.length ? ` 외 ${application.members.length}명` : ''}`;

export const statusKey = (userId: string, period: number) => `${userId}|${period}`;
