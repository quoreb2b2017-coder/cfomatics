import { NextResponse } from "next/server";
import { unsubscribeByEmail } from "@/lib/subscribers";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const email = typeof data.email === "string" ? data.email : "";
  const reason = typeof data.reason === "string" ? data.reason : null;

  try {
    const result = await unsubscribeByEmail(email, reason);
    return NextResponse.json({ ok: true, found: result.found });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not unsubscribe";
    const status = message.includes("valid") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
