import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/");
    }

    const user = await currentUser();

    return (
        <div className="min-h-screen  dark:bg-black">
            <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-6">
                <h1 className="text-2xl font-semibold text-black dark:text-zinc-100">Dashboard</h1>
                <UserButton />
            </div>

            <div className="mx-auto w-full max-w-4xl px-6 pb-8">
                <div className="rounded-lg bg-white p-6 dark:bg-zinc-900">
                    <p className="text-zinc-700 dark:text-zinc-300">
                        Signed in as {user?.primaryEmailAddress?.emailAddress ?? user?.username ?? user?.id}
                    </p>
                </div>
            </div>
        </div>
    );
}