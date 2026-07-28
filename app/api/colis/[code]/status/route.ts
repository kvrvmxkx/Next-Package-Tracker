import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { sendColisNotification } from "@/lib/whatsapp";
import { getEtablissement } from "@/lib/settings";
import { StatutColis } from "@/lib/enums";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { statut, note } = await req.json();

    if (!statut) {
      return NextResponse.json({ error: "Statut requis" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { statut };

    if (statut === StatutColis.LIVRE) {
      const current = await prisma.colis.findUnique({
        where: { code },
        select: { soldePaye: true },
      });
      if (current && !current.soldePaye) {
        updateData.remisEnDette = true;
      }
    }

    const colis = await prisma.colis.update({
      where: { code },
      data: updateData,
    });

    // Historique
    await prisma.colisHistorique.create({
      data: {
        colisId: colis.id,
        statut,
        note: note ?? null,
        agentId: session.user.id,
      },
    });

    // WhatsApp notification (fire & forget)
    prisma.colis
      .findUnique({ where: { id: colis.id }, include: { agenceDestination: true } })
      .then(async (c) => {
        if (!c) return;
        const country = c.destination === "COTE_DIVOIRE" ? "CI" as const : "ML" as const;
        await sendColisNotification({
          to         : c.destinatairePhone,
          code       : c.code,
          statut,
          agenceNom  : c.agenceDestination?.nom ?? c.destination,
          tokenPublic: c.tokenPublic,
          country,
        });
      })
      .catch((err) => console.error("[Meta] Erreur notification statut:", err));

    return NextResponse.json(colis);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
