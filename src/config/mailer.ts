import nodemailer, { Transporter } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

let transporter: Transporter<SMTPTransport.SentMessageInfo> | null = null;

export function getMailer(): Transporter<SMTPTransport.SentMessageInfo> | null {
  if (transporter) return transporter;

  const enabled = (process.env.MAILTRAP_ENABLED ?? "true").toLowerCase() !== "false";
  const host = process.env.MAILTRAP_HOST;
  const port = process.env.MAILTRAP_PORT;
  const user = process.env.MAILTRAP_USER;
  const pass = process.env.MAILTRAP_PASSWORD;

  if (!enabled) {
    console.warn("Mailtrap disabled by MAILTRAP_ENABLED=false");
    return null;
  }

  if (!host || !port || !user || !pass) {
    console.warn("Mailtrap not configured: missing MAILTRAP_* envs");
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host,
      port: parseInt(port, 10),
      auth: {
        user,
        pass,
      },
    });

    console.info("Mailtrap transporter initialized successfully");
    return transporter;
  } catch (error) {
    console.error("Failed to initialize Mailtrap transporter:", error);
    return null;
  }
}

