import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Roles } from "@/lib/enums";

const KEYS = ["agentsCanEditColis", "agentsCanDeleteColis"] as const;
type SettingKey = (typeof KEYS)[number];

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.appSetting.findMany({ where: { key: { in: [...KEYS] } } });
  const result: Record<string, boolean> = {
    agentsCanEditColis: false,
    agentsCanDeleteColis: false,
  };
  for (const row of rows) {
    result[row.key] = row.value === "true";
  }
  return NextResponse.json(result);
}

export async function PUT(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== Roles.SUPER_ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  await Promise.all(
    KEYS.filter((k) => k in body).map((k) =>
      prisma.appSetting.upsert({
        where: { key: k },
        update: { value: String(!!body[k]) },
        create: { key: k, value: String(!!body[k]) },
      })
    )
  );

  return NextResponse.json({ success: true });
}
