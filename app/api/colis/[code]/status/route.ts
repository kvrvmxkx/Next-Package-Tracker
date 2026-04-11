import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { sendSMS } from "@/lib/twilio";
import { getStatutText } from "@/lib/utils";

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

    const colis = await prisma.colis.update({
      where: { code },
      data: { statut },
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

    // SMS notification (fire & forget)
    prisma.colis
      .findUnique({ where: { id: colis.id } })
      .then(async (c) => {
        if (!c) return;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
        const msg = `Votre colis ${c.code} est maintenant: ${getStatutText(statut)}. Suivi: ${appUrl}/suivi/${c.tokenPublic}`;
        await sendSMS(c.destinatairePhone, msg);
      })
      .catch((err) => console.error("SMS error:", err));

    return NextResponse.json(colis);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
