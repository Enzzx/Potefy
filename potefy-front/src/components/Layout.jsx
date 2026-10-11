import Navbar from "./Navbar";

export default function Layout({
    children,
    fullHeight = false
}) {
    if (fullHeight) {
        return (
            <div className="
                h-screen
                bg-[#121212]
                text-zinc-100
                flex flex-col
            ">
                <Navbar />

                <main className="
                    flex-1 min-h-0
                    w-full
                    max-w-7xl
                    mx-auto
                    px-6 py-6
                    flex flex-col
                    overflow-y-auto
                    lg:overflow-hidden
                ">
                    {children}
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#121212] text-zinc-100">

            <Navbar />

            <main className="max-w-7xl mx-auto px-6 py-10">
                {children}
            </main>
        </div>
    );
}
