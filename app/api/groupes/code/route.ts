import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const dest = new URL(req.url).searchParams.get("destination");
  const isCi = dest === "COTE_DIVOIRE";
  const prefix = isCi ? "CI-CF" : "ML-CF";

  const last = await prisma.groupeColis.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: "desc" },
    select: { code: true },
  });

  let num = 1;
  if (last) {
    const parsed = parseInt(last.code.replace(prefix, ""), 10);
    if (!isNaN(parsed)) num = parsed + 1;
  }

  if (num > 9999) {
    return NextResponse.json({ error: "Plage de codes épuisée" }, { status: 500 });
  }

  const code = `${prefix}${String(num).padStart(4, "0")}`;
  return NextResponse.json({ code });
}
