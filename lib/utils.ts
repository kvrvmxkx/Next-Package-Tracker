import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import crypto from "crypto";
import { StatutColis, Destination } from "./enums";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Statuts ─────────────────────────────────────────────────

export const getStatutColor = (statut: string | null) => {
  switch (statut) {
    case StatutColis.ENREGISTRE:
      return "text-gray-500";
    case StatutColis.EN_COURS_ENVOI:
      return "text-blue-400";
    case StatutColis.EN_TRANSIT:
      return "text-blue-600";
    case StatutColis.ARRIVE_AGENCE:
      return "text-cyan-500";
    case StatutColis.PRET_RETIRER:
      return "text-orange-500";
    case StatutColis.LIVRE:
      return "text-green-500";
    case StatutColis.LITIGE:
      return "text-yellow-600";
    case StatutColis.ANNULE:
      return "text-red-500";
    default:
      return "text-muted-foreground";
  }
};

export const getStatutText = (statut: string | null) => {
  switch (statut) {
    case StatutColis.ENREGISTRE:
      return "Enregistré";
    case StatutColis.EN_COURS_ENVOI:
      return "En cours d'envoi";
    case StatutColis.EN_TRANSIT:
      return "En transit";
    case StatutColis.ARRIVE_AGENCE:
      return "Arrivé en agence";
    case StatutColis.PRET_RETIRER:
      return "Prêt à retirer";
    case StatutColis.LIVRE:
      return "Livré";
    case StatutColis.LITIGE:
      return "Litige";
    case StatutColis.ANNULE:
      return "Annulé";
    default:
      return statut ?? "Inconnu";
  }
};

export const getStatutVariant = (
  statut: string | null
): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" => {
  switch (statut) {
    case StatutColis.ENREGISTRE:
      return "secondary";
    case StatutColis.EN_COURS_ENVOI:
      return "info";
    case StatutColis.EN_TRANSIT:
      return "info";
    case StatutColis.ARRIVE_AGENCE:
      return "info";
    case StatutColis.PRET_RETIRER:
      return "warning";
    case StatutColis.LIVRE:
      return "success";
    case StatutColis.LITIGE:
      return "warning";
    case StatutColis.ANNULE:
      return "destructive";
    default:
      return "secondary";
  }
};

// ─── Destination ─────────────────────────────────────────────

export const getDestinationText = (destination: string) => {
  switch (destination) {
    case Destination.MALI:
      return "Mali";
    case Destination.COTE_DIVOIRE:
      return "Côte d'Ivoire";
    default:
      return destination;
  }
};

// ─── Dates ───────────────────────────────────────────────────

export const getRelativeTime = (createdAt: Date) => {
  const date = new Date(createdAt);
  const now = new Date();
  const difference = Math.abs(now.getTime() - date.getTime());

  const seconds = Math.floor(difference / 1000);
  const minutes = Math.floor(difference / (1000 * 60));
  const hours = Math.floor(difference / (1000 * 60 * 60));
  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years} an${years > 1 ? "s" : ""}`;
  if (months > 0) return `${months} mois`;
  if (weeks > 0) return `${weeks} semaine${weeks > 1 ? "s" : ""}`;
  if (days > 0) return `${days} jour${days > 1 ? "s" : ""}`;
  if (hours > 0) return `${hours} heure${hours > 1 ? "s" : ""}`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  return `${seconds} seconde${seconds > 1 ? "s" : ""}`;
};

export const getRelativeTimeWithPrefix = (createdAt: Date) => {
  return `il y a ${getRelativeTime(createdAt)}`;
};

// ─── Monnaie ─────────────────────────────────────────────────

export const amountFormatXOF = (amount: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
  }).format(amount);
};

// ─── Codes de suivi ──────────────────────────────────────────
// Format CDC : ML-2026-00142 ou CI-2026-00142

export function generateColisCode(destination: string): string {
  const prefix = destination === Destination.COTE_DIVOIRE ? "CI" : "ML";
  const year = new Date().getFullYear();
  const num = String(crypto.randomInt(10000, 99999));
  return `${prefix}-${year}-${num}`;
}

export function generatePublicToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

// ─── Tarification ────────────────────────────────────────────

export function calculatePrixTotal(
  poids: number,
  tranches: { poidsMin: number; poidsMax: number | null; prixParKg: number }[]
): number {
  if (!tranches || tranches.length === 0) return 0;
  const sorted = [...tranches].sort((a, b) => a.poidsMin - b.poidsMin);
  const tranche = sorted.find(
    (t) => poids >= t.poidsMin && (t.poidsMax === null || poids <= t.poidsMax)
  );
  if (!tranche) return poids * (sorted[sorted.length - 1]?.prixParKg ?? 0);
  return poids * tranche.prixParKg;
}
