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

  // Pour Mali, chercher aussi les anciens codes sans préfixe "ML-" (ex: CF0032)
  const prefixes = isCi ? ["CI-CF"] : ["ML-CF", "CF"];

  const candidates = await Promise.all(
    prefixes.map((p) =>
      prisma.groupeColis.findFirst({
        where: { code: { startsWith: p } },
        orderBy: { code: "desc" },
        select: { code: true },
      })
    )
  );

  let num = 1;
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    if (!c) continue;
    const parsed = parseInt(c.code.replace(prefixes[i]!, ""), 10);
    if (!isNaN(parsed) && parsed + 1 > num) num = parsed + 1;
  }

  if (num > 9999) {
    return NextResponse.json({ error: "Plage de codes épuisée" }, { status: 500 });
  }

  const code = `${prefix}${String(num).padStart(4, "0")}`;
  return NextResponse.json({ code });
}
