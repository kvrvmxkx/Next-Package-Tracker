import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { generateColisCode, generatePublicToken } from "@/lib/utils";
import { StatutColis } from "@/lib/enums";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const {
      code,           // CF0001 — pré-généré côté client
      destination,
      expediteurEstFournisseur,
      expediteurNom,
      expediteurPhone,
      notes,
      colis: colisItems, // tableau de sous-colis
    } = await request.json();

    if (!code || !destination || !colisItems?.length) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }
    if (!expediteurEstFournisseur && (!expediteurNom || !expediteurPhone)) {
      return NextResponse.json({ error: "Informations expéditeur requises" }, { status: 400 });
    }

    // Vérifier que le code CF n'est pas déjà pris (race condition)
    const existing = await prisma.groupeColis.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json(
        { error: "Code CF déjà utilisé, veuillez recharger le formulaire" },
        { status: 409 }
      );
    }

    const agentId = session.user.id;

    // Transaction : créer le groupe + tous ses colis
    const groupe = await prisma.$transaction(async (tx) => {
      const grp = await tx.groupeColis.create({
        data: {
          code,
          destination,
          expediteurEstFournisseur: !!expediteurEstFournisseur,
          expediteurNom: expediteurNom ?? "",
          expediteurPhone: expediteurPhone ?? "",
          notes,
          agentId,
        },
      });

      for (const item of colisItems) {
        const {
          destinataireNom,
          destinatairePhone,
          destinataireVille,
          destinataireAdresse,
          description,
          poids,
          prixTotal,
          avance,
          tarifId,
          nombreColis,
        } = item;

        const avanceVal    = parseFloat(avance ?? 0);
        const prixTotalVal = parseFloat(prixTotal ?? 0);
        const solde        = Math.max(0, prixTotalVal - avanceVal);

        // Code colis unique avec retry
        let colisCode: string;
        let attempts = 0;
        do {
          colisCode = generateColisCode(destination);
          const dup = await tx.colis.findUnique({ where: { code: colisCode } });
          if (!dup) break;
          attempts++;
        } while (attempts < 5);

        const colis = await tx.colis.create({
          data: {
            code: colisCode!,
            tokenPublic: generatePublicToken(),
            groupeId: grp.id,
            destination,
            description,
            poids: parseFloat(poids),
            nombreColis: nombreColis ? parseInt(nombreColis) : 1,
            expediteurEstFournisseur: !!expediteurEstFournisseur,
            expediteurNom: expediteurNom ?? "",
            expediteurPhone: expediteurPhone ?? "",
            destinataireNom,
            destinatairePhone,
            destinataireVille,
            destinataireAdresse,
            prixTotal: prixTotalVal,
            avance: avanceVal,
            solde,
            avancePaye: avanceVal > 0,
            soldePaye: false,
            notes,
            tarifId: tarifId ? parseInt(tarifId) : null,
            agentId,
          },
        });

        await tx.colisHistorique.create({
          data: {
            colisId: colis.id,
            statut: StatutColis.ENREGISTRE,
            note: `Enregistré dans le groupe ${grp.code}`,
            agentId,
          },
        });

        if (avanceVal > 0) {
          await tx.paiement.create({
            data: {
              colisId: colis.id,
              type: "AVANCE",
              montant: avanceVal,
              note: "Avance à l'enregistrement",
              agentId,
            },
          });
        }
      }

      return grp;
    });

    return NextResponse.json(groupe, { status: 201 });
  } catch (error) {
    console.error("Failed to create groupe:", error);
    return NextResponse.json({ error: "Échec de la création du groupe" }, { status: 500 });
  }
}
