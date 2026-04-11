import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SeedDataSettings } from "@/components/dashboard/seed-data-settings";

export default async function SettingsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage sample data for demos and test workflows.
        </p>
      </div>

      <SeedDataSettings />
    </div>
  );
}
