import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Roles } from "@/lib/enums";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || session.user.role !== Roles.SUPER_ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { nom, destination, tranches } = await req.json();

    // Delete existing tranches, recreate
    await prisma.trancheTarif.deleteMany({ where: { tarifId: parseInt(id) } });

    const tarif = await prisma.tarif.update({
      where: { id: parseInt(id) },
      data: {
        nom,
        destination,
        tranches: {
          create: tranches.map((t: { poidsMin: number; poidsMax: number | null; prixParKg: number }) => ({
            poidsMin: t.poidsMin,
            poidsMax: t.poidsMax ?? null,
            prixParKg: t.prixParKg,
          })),
        },
      },
      include: { tranches: true },
    });

    return NextResponse.json(tarif);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || session.user.role !== Roles.SUPER_ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await prisma.tarif.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
