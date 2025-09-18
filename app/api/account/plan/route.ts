import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic"; // ensure no caching issues for POST

type Payload = { email?: string; premium?: boolean; plan?: "free" | "premium" };

function isAdmin(email: string | null | undefined): boolean {
  const admins = (process.env.ADMIN_EMAILS || "").split(",").map(s => s.trim()).filter(Boolean);
  if (!email) return false;
  return admins.includes(email);
}

export async function POST(req: NextRequest) {
  // DB required for premium toggling
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database required (DATABASE_URL not set)" }, { status: 501 });
  }

  // Must be signed in and an admin
  const session = await getServerSession(authOptions as any);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Payload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const targetEmail = (body.email || "").trim();
  if (!targetEmail) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const premium = body.premium ?? (body.plan === "premium");
  const plan: "free" | "premium" = premium ? "premium" : "free";

  // Target user must exist (sign in at least once)
  const user = await prisma.user.findUnique({ where: { email: targetEmail } });
  if (!user) {
    return NextResponse.json({ error: "User not found (the user must sign in first)" }, { status: 404 });
  }

  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: { userId: user.id, isPremium: premium, plan },
    update: { isPremium: premium, plan },
  });

  return NextResponse.json({ ok: true, email: targetEmail, plan });
}
