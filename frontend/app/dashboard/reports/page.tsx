import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { FileClock } from "lucide-react";

export default async function ReportsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">Detailed reporting is under active development.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 md:p-10">
        <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
          <div className="mb-4 rounded-full border border-border bg-muted/40 p-4">
            <FileClock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Coming Soon</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            We are building a lightweight reports experience with export-ready sales and credit insights.
          </p>
        </div>
      </div>
    </div>
  );
}
