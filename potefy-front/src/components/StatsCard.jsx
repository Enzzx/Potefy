export default function StatsCard({
    title,
    value
}) {
    return (
        <div className="
            bg-[#181818]
            border border-zinc-800
            rounded-xl
            p-5
        ">
            <p className="text-sm text-zinc-500">
                {title}
            </p>

            <h2 className="text-2xl font-semibold mt-2">
                {value}
            </h2>
        </div>
    );
}