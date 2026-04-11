import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { secret } = await req.json();

  if (!process.env.SETUP_SECRET || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set("setup_token", "valid", {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 60 * 15, // 15 minutes
  });

  return NextResponse.json({ success: true });
}
