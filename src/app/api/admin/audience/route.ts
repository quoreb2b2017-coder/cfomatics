import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  const auth = await requireAdminApi(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
  }
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  const id = url.searchParams.get("id") || "";
  if (!id || (kind !== "subscribe" && kind !== "download")) {
    return NextResponse.json({ error: "Missing row" }, { status: 400 });
  }
  const table = kind === "subscribe" ? "subscribers" : "resource_downloads";
  const { error } = await auth.admin.from(table).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
