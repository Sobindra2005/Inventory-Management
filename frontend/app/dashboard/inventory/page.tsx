import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function InventoryPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-extrabold tracking-tight">Inventory</h1>
      <p className="text-muted-foreground">Manage your products and stock levels from here.</p>
      <div className="h-64 bg-card border border-border rounded-2xl shadow-sm" />
    </div>
  );
}
