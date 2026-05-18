export default function SectionTitle({
    title,
    subtitle
}) {
    return (
        <div className="mb-8">
            <h1 className="text-2xl font-semibold">
                {title}
            </h1>

            {subtitle && (
                <p className="text-zinc-400 mt-2">
                    {subtitle}
                </p>
            )}
        </div>
    );
}