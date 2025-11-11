import Link from "next/link";

import { ForgotPasswordForm } from "../components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-2xl space-y-6 text-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Forgot your password?</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Enter the email address associated with your account and we&apos;ll send you a reset link.
          </p>
        </div>
        <ForgotPasswordForm />
        <p className="text-xs text-gray-500">
          <Link
            href="/privacy"
            className="font-medium text-emerald-700 underline-offset-2 hover:text-emerald-800 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            Privacy policy
          </Link>{" "}
          ·{" "}
          <Link
            href="/terms"
            className="font-medium text-emerald-700 underline-offset-2 hover:text-emerald-800 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            Terms of use
          </Link>
        </p>
      </div>
    </main>
  );
}

