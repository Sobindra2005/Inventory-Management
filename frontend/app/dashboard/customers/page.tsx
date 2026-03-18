import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function CustomersPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-extrabold tracking-tight">Customers</h1>
      <p className="text-muted-foreground">View and manage customer information and activity.</p>
      <div className="h-64 bg-card border border-border rounded-2xl shadow-sm" />
    </div>
  );
}
