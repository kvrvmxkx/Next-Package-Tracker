import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { Roles, isAdmin } from "@/lib/enums";

// Alphabet sans caractères ambigus (0/O, 1/l/I)
const ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateTempPassword(length = 10): string {
  let password = "";
  for (let i = 0; i < length; i++) {
    password += ALPHABET[randomInt(ALPHABET.length)];
  }
  return password;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || !isAdmin((session.user as any).role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });
    if (!target) {
      return NextResponse.json({ error: "Agent introuvable" }, { status: 404 });
    }

    const callerRole = (session.user as any).role;
    if (callerRole === Roles.ADMIN && target.role === Roles.SUPER_ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tempPassword = generateTempPassword();
    const hash = await hashPassword(tempPassword);

    const { count } = await prisma.account.updateMany({
      where: { userId: id, providerId: "credential" },
      data: { password: hash },
    });
    if (count === 0) {
      return NextResponse.json(
        { error: "Aucun compte à mot de passe pour cet agent" },
        { status: 404 }
      );
    }

    // Forcer le changement au prochain login + invalider les sessions ouvertes
    await prisma.user.update({
      where: { id },
      data: { mustChangePassword: true },
    });
    await prisma.session.deleteMany({ where: { userId: id } });

    return NextResponse.json({ tempPassword });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
