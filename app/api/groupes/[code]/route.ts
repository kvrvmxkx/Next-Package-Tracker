import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { code } = await params;

  const groupe = await prisma.groupeColis.findUnique({
    where: { code },
    include: {
      agent: { select: { firstname: true, lastname: true } },
      colis: {
        orderBy: { createdAt: "asc" },
        include: {
          tarif: { select: { nom: true } },
        },
      },
    },
  });

  if (!groupe) return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 });

  return NextResponse.json(groupe);
}
