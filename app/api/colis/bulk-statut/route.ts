import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { sendSuiviColisBulk, sendPretRetirerBulk } from "@/lib/whatsapp";
import { StatutColis } from "@/lib/enums";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { fromStatut, toStatut, destination } = await req.json();

    if (!fromStatut || !toStatut) {
      return NextResponse.json({ error: "fromStatut et toStatut requis" }, { status: 400 });
    }

    const where = {
      statut: fromStatut,
      express: false,
      ...(destination && destination !== "ALL" ? { destination } : {}),
    };

    const { count } = await prisma.colis.updateMany({
      where,
      data: { statut: toStatut },
    });

    // Historique pour chaque colis mis à jour
    const updated = await prisma.colis.findMany({
      where: { statut: toStatut, express: false },
      select: { id: true },
      orderBy: { updatedAt: "desc" },
      take: count,
    });

    if (updated.length > 0) {
      await prisma.colisHistorique.createMany({
        data: updated.map((c) => ({
          colisId: c.id,
          statut: toStatut,
          note: `Changement groupé : ${fromStatut} → ${toStatut}`,
          agentId: session.user.id,
        })),
      });

      // WhatsApp fire & forget — envoi séquentiel avec délai entre chaque message
      prisma.colis.findMany({
          where  : { id: { in: updated.map((c) => c.id) } },
          include: { agenceDestination: true },
        })
        .then((colis) => {
          const isPretRetirer = toStatut === StatutColis.PRET_RETIRER;
          if (isPretRetirer) {
            return sendPretRetirerBulk(colis.map((c) => ({
              to         : c.destinatairePhone,
              code       : c.code,
              agenceNom  : c.agenceDestination?.nom ?? c.destination,
              tokenPublic: c.tokenPublic,
              country    : c.destination === "COTE_DIVOIRE" ? ("CI" as const) : ("ML" as const),
            })));
          }
          return sendSuiviColisBulk(colis.map((c) => ({
            to         : c.destinatairePhone,
            code       : c.code,
            statut     : toStatut,
            tokenPublic: c.tokenPublic,
            country    : c.destination === "COTE_DIVOIRE" ? ("CI" as const) : ("ML" as const),
          })));
        })
        .catch((err) => console.error("[Meta] Erreur envoi groupé:", err));
    }

    return NextResponse.json({ count });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const fromStatut = searchParams.get("fromStatut");
  const destination = searchParams.get("destination");

  if (!fromStatut) return NextResponse.json({ count: 0 });

  try {
    const count = await prisma.colis.count({
      where: {
        statut: fromStatut,
        express: false,
        ...(destination && destination !== "ALL" ? { destination } : {}),
      },
    });
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
