export default function SectionCard({
    title,
    children,
    className = ""
}) {
    return (
        <section className={`
            bg-[#181818]
            border border-zinc-800
            rounded-xl
            p-6
            ${className}
        `}>
            <h2 className="font-medium mb-5 shrink-0">
                {title}
            </h2>

            {children}
        </section>
    );
}
