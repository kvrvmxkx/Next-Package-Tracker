import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma  = new PrismaClient({ adapter });

const META_URL    = `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
const TOKEN       = process.env.WHATSAPP_API_TOKEN!;
const DELAY_MS    = 3000;

const STATUT_TEXT: Record<string, string> = {
  ENREGISTRE     : "Enregistré",
  EN_COURS_ENVOI : "En cours d'envoi",
  EN_TRANSIT     : "En transit",
  ARRIVE_AGENCE  : "Arrivé en agence",
  PRET_RETIRER   : "Prêt à retirer",
  LIVRE          : "Livré",
  LITIGE         : "Litige",
  ANNULE         : "Annulé",
};

function normalizePhone(phone: string, country: "ML" | "CI"): string {
  let p = phone.trim().replace(/\s+/g, "");
  if (p.startsWith("00")) p = "+" + p.slice(2);
  if (p.startsWith("+")) return p;
  if (p.startsWith("223") || p.startsWith("225")) return "+" + p;
  return country === "CI" ? "+225" + p : "+223" + p;
}

function isValidPhone(normalized: string): boolean {
  const local = normalized.startsWith("+225") ? normalized.slice(4)
              : normalized.startsWith("+223") ? normalized.slice(4)
              : normalized.slice(1);
  if (local.length < 6) return false;
  if (/^(\d)\1+$/.test(local)) return false;
  return true;
}

async function sendSuivi(params: {
  to: string; code: string; statut: string; tokenPublic: string; country: "ML" | "CI";
}): Promise<"ok" | "invalid" | "error"> {
  const normalized = normalizePhone(params.to, params.country);
  if (!isValidPhone(normalized)) return "invalid";

  const payload = {
    messaging_product: "whatsapp",
    to: normalized,
    type: "template",
    template: {
      name: "cf_air_cargo_suivi_colis",
      language: { code: "fr" },
      components: [
        { type: "header", parameters: [{ type: "text", text: params.code }] },
        { type: "body",   parameters: [
            { type: "text", text: params.code },
            { type: "text", text: STATUT_TEXT[params.statut] ?? params.statut },
          ]},
        { type: "button", sub_type: "url", index: 0,
          parameters: [{ type: "text", text: params.tokenPublic }] },
      ],
    },
  };

  try {
    const res = await fetch(META_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`  ✗ ${normalized} — ${res.status} ${await res.text()}`);
      return "error";
    }
    return "ok";
  } catch (err) {
    console.error(`  ✗ ${normalized} — ${err}`);
    return "error";
  }
}

async function main() {
  const colis = await prisma.colis.findMany({
    where: { createdAt: { gte: new Date('2026-06-19T00:00:00Z') } },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`\n🚀 Envoi en cours — ${colis.length} colis\n`);

  let ok = 0, invalid = 0, error = 0;

  for (let i = 0; i < colis.length; i++) {
    const c       = colis[i];
    const country = c.destination === "COTE_DIVOIRE" ? "CI" : "ML";
    const result  = await sendSuivi({
      to: c.destinatairePhone, code: c.code, statut: c.statut,
      tokenPublic: c.tokenPublic, country,
    });

    if (result === "ok")      ok++;
    if (result === "invalid") invalid++;
    if (result === "error")   error++;

    console.log(`[${i + 1}/${colis.length}] ${c.code} → ${c.destinatairePhone} (${c.statut}) : ${result}`);

    if (i < colis.length - 1) await new Promise(r => setTimeout(r, DELAY_MS));
  }

  console.log(`\n✅ Terminé — OK: ${ok} | Invalides: ${invalid} | Erreurs: ${error}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
