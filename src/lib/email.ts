import "server-only";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let cached: Transporter | null | undefined;

export function isMailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
  );
}

export function getMailer(): Transporter | null {
  if (cached !== undefined) return cached;
  if (!isMailConfigured()) {
    cached = null;
    return null;
  }

  cached = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return cached;
}

export function mailFrom(): string {
  return (
    process.env.SMTP_FROM ||
    `CFOmatics <${process.env.SMTP_USER ?? "editorial@cfomatics.com"}>`
  );
}
