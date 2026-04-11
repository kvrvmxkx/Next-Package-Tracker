import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // ─── 3 Agences ───────────────────────────────────────────────
  const agenceChine = await prisma.agence.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nom: "Agence Chine",
      pays: "CHINE",
      ville: "Guangzhou",
      active: true,
    },
  });

  const agenceMali = await prisma.agence.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      nom: "Agence Mali",
      pays: "MALI",
      ville: "Bamako",
      active: true,
    },
  });

  const agenceCI = await prisma.agence.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      nom: "Agence Côte d'Ivoire",
      pays: "COTE_DIVOIRE",
      ville: "Abidjan",
      active: true,
    },
  });

  console.log("✅ Agences:", agenceChine.nom, "|", agenceMali.nom, "|", agenceCI.nom);

  // ─── Tarifs ──────────────────────────────────────────────────
  const tarifMali = await prisma.tarif.upsert({
    where: { id: 1 },
    update: {},
    create: {
      nom: "Tarif Standard Mali",
      destination: "MALI",
      active: true,
      tranches: {
        create: [
          { poidsMin: 0,    poidsMax: 10,   prixParKg: 5000 },
          { poidsMin: 10.01, poidsMax: 50,  prixParKg: 4500 },
          { poidsMin: 50.01, poidsMax: null, prixParKg: 4000 },
        ],
      },
    },
  });

  const tarifCI = await prisma.tarif.upsert({
    where: { id: 2 },
    update: {},
    create: {
      nom: "Tarif Standard Côte d'Ivoire",
      destination: "COTE_DIVOIRE",
      active: true,
      tranches: {
        create: [
          { poidsMin: 0,    poidsMax: 10,   prixParKg: 5500 },
          { poidsMin: 10.01, poidsMax: 50,  prixParKg: 5000 },
          { poidsMin: 50.01, poidsMax: null, prixParKg: 4500 },
        ],
      },
    },
  });

  console.log("✅ Tarifs:", tarifMali.nom, "|", tarifCI.nom);
  console.log("✅ Seed terminé");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
