const PALETTE = [
    "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    "bg-sky-500/15 text-sky-300 border-sky-500/30",
    "bg-violet-500/15 text-violet-300 border-violet-500/30",
    "bg-amber-500/15 text-amber-300 border-amber-500/30",
    "bg-rose-500/15 text-rose-300 border-rose-500/30",
    "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    "bg-lime-500/15 text-lime-300 border-lime-500/30",
    "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30"
];

function hash(value) {
    let result = 0;

    for (
        let i = 0;
        i < value.length;
        i++
    ) {
        result =
            (result * 31 +
                value.charCodeAt(i)) |
            0;
    }

    return Math.abs(result);
}

export default function Chip({
    label,
    id,
    className = ""
}) {
    const color =
        PALETTE[
            hash(id || label) %
                PALETTE.length
        ];

    return (
        <span
            className={`
                inline-flex items-center
                rounded-full border
                px-2.5 py-0.5
                text-xs
                ${color}
                ${className}
            `}
        >
            {label}
        </span>
    );
}
