import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { hashPasswordResetToken } from "@/lib/passwordReset";
import { ResetPasswordForm } from "../components/ResetPasswordForm";

type ResetPasswordPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const tokenParam = searchParams?.token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam ?? null;

  if (!token) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Reset link missing</h1>
          <p className="text-sm text-gray-600">
            We couldn&apos;t find a reset token. Request a new link and try again.
          </p>
          <Link
            href="/forgot-password"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            Request new reset link
          </Link>
        </div>
      </main>
    );
  }

  const tokenHash = hashPasswordResetToken(token);

  const tokenRecord = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
    },
  });

  const tokenIsValid = Boolean(tokenRecord);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-2xl space-y-6 text-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Choose a new password</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            {tokenIsValid
              ? "Your new password will replace the old one immediately."
              : "This reset link is no longer valid. Request a new link to continue."}
          </p>
        </div>

        {tokenIsValid ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700">
            Reset links expire after they are used or after a short window of time. Request a new link
            and we&apos;ll email you fresh instructions.
          </div>
        )}

        {!tokenIsValid && (
          <Link
            href="/forgot-password"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            Request new reset link
          </Link>
        )}
      </div>
    </main>
  );
}

