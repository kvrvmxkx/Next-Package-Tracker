import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, firstname: true, lastname: true, email: true, phone: true, role: true },
  });
  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { firstname, lastname, phone } = await req.json();

  if (!firstname?.trim() || !lastname?.trim()) {
    return NextResponse.json({ error: "Prénom et nom requis" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      name: `${firstname.trim()} ${lastname.trim()}`,
      phone: phone?.trim() ?? "",
    },
    select: { id: true, firstname: true, lastname: true, email: true, phone: true },
  });

  return NextResponse.json(user);
}

export async function DELETE() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { active: false },
  });

  return NextResponse.json({ success: true });
}

// PATCH — marque mustChangePassword = false après changement de mdp
export async function PATCH() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { mustChangePassword: false },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
