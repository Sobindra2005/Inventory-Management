import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/");
    }

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-48 bg-card border border-border rounded-2xl shadow-sm animate-in fade-in zoom-in duration-500" style={{ animationDelay: `${i * 100}ms` }}></div>
                ))}
            </div>
            <div className="h-96 bg-card border border-border rounded-2xl shadow-sm animate-in fade-in zoom-in duration-700"></div>
        </div>
    );
}