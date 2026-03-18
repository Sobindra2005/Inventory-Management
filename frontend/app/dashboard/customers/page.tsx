import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CustomersCreditManager } from "@/components/dashboard/customers-credit-manager";

export default async function CustomersPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  return <CustomersCreditManager />;
}
