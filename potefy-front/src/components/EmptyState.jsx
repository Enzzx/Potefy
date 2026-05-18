export default function EmptyState({
    title,
    description
}) {
    return (
        <div className="py-20 text-center">
            <h2 className="text-lg font-medium text-zinc-300">
                {title}
            </h2>

            <p className="text-zinc-500 mt-2">
                {description}
            </p>
        </div>
    );
}