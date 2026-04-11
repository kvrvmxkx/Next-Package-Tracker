import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Roles } from "@/lib/enums";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("setup_token");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Prevent double setup
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    return NextResponse.json({ error: "Already configured" }, { status: 400 });
  }

  try {
    const { firstname, lastname, email, phone, password } = await req.json();

    const result = await auth.api.signUpEmail({
      body: {
        name: `${firstname} ${lastname}`,
        firstname,
        lastname,
        email,
        phone,
        password,
      },
    });

    await prisma.user.update({
      where: { id: result.user.id },
      data: {
        role: Roles.SUPER_ADMIN,
        mustChangePassword: false,
      },
    });

    cookieStore.delete("setup_token");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Setup failed" }, { status: 500 });
  }
}
