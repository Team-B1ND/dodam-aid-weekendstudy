import type { PageResponse } from '@b1nd/api-client';
import { apiClient } from './client';
import { fetchAllPages } from './paging';

const BASE = '/weekendstudy';
const PAGE_SIZE = 100;

export type WeekendStudyType = 'PERSONAL' | 'PROJECT';
export type AttendanceStatus = 'ATTENDANCE' | 'LATE' | 'ABSENT';
export type RoomPeriodStatus = 'AVAILABLE' | 'RESERVED' | 'BLOCKED';

export interface Applicant {
    publicId: string;
    username: string;
    name: string;
    student: { grade: number; room: number; number: number } | null;
}

export interface Application {
    id: string;
    type: WeekendStudyType;
    date: string;
    periods: number[];
    name: string | null;
    description: string | null;
    room: { id: number; name: string } | null;
    leader: Applicant;
    members: Applicant[];
}

export interface AttendanceSummary {
    student: Applicant;
    attendance: number;
    late: number;
    absent: number;
}

export interface Room {
    id: number;
    name: string;
    floor: number;
    enabled: boolean;
}

export type RoomBody = Pick<Room, 'name' | 'floor'>;

export interface AttendanceStatusRow {
    student: Applicant;
    period: number;
    type: WeekendStudyType;
    status: AttendanceStatus | null;
    checkedAt: string | null;
    reason: string | null;
}

export interface RoomStatus extends Room {
    periods: { period: number; status: RoomPeriodStatus; reason: string | null }[];
}

export interface RoomBlock {
    id: number;
    period: number;
    description: string;
    startAt: string;
    endAt: string;
}

export const getApplications = (date: string, type: WeekendStudyType) =>
    fetchAllPages((page) =>
        apiClient.get<PageResponse<Application>>(`${BASE}/applications`, {
            params: { date, type, page, size: PAGE_SIZE },
        })
    );

export const getAllApplications = async (date: string) => {
    const [personal, project] = await Promise.all([
        getApplications(date, 'PERSONAL'),
        getApplications(date, 'PROJECT'),
    ]);
    return [...personal, ...project];
};

export const checkAttendance = (
    userId: string,
    body: { date: string; period: number; status: AttendanceStatus; reason?: string }
) => apiClient.patch(`${BASE}/attendance/${userId}`, body);

export const cancelAttendance = (userId: string, params: { date: string; period: number }) =>
    apiClient.delete(`${BASE}/attendance/${userId}`, { params });

export const getAttendanceStatuses = async (date: string, period?: number) =>
    (
        await apiClient.get<AttendanceStatusRow[]>(`${BASE}/attendance/status`, {
            params: period === undefined ? { date } : { date, period },
        })
    ).data;

export const getAttendanceSummaries = (startAt: string, endAt: string) =>
    fetchAllPages((page) =>
        apiClient.get<PageResponse<AttendanceSummary>>(`${BASE}/attendance`, {
            params: { startAt, endAt, page, size: PAGE_SIZE },
        })
    );

export const getRooms = async () => (await apiClient.get<Room[]>(`${BASE}/rooms`)).data;

export const getAllRooms = async () => (await apiClient.get<Room[]>(`${BASE}/rooms/all`)).data;

export const setRoomEnabled = (id: number, enabled: boolean) =>
    apiClient.patch(`${BASE}/rooms/${id}/enabled`, undefined, { params: { enabled } });

export const getRoomStatus = async (date: string) =>
    (await apiClient.get<RoomStatus[]>(`${BASE}/rooms/status`, { params: { date } })).data;

export const createRoom = (body: RoomBody) => apiClient.post(`${BASE}/rooms`, body);

export const updateRoom = (id: number, body: RoomBody) =>
    apiClient.patch(`${BASE}/rooms/${id}`, body);

export const deleteRoom = (id: number) => apiClient.delete(`${BASE}/rooms/${id}`);

export const getRoomBlocks = async (roomId: number) =>
    (await apiClient.get<RoomBlock[]>(`${BASE}/rooms/${roomId}/blocks`)).data;

export const blockRoom = (
    roomId: number,
    body: { startAt: string; endAt: string; periods: number[]; description: string }
) => apiClient.post(`${BASE}/rooms/${roomId}/blocks`, body);

export const unblockRoom = (roomId: number, blockId: number) =>
    apiClient.delete(`${BASE}/rooms/${roomId}/blocks/${blockId}`);
