import { NextResponse } from "next/server";

// Server-only: admin emails never exposed to the browser
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim()).filter(Boolean);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ isAdmin: false });
    }
    return NextResponse.json({ isAdmin: ADMIN_EMAILS.includes(email) });
  } catch {
    return NextResponse.json({ isAdmin: false });
  }
}
