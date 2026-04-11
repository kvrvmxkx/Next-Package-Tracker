import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Roles } from "@/lib/enums";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== Roles.SUPER_ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 20;
  const skip = (page - 1) * limit;

  // Totaux caisse
  const [totalEncaisseResult, totalRetraitsResult, retraits, totalRetraitsCount] =
    await Promise.all([
      // Somme de tous les paiements (avances + soldes)
      prisma.paiement.aggregate({ _sum: { montant: true } }),
      // Somme de tous les retraits
      prisma.retrait.aggregate({ _sum: { montant: true } }),
      // Liste paginée des retraits
      prisma.retrait.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { agent: { select: { firstname: true, lastname: true } } },
      }),
      prisma.retrait.count(),
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
  const { montant, motif, note } = body;

  if (!montant || montant <= 0) {
    return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
  }
  if (!motif || motif.trim() === "") {
    return NextResponse.json({ error: "Motif requis" }, { status: 400 });
  }

  // Vérifier que le solde est suffisant
  const [totalEncaisseResult, totalRetraitsResult] = await Promise.all([
    prisma.paiement.aggregate({ _sum: { montant: true } }),
    prisma.retrait.aggregate({ _sum: { montant: true } }),
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
      agentId: session.user.id,
    },
  });

  return NextResponse.json(retrait, { status: 201 });
}
