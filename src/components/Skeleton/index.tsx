export const ListSkeleton = ({
    rows = 5,
    withButtons = false,
}: {
    rows?: number;
    withButtons?: boolean;
}) => (
    <div className="skeleton" role="status" aria-label="불러오는 중">
        <span className="skeleton__bar skeleton__bar--title" />
        <div className="card skeleton__card">
            {Array.from({ length: rows }, (_, index) => (
                <div key={index} className="skeleton__row">
                    <span className="skeleton__bar skeleton__bar--short" />
                    {withButtons ? (
                        <span className="skeleton__buttons">
                            {Array.from({ length: 4 }, (_, button) => (
                                <span key={button} className="skeleton__bar skeleton__bar--button" />
                            ))}
                        </span>
                    ) : (
                        <span className="skeleton__bar skeleton__bar--long" />
                    )}
                </div>
            ))}
        </div>
    </div>
);
