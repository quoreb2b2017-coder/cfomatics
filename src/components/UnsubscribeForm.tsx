"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import BrandLogo from "@/components/BrandLogo";

const REASONS = [
  "The coverage no longer matches what I follow.",
  "Emails are hard to open or keep landing in spam.",
  "I am getting more messages than I need right now.",
  "I do not recall signing up for these emails.",
  "Something else.",
] as const;

export default function UnsubscribeForm({
  initialEmail = "",
}: {
  initialEmail?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, reason }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        ok?: boolean;
      };
      if (!res.ok) {
        throw new Error(data.error || "Could not unsubscribe");
      }
      router.replace("/unsubscribe?done=1");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not unsubscribe");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="unsub-card">
      <header className="unsub-card-head">
        <Link href="/" className="unsub-close" aria-label="Close">
          ×
        </Link>
        <BrandLogo variant="onDark" href="/" />
        <p className="unsub-card-title">Unsubscribe from email updates</p>
      </header>

      <form className="unsub-card-body" onSubmit={onSubmit}>
        <p className="unsub-lead">
          Enter the email you used to subscribe. We&apos;ll remove it from the
          CFOmatics update list.
        </p>

        <label className="unsub-label" htmlFor="unsub-email">
          Email
        </label>
        <input
          id="unsub-email"
          className="unsub-input"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Work email"
          required
          autoComplete="email"
          disabled={pending}
        />

        <p className="unsub-label unsub-label--spaced">
          Why are you leaving?{" "}
          <span className="unsub-optional">(optional insight)</span>
        </p>
        <ul className="unsub-reasons">
          {REASONS.map((item) => (
            <li key={item}>
              <label className="unsub-reason">
                <input
                  type="radio"
                  name="reason"
                  value={item}
                  checked={reason === item}
                  onChange={() => setReason(item)}
                  disabled={pending}
                />
                <span>{item}</span>
              </label>
            </li>
          ))}
        </ul>

        {error ? <p className="unsub-error">{error}</p> : null}

        <button type="submit" className="unsub-submit" disabled={pending}>
          {pending ? "Submitting…" : "Submit"}
        </button>
      </form>
    </div>
  );
}
