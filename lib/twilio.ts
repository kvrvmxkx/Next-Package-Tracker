import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const from = process.env.TWILIO_PHONE_NUMBER;

export async function sendSMS(to: string, body: string): Promise<void> {
  if (!accountSid || !authToken || !from) {
    console.warn("[Twilio] Variables d'environnement manquantes — SMS non envoyé");
    return;
  }
  if (
    accountSid.startsWith("AC") === false ||
    accountSid === "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  ) {
    console.warn("[Twilio] Credentials de test — SMS non envoyé");
    return;
  }
  try {
    const client = twilio(accountSid, authToken);
    await client.messages.create({ body, from, to });
  } catch (err) {
    // fire & forget — ne pas faire crasher l'API
    console.error("[Twilio] Erreur envoi SMS:", err);
  }
}
