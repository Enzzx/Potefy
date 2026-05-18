import Navbar from "./Navbar";

export default function Layout({
    children
}) {
    return (
        <div className="min-h-screen bg-[#121212] text-zinc-100">

            <Navbar />

            <main className="max-w-7xl mx-auto px-6 py-10">
                {children}
            </main>
        </div>
    );
}