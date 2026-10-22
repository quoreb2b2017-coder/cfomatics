"use client";

import { useState } from "react";

export default function RowDeleteButton({
  id,
  kind,
  onDeleted,
}: {
  id: string;
  kind: "subscribe" | "download";
  onDeleted?: (id: string) => void;
}) {
  const [pending, setPending] = useState(false);

  async function onClick() {
    if (!window.confirm("Delete this row?")) return;
    setPending(true);
    try {
      const res = await fetch(`/api/admin/audience?kind=${kind}&id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not delete");
      onDeleted?.(id);
      if (!onDeleted) window.location.reload();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Could not delete");
      setPending(false);
    }
  }

  return (
    <button type="button" className="admin-text-btn" onClick={onClick} disabled={pending}>
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
