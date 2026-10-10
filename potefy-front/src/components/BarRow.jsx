export default function BarRow({
    label,
    value,
    max,
    suffix = "",
    onClick,
    title,
    labelClassName = "",
    selected = false
}) {
    const percent =
        max > 0
            ? Math.round(
                (value / max) * 100
            )
            : 0;

    const Wrapper = onClick
        ? "button"
        : "div";

    return (
        <Wrapper
            onClick={onClick}
            title={title}
            className={`
                block w-full text-left
                -mx-2 px-2 py-1
                rounded-lg
                transition-colors
                ${
                    onClick
                        ? "group cursor-pointer"
                        : ""
                }
                ${
                    selected
                        ? "bg-[#1DB954]/10"
                        : ""
                }
            `}
        >
            <div className="flex justify-between items-baseline gap-3 text-sm">
                <span
                    className={`
                        truncate
                        transition-colors
                        ${labelClassName}
                        ${
                            selected
                                ? "text-[#1DB954]"
                                : "text-zinc-200 group-hover:text-white"
                        }
                    `}
                >
                    {selected && (
                        <span className="mr-1">
                            ✓
                        </span>
                    )}

                    {label}
                </span>

                <span className="text-zinc-400 shrink-0">
                    {value}
                    {suffix}
                </span>
            </div>

            <div className="mt-1.5 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                    className="h-full rounded-full bg-[#1DB954]"
                    style={{
                        width: `${percent}%`
                    }}
                />
            </div>
        </Wrapper>
    );
}
