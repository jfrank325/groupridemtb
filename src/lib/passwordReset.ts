import crypto from "node:crypto";

const PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES = 60;

export function generatePasswordResetToken() {
  const token = crypto.randomBytes(48).toString("hex");
  const tokenHash = hashPasswordResetToken(token);
  const expiresAt = new Date(
    Date.now() + PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES * 60 * 1000,
  );

  return {
    token,
    tokenHash,
    expiresAt,
    maxAgeMinutes: PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES,
  };
}

export function hashPasswordResetToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

