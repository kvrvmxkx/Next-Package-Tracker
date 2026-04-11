import { Prisma } from "./generated/prisma/client";
import { prisma } from "./prisma";

export type ColisWithRelations = Prisma.Result<
  typeof prisma.colis,
  {
    include: {
      agent: { select: { firstname: true; lastname: true; name: true } };
      agenceOrigine: true;
      agenceDestination: true;
      historique: {
        include: { agent: { select: { firstname: true; lastname: true } } };
        orderBy: { createdAt: "desc" };
      };
      paiements: {
        include: { agent: { select: { firstname: true; lastname: true } } };
        orderBy: { createdAt: "desc" };
      };
    };
  },
  "findUniqueOrThrow"
>;

export type TarifWithTranches = Prisma.Result<
  typeof prisma.tarif,
  { include: { tranches: true } },
  "findUniqueOrThrow"
>;

export type ColisListItem = Prisma.Result<
  typeof prisma.colis,
  {
    include: {
      agent: { select: { firstname: true; lastname: true } };
    };
  },
  "findFirstOrThrow"
>;
