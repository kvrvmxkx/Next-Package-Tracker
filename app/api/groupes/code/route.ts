import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  // Trouver le dernier code CF utilisé et incrémenter
  const last = await prisma.groupeColis.findFirst({
    orderBy: { code: "desc" },
    select: { code: true },
  });

  let num = 1;
  if (last) {
    const parsed = parseInt(last.code.replace("CF", ""), 10);
    if (!isNaN(parsed)) num = parsed + 1;
  }

  if (num > 9999) {
    return NextResponse.json({ error: "Plage de codes CF épuisée" }, { status: 500 });
  }

  const code = `CF${String(num).padStart(4, "0")}`;
  return NextResponse.json({ code });
}
