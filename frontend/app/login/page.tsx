import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function LoginPage() {
    const { userId } = await auth();

    if (userId) {
        redirect("/dashboard");
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4 dark:bg-black">
            <SignIn
                path="/login"
                routing="path"
                forceRedirectUrl="/dashboard"
                fallbackRedirectUrl="/dashboard"
            />
        </div>
    );
}