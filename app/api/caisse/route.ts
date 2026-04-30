import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Roles } from "@/lib/enums";

type Destination = "MALI" | "COTE_DIVOIRE";


export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== Roles.SUPER_ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const dest = searchParams.get("destination") as Destination | null;
  const limit = 20;
  const skip = (page - 1) * limit;

  const retraitsWhere = dest ? { destination: dest } : {};

  const [totalEncaisseResult, totalRetraitsResult, retraits, totalRetraitsCount] =
    await Promise.all([
      prisma.paiement.aggregate({
        _sum: { montant: true },
        where: dest ? { colis: { destination: dest } } : {},
      }),
      prisma.retrait.aggregate({
        _sum: { montant: true },
        where: retraitsWhere,
      }),
      prisma.retrait.findMany({
        where: retraitsWhere,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { agent: { select: { firstname: true, lastname: true } } },
      }),
      prisma.retrait.count({ where: retraitsWhere }),
    ]);

  const totalEncaisse = totalEncaisseResult._sum.montant ?? 0;
  const totalRetraits = totalRetraitsResult._sum.montant ?? 0;
  const solde = totalEncaisse - totalRetraits;

  return NextResponse.json({
    solde,
    totalEncaisse,
    totalRetraits,
    retraits,
    pagination: {
      page,
      limit,
      total: totalRetraitsCount,
      pages: Math.ceil(totalRetraitsCount / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== Roles.SUPER_ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { montant, motif, note, destination } = body;

  if (!montant || montant <= 0) {
    return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
  }
  if (!motif || motif.trim() === "") {
    return NextResponse.json({ error: "Motif requis" }, { status: 400 });
  }
  if (!destination || !["MALI", "COTE_DIVOIRE"].includes(destination)) {
    return NextResponse.json({ error: "Destination requise" }, { status: 400 });
  }

  // Vérifier que le solde de cette caisse est suffisant
  const [totalEncaisseResult, totalRetraitsResult] = await Promise.all([
    prisma.paiement.aggregate({
      _sum: { montant: true },
      where: { colis: { destination } },
    }),
    prisma.retrait.aggregate({
      _sum: { montant: true },
      where: { destination },
    }),
  ]);
  const solde =
    (totalEncaisseResult._sum.montant ?? 0) -
    (totalRetraitsResult._sum.montant ?? 0);

  if (montant > solde) {
    return NextResponse.json(
      { error: `Solde insuffisant. Disponible : ${solde.toLocaleString("fr-FR")} XOF` },
      { status: 400 }
    );
  }

  const retrait = await prisma.retrait.create({
    data: {
      montant,
      motif: motif.trim(),
      note: note?.trim() || null,
      destination,
      agentId: session.user.id,
    },
  });

  return NextResponse.json(retrait, { status: 201 });
}
