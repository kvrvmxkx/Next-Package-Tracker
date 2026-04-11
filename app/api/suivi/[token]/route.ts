import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const colis = await prisma.colis.findUnique({
      where: { tokenPublic: token },
      include: {
        historique: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!colis) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Return only public-safe data
    return NextResponse.json({
      code: colis.code,
      statut: colis.statut,
      destination: colis.destination,
      poids: colis.poids,
      description: colis.description,
      expediteurNom: colis.expediteurNom,
      destinataireNom: colis.destinataireNom,
      destinatairePhone: colis.destinatairePhone,
      destinataireVille: colis.destinataireVille,
      createdAt: colis.createdAt,
      historique: colis.historique.map((h) => ({
        statut: h.statut,
        note: h.note,
        createdAt: h.createdAt,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
