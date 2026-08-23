"use client";

import { useActionState } from "react";
import { signIn } from "@/lib/actions/auth";

export default function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signIn, { error: null });

  return (
    <form action={formAction} className="admin-login-form">
      <input type="hidden" name="next" value={next} />
      {state.error && (
        <div className="admin-error" role="alert">
          {state.error}
        </div>
      )}
      <div className="field">
        <label htmlFor="email">Work email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@cfomatics.com"
          required
          autoFocus
        />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
      </div>
      <button
        type="submit"
        className="btn btn-solid admin-login-submit"
        disabled={pending}
      >
        {pending ? "Signing in…" : "Sign in to admin"}
      </button>
    </form>
  );
}
