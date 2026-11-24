import { Sheet } from '../../components/Sheet';
import type { Application } from '../../api/weekendStudy';
import { formatDate } from '../../utils/date';
import { formatPeriodTimes } from '../../utils/period';
import { formatStudentNumber } from '../../utils/student';
import { leaderLabel } from '../../utils/applications';

export const RentalSheet = ({ application, onClose }: { application: Application; onClose: () => void }) => (
    <Sheet label={application.name ?? '실 대여 신청'} onClose={onClose}>
        <div>
            <h2 className="sheet__title">{application.name ?? '실 대여 신청'}</h2>
            <p className="row__sub">{leaderLabel(application)}</p>
        </div>

        <dl className="info-list">
            {[
                ['진행 날짜', formatDate(application.date)],
                ['시간대', formatPeriodTimes(application.periods)],
                ['실', application.room?.name ?? '-'],
            ].map(([label, value]) => (
                <div key={label} className="info-list__row">
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                </div>
            ))}
        </dl>

        <section className="form-section">
            <h3 className="sheet__label">참여 인원</h3>
            <ul className="member-chips">
                {[application.leader, ...application.members].map((member) => (
                    <li key={member.publicId} className="member-chip">
                        {[formatStudentNumber(member), member.name].filter(Boolean).join(' ')}
                    </li>
                ))}
            </ul>
        </section>

        <section className="form-section">
            <h3 className="sheet__label">프로젝트 개요</h3>
            <p className="sheet__body">{application.description}</p>
        </section>

        <button type="button" className="btn btn--assistive btn--block btn--large" onClick={onClose}>
            닫기
        </button>
    </Sheet>
);
