import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SetupSecretForm from "./_setup-secret-form";

export default async function SetupSecretPage() {
  const count = await prisma.user.count();
  if (count > 0) redirect("/login");

  return <SetupSecretForm />;
}
