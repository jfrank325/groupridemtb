"use client";

import Link from "next/link";
import { useState } from "react";

interface ForgotPasswordFormProps {
  loginHref?: string;
}

export function ForgotPasswordForm({ loginHref = "/login" }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (status === "submitting") {
      return;
    }

    setStatus("submitting");
    setMessage(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const error = data?.error ?? "Unable to send reset email. Please try again.";
        setStatus("error");
        setMessage(error);
        return;
      }

      setStatus("success");
      setMessage(
        "If we find an account with that email address, we’ll send instructions to reset your password.",
      );
      setEmail("");
    } catch (error) {
      console.error("[FORGOT_PASSWORD_FORM]", error);
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-md mx-auto"
    >
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {message && (
        <p
          className={`text-sm ${
            status === "success" ? "text-emerald-600" : "text-red-600"
          }`}
          role="status"
        >
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
      >
        {status === "submitting" ? "Sending reset link..." : "Send reset link"}
      </button>

      <p className="text-xs text-gray-500">
        Remembered your password?{" "}
        <Link
          className="font-medium text-emerald-700 underline-offset-2 hover:text-emerald-800 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          href={loginHref}
        >
          Return to login
        </Link>
      </p>
    </form>
  );
}

