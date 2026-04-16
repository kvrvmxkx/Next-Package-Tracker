import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SetupInstallForm from "./_setup-install-form";

export default async function SetupInstallPage() {
  const count = await prisma.user.count();
  if (count > 0) redirect("/login");

  return <SetupInstallForm />;
}
