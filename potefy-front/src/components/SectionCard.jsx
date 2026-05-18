export default function SectionCard({
    title,
    children
}) {
    return (
        <section className="
            bg-[#181818]
            border border-zinc-800
            rounded-xl
            p-6
        ">
            <h2 className="font-medium mb-5">
                {title}
            </h2>

            {children}
        </section>
    );
}