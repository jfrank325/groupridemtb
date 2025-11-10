import { Buffer } from "node:buffer";

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
const MAILGUN_FROM_EMAIL = process.env.MAILGUN_FROM_EMAIL;
const MAILGUN_FROM_NAME = process.env.MAILGUN_FROM_NAME ?? "MTB Group Ride";

type SendLocalRideAlertArgs = {
  to: string;
  subject: string;
  html: string;
};

type MailgunMessageArgs = SendLocalRideAlertArgs;

async function sendMailgunMessage({
  to,
  subject,
  html,
}: MailgunMessageArgs): Promise<boolean> {
  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN || !MAILGUN_FROM_EMAIL) {
    console.warn(
      "[mailgun] Missing Mailgun configuration. Skipping email send.",
    );
    return false;
  }

  if (!to) {
    console.warn("[mailgun] Attempted to send email without a recipient.");
    return false;
  }

  try {
    const endpoint = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`;
    const authToken = Buffer.from(`api:${MAILGUN_API_KEY}`).toString("base64");

    const payload = new URLSearchParams();
    payload.append("from", `"${MAILGUN_FROM_NAME}" <${MAILGUN_FROM_EMAIL}>`);
    payload.append("to", to);
    payload.append("subject", subject);
    payload.append("html", html);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error("[mailgun] Failed to send email:", errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[mailgun] Error sending email:", error);
    return false;
  }
}

export async function sendLocalRideAlert(args: SendLocalRideAlertArgs): Promise<boolean> {
  return sendMailgunMessage(args);
}

export async function sendRideCancellationEmail(args: SendLocalRideAlertArgs): Promise<boolean> {
  return sendMailgunMessage(args);
}

export async function sendMessageNotificationEmail(args: SendLocalRideAlertArgs): Promise<boolean> {
  return sendMailgunMessage(args);
}

