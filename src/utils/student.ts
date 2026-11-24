import type { Applicant } from '../api/weekendStudy';

export const formatStudentNumber = ({ student }: Applicant) =>
    student ? `${student.grade}${student.room}${String(student.number).padStart(2, '0')}` : '';

export const formatClassroom = ({ student }: Applicant) =>
    student ? `${student.grade}학년 ${student.room}반 교실` : '교실';

export const matchesKeyword = (applicant: Applicant, keyword: string) => {
    const query = keyword.trim();
    return !query || applicant.name.includes(query) || formatStudentNumber(applicant).includes(query);
};
