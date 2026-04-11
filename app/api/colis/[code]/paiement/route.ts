import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { type, montant, note } = await req.json();

    if (!type || !montant) {
      return NextResponse.json(
        { error: "Type et montant requis" },
        { status: 400 }
      );
    }

    const colis = await prisma.colis.findUnique({ where: { code } });
    if (!colis) {
      return NextResponse.json({ error: "Colis non trouvé" }, { status: 404 });
    }

    const paiement = await prisma.paiement.create({
      data: {
        colisId: colis.id,
        type,
        montant: parseFloat(montant),
        note: note ?? null,
        agentId: session.user.id,
      },
    });

    // Mettre à jour le statut paiement du colis
    const updates: Record<string, unknown> = {};
    if (type === "AVANCE") {
      updates.avancePaye = true;
    } else if (type === "SOLDE") {
      updates.soldePaye = true;
    }

    await prisma.colis.update({
      where: { code },
      data: updates,
    });

    return NextResponse.json(paiement, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
