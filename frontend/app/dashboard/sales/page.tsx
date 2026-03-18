import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SalesManager } from "@/components/dashboard/sales-manager";

export default async function SalesPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  return <SalesManager />;
}
