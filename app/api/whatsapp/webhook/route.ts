import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

// ─── Webhook Meta WhatsApp Cloud API ─────────────────────────
// GET  : vérification du webhook (hub.challenge) lors de la
//        configuration dans le dashboard Meta
// POST : statuts des messages sortants (sent/delivered/read/failed)
//        et messages entrants

// ─── Vérification GET (hub.challenge) ────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mode      = searchParams.get("hub.mode");
  const token     = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  if (!verifyToken) {
    console.error("[Meta Webhook] WHATSAPP_WEBHOOK_VERIFY_TOKEN manquant");
    return new NextResponse(null, { status: 500 });
  }

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse(null, { status: 403 });
}

// ─── Signature X-Hub-Signature-256 ───────────────────────────

function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    // Pas de secret configuré : on accepte mais on prévient —
    // à configurer impérativement en production
    console.warn("[Meta Webhook] WHATSAPP_APP_SECRET manquant — signature non vérifiée");
    return true;
  }

  if (!signatureHeader?.startsWith("sha256=")) return false;

  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  const received = signatureHeader.slice("sha256=".length);

  try {
    const expectedBuf = Buffer.from(expected, "hex");
    const receivedBuf = Buffer.from(received, "hex");
    if (expectedBuf.length !== receivedBuf.length) return false;
    return timingSafeEqual(expectedBuf, receivedBuf);
  } catch {
    return false;
  }
}

// ─── Types payload Meta ──────────────────────────────────────

type MetaStatus = {
  id           : string;
  status       : "sent" | "delivered" | "read" | "failed";
  timestamp    : string;
  recipient_id : string;
  errors      ?: Array<{
    code       : number;
    title     ?: string;
    message   ?: string;
    error_data?: { details?: string };
  }>;
};

type MetaMessage = {
  id    : string;
  from  : string;
  type  : string;
  text ?: { body: string };
};

type MetaWebhookBody = {
  object: string;
  entry?: Array<{
    changes?: Array<{
      field: string;
      value: {
        statuses?: MetaStatus[];
        messages?: MetaMessage[];
      };
    }>;
  }>;
};

// ─── Réception POST ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  let raw = "";
  try {
    raw = await req.text();

    if (!verifySignature(raw, req.headers.get("x-hub-signature-256"))) {
      return new NextResponse(null, { status: 401 });
    }

    const body = JSON.parse(raw) as MetaWebhookBody;

    if (body.object !== "whatsapp_business_account") {
      return new NextResponse(null, { status: 200 });
    }

    const logs: Array<{
      event: string;
      messageId: string | null;
      phone: string;
      status: string | null;
      message: string | null;
      rawPayload: string;
    }> = [];

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== "messages") continue;

        // Statuts des messages sortants
        for (const s of change.value.statuses ?? []) {
          const error = s.errors?.[0];
          logs.push({
            event    : "message.status",
            messageId: s.id ?? null,
            phone    : s.recipient_id ? "+" + s.recipient_id : "",
            status   : s.status ?? null,
            message  : error
              ? `Erreur ${error.code}: ${error.title ?? ""} ${error.error_data?.details ?? error.message ?? ""}`.trim()
              : null,
            rawPayload: JSON.stringify(s),
          });
        }

        // Messages entrants (réponses des clients)
        for (const m of change.value.messages ?? []) {
          logs.push({
            event    : "message.received",
            messageId: m.id ?? null,
            phone    : m.from ? "+" + m.from : "",
            status   : null,
            message  : m.text?.body ?? `[${m.type}]`,
            rawPayload: JSON.stringify(m),
          });
        }
      }
    }

    if (logs.length > 0) {
      await prisma.whatsappLog.createMany({ data: logs });
    }

    return new NextResponse(null, { status: 200 });
  } catch (err) {
    console.error("[Meta Webhook]", err);
    // Toujours 200 pour éviter que Meta ne désactive le webhook
    return new NextResponse(null, { status: 200 });
  }
}
