"use client";

import { useState } from "react";
import ConsentText from "@/components/resources/ConsentText";
import {
  emailNoteText,
  footerText,
  isOptOutConsent,
  personalEmailMessage,
  publicConsents,
  publicQuestions,
  stepTwoFields,
} from "@/lib/resources";
import type { ResourceItem } from "@/types/database";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function DownloadIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" width="16" height="16">
      <path
        d="M8 1.5v8.2M4.8 7.2 8 10.4l3.2-3.2M3 13.5h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DownloadForm({ resource }: { resource: ResourceItem }) {
  const note = emailNoteText(resource.form_config);
  const footer = footerText(resource.form_config);
  const fields = stepTwoFields(resource.form_config);
  const questions = publicQuestions(resource.form_config);
  const consents = publicConsents(resource.form_config);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [ticks, setTicks] = useState<boolean[]>(() => consents.map(() => false));
  const [values, setValues] = useState<Record<string, string>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [downloadId, setDownloadId] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const consentsOk = consents.every((consent, index) => {
    if (isOptOutConsent(consent) || consent.required === false) return true;
    return ticks[index];
  });

  function payload() {
    return {
      email,
      slug: resource.slug,
      category: resource.category,
      id: downloadId || undefined,
      consents: ticks,
      fields: {
        first_name: firstName,
        last_name: lastName,
        ...values,
      },
      answers,
    };
  }

  async function saveEmail() {
    const personal = personalEmailMessage(email);
    if (!EMAIL_RE.test(email) || personal) {
      setError(personal || "Enter a valid work email");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/resources/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saveOnly: true,
          email,
          slug: resource.slug,
          category: resource.category,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; id?: string };
      if (!res.ok || !data.id) throw new Error(data.error || "Could not save");
      setDownloadId(data.id);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setPending(false);
    }
  }

  async function downloadPdf() {
    setPending(true);
    try {
      const res = await fetch("/api/resources/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload()),
      });
      const type = res.headers.get("content-type") || "";
      if (!res.ok || !type.includes("pdf")) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Could not download");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const match = /filename="([^"]+)"/.exec(res.headers.get("content-disposition") || "");
      link.href = url;
      link.download = match?.[1] || `${resource.slug}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not download");
    } finally {
      setPending(false);
    }
  }

  async function onSubmit() {
    setError("");
    if (done) {
      await downloadPdf();
      return;
    }
    if (step === 1) {
      await saveEmail();
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setError("First name and last name are required");
      return;
    }
    for (const field of fields) {
      if (field.required && !values[field.key]?.trim()) {
        setError(`${field.label} is required`);
        return;
      }
    }
    for (const question of questions) {
      if (!answers[question.text]?.trim()) {
        setError("Answer each question");
        return;
      }
    }
    if (!consentsOk) {
      setError("Tick the required consent boxes");
      return;
    }
    await downloadPdf();
  }

  if (done) {
    return (
      <div id="download" className="res-download">
        <h2>Download started</h2>
        <button type="button" className="res-download-btn" disabled={pending} onClick={() => void downloadPdf()}>
          <DownloadIcon />
          {pending ? "Working…" : "Download PDF again"}
        </button>
      </div>
    );
  }

  return (
    <form
      id="download"
      className="res-download"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit();
      }}
    >
      <h2>{step === 1 ? "Download" : "Your details"}</h2>
      <label>
        Work email
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          readOnly={step === 2}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <p className="res-download-note">{note}</p>

      {step === 2 && (
        <>
          <label>
            First name
            <input
              type="text"
              name="first_name"
              required
              autoComplete="given-name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />
          </label>
          <label>
            Last name
            <input
              type="text"
              name="last_name"
              required
              autoComplete="family-name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />
          </label>
          {fields.map((field) => (
            <label key={field.key}>
              {field.label}
              <input
                type={field.type}
                required={field.required}
                autoComplete={field.key === "phone" ? "tel" : "off"}
                value={values[field.key] ?? ""}
                onChange={(event) =>
                  setValues((current) => ({ ...current, [field.key]: event.target.value }))
                }
              />
            </label>
          ))}
          {questions.map((question) => (
            <label key={question.text}>
              {question.text}
              {question.options.length >= 2 ? (
                <select
                  required
                  value={answers[question.text] ?? ""}
                  onChange={(event) =>
                    setAnswers((current) => ({ ...current, [question.text]: event.target.value }))
                  }
                >
                  <option value="">Select</option>
                  {question.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={answers[question.text] ?? ""}
                  onChange={(event) =>
                    setAnswers((current) => ({ ...current, [question.text]: event.target.value }))
                  }
                />
              )}
            </label>
          ))}
          {consents.map((consent, index) => (
            <label key={`${consent.role ?? "extra"}-${index}`} className="res-check">
              <input
                type="checkbox"
                checked={ticks[index]}
                onChange={(event) => {
                  const next = [...ticks];
                  next[index] = event.target.checked;
                  setTicks(next);
                }}
              />
              <span>
                <ConsentText text={consent.text} />
              </span>
            </label>
          ))}
        </>
      )}

      {error ? <p className="res-download-error">{error}</p> : null}
      {step === 1 ? (
        <button type="submit" className="res-download-btn" disabled={pending}>
          <DownloadIcon />
          {pending ? "Working…" : "Download"}
        </button>
      ) : (
        <>
          <button type="submit" className="res-download-btn" disabled={pending || !consentsOk}>
            <DownloadIcon />
            {pending ? "Working…" : "Download Now"}
          </button>
          <p className="res-download-foot">
            <ConsentText text={footer} />
          </p>
        </>
      )}
    </form>
  );
}
