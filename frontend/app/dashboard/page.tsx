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
        <div className="min-h-screen bg-background">
            <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-6">
                <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
                <UserButton />
            </div>

            <div className="mx-auto w-full max-w-4xl px-6 pb-8">
                <div className="rounded-lg bg-card p-6 border border-border">
                    <p className="text-muted-foreground">
                        Signed in as {user?.primaryEmailAddress?.emailAddress ?? user?.username ?? user?.id}
                    </p>
                </div>
            </div>
        </div>
    );
}