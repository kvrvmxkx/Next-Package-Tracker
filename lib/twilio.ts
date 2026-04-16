import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const from = process.env.TWILIO_PHONE_NUMBER;

/**
 * Normalise un numéro de téléphone malien ou ivoirien vers le format E.164.
 * - Si le numéro commence par 00, remplace par +
 * - Si le numéro commence par 223 ou 225 sans +, ajoute +
 * - Si le numéro est local (8 chiffres commençant par 6/7/0/5…) :
 *     · 223XXXXXXXX  → Mali
 *     · 225XXXXXXXX  → Côte d'Ivoire (déterminé par le paramètre `country`)
 */
function normalizePhone(phone: string, country?: "ML" | "CI"): string {
  let p = phone.trim().replace(/\s+/g, "");

  // 00XX… → +XX…
  if (p.startsWith("00")) {
    p = "+" + p.slice(2);
  }

  // Déjà au format E.164
  if (p.startsWith("+")) return p;

  // Commence par 223 ou 225 sans le +
  if (p.startsWith("223") || p.startsWith("225")) {
    return "+" + p;
  }

  // Numéro local : ajouter le préfixe pays
  if (country === "CI") return "+225" + p;
  // Par défaut : Mali
  return "+223" + p;
}

export async function sendSMS(
  to: string,
  body: string,
  country?: "ML" | "CI"
): Promise<void> {
  if (!accountSid || !authToken || !from) {
    console.warn("[Twilio] Variables d'environnement manquantes — SMS non envoyé");
    return;
  }
  const normalized = normalizePhone(to, country);
  try {
    const client = twilio(accountSid, authToken);
    await client.messages.create({ body, from, to: normalized });
  } catch (err) {
    // fire & forget — ne pas faire crasher l'API
    console.error("[Twilio] Erreur envoi SMS:", err);
  }
}
