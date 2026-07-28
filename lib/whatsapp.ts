import { prisma } from "@/lib/prisma";
import { getStatutText } from "@/lib/utils";
import { StatutColis } from "@/lib/enums";

const META_API_BASE = "https://graph.facebook.com/v21.0";

const TEMPLATE_SUIVI         = "cf_air_cargo_suivi_colis";
const TEMPLATE_PRET_RETIRER  = "cf_air_cargo_colis_pret_retirer";

// ─── Types ────────────────────────────────────────────────────

const BULK_DELAY_MS = 1000;

type WaParam     = { type: "text"; text: string };
type WaComponent = {
  type      : "header" | "body" | "button";
  sub_type ?: "url";
  index    ?: number;
  parameters: WaParam[];
};

// ─── Utilitaires téléphone ────────────────────────────────────

function normalizePhone(phone: string, country?: "ML" | "CI"): string {
  let p = phone.trim().replace(/\s+/g, "");
  if (p.startsWith("00")) p = "+" + p.slice(2);
  if (p.startsWith("+")) return p;
  if (p.startsWith("223") || p.startsWith("225")) return "+" + p;
  if (country === "CI") return "+225" + p;
  return "+223" + p;
}

function isValidPhone(normalized: string): boolean {
  const local = normalized.startsWith("+225")
    ? normalized.slice(4)
    : normalized.startsWith("+223")
    ? normalized.slice(4)
    : normalized.slice(1);
  if (local.length < 6) return false;
  if (/^(\d)\1+$/.test(local)) return false;
  return true;
}

// ─── Envoi d'un template ──────────────────────────────────────

async function sendTemplate(
  to        : string,
  name      : string,
  components: WaComponent[],
  country  ?: "ML" | "CI"
): Promise<void> {
  const token   = process.env.WHATSAPP_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) {
    console.warn("[Meta] WHATSAPP_API_TOKEN ou WHATSAPP_PHONE_NUMBER_ID manquant — template non envoyé");
    return;
  }

  const normalized = normalizePhone(to, country);
  if (!isValidPhone(normalized)) {
    console.warn(`[Meta] Numéro invalide ignoré : ${normalized}`);
    return;
  }

  const payload = {
    messaging_product: "whatsapp",
    to               : normalized,
    type             : "template",
    template         : {
      name,
      language  : { code: "fr" },
      components,
    },
  };

  let responseText   = "";
  let responseStatus = 0;
  let messageId: string | null = null;

  const MAX_RETRIES = 3;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${META_API_BASE}/${phoneId}/messages`, {
        method : "POST",
        headers: {
          Authorization : `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      responseText   = await res.text();
      responseStatus = res.status;

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get("retry-after") ?? "5", 10);
        console.warn(`[Meta] Rate limit (429) — retry dans ${retryAfter}s (tentative ${attempt}/${MAX_RETRIES})`);
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        continue;
      }

      if (!res.ok) {
        console.error(`[Meta] Template erreur ${res.status}: ${responseText}`);
      } else {
        console.log(`[Meta] Template ${name} → ${normalized}`);
        try {
          const json = JSON.parse(responseText);
          messageId  = json?.messages?.[0]?.id ?? null;
        } catch {}
      }
      break;
    } catch (err) {
      console.error(`[Meta] Erreur envoi template (tentative ${attempt}/${MAX_RETRIES}):`, err);
      responseStatus = 0;
      responseText   = String(err);
      if (attempt < MAX_RETRIES) await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }

  try {
    await prisma.whatsappLog.create({
      data: {
        event     : "message.outgoing",
        messageId,
        phone     : normalized,
        status    : responseStatus >= 200 && responseStatus < 300 ? "sent" : "failed",
        message   : `[template:${name}]`,
        rawPayload: JSON.stringify({ to: normalized, template: name, status: responseStatus, response: responseText }),
      },
    });
  } catch (dbErr) {
    console.error("[Meta] Erreur log DB:", dbErr);
  }
}

// ─── Template : suivi_colis ───────────────────────────────────
// Utilisé pour : ENREGISTRE, EN_COURS_ENVOI, EN_TRANSIT,
//                ARRIVE_AGENCE, LITIGE, ANNULE, LIVRE

export async function sendSuiviColis(params: {
  to          : string;
  code        : string;
  statut      : string;
  tokenPublic : string;
  country    ?: "ML" | "CI";
}): Promise<void> {
  const { to, code, statut, tokenPublic, country } = params;

  await sendTemplate(to, TEMPLATE_SUIVI, [
    {
      type      : "header",
      parameters: [{ type: "text", text: code }],
    },
    {
      type      : "body",
      parameters: [
        { type: "text", text: code },
        { type: "text", text: getStatutText(statut) },
      ],
    },
    {
      type      : "button",
      sub_type  : "url",
      index     : 0,
      parameters: [{ type: "text", text: tokenPublic }],
    },
  ], country);
}

export async function sendSuiviColisBulk(
  messages: Array<{
    to         : string;
    code       : string;
    statut     : string;
    tokenPublic: string;
    country   ?: "ML" | "CI";
  }>
): Promise<void> {
  for (const msg of messages) {
    await sendSuiviColis(msg);
    await new Promise((r) => setTimeout(r, BULK_DELAY_MS));
  }
}

// ─── Template : colis_pret_retirer ───────────────────────────
// Utilisé pour : PRET_RETIRER uniquement

export async function sendPretRetirer(params: {
  to          : string;
  code        : string;
  agenceNom   : string;
  tokenPublic : string;
  country    ?: "ML" | "CI";
}): Promise<void> {
  const { to, code, agenceNom, tokenPublic, country } = params;

  await sendTemplate(to, TEMPLATE_PRET_RETIRER, [
    {
      type      : "header",
      parameters: [{ type: "text", text: code }],
    },
    {
      type      : "body",
      parameters: [
        { type: "text", text: code },
        { type: "text", text: agenceNom },
      ],
    },
    {
      type      : "button",
      sub_type  : "url",
      index     : 0,
      parameters: [{ type: "text", text: tokenPublic }],
    },
  ], country);
}

export async function sendPretRetirerBulk(
  messages: Array<{
    to         : string;
    code       : string;
    agenceNom  : string;
    tokenPublic: string;
    country   ?: "ML" | "CI";
  }>
): Promise<void> {
  for (const msg of messages) {
    await sendPretRetirer(msg);
    await new Promise((r) => setTimeout(r, BULK_DELAY_MS));
  }
}

// ─── Dispatcher ───────────────────────────────────────────────
// Choisit automatiquement le bon template selon le statut

export async function sendColisNotification(params: {
  to          : string;
  code        : string;
  statut      : string;
  agenceNom   : string;
  tokenPublic : string;
  country    ?: "ML" | "CI";
}): Promise<void> {
  if (params.statut === StatutColis.PRET_RETIRER) {
    await sendPretRetirer(params);
  } else {
    await sendSuiviColis(params);
  }
}
