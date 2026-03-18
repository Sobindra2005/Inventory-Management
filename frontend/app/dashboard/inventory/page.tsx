import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { InventoryManager } from "@/components/dashboard/inventory-manager";

export default async function InventoryPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  return <InventoryManager />;
}
