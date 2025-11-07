"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import BasicButton from "../components/BasicButton";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl: "/profile",
    });

    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else if (res?.ok) {
      // Always redirect to profile page after successful login
      router.replace("/profile");
      router.refresh(); // Refresh to update server components
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 w-full max-w-sm bg-white p-6 rounded-2xl shadow-md"
    >
      <label className="flex flex-col">
        <span className="text-sm font-medium text-gray-700 mb-1">Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder:text-gray-500"
          required
        />
      </label>

      <label className="flex flex-col">
        <span className="text-sm font-medium text-gray-700 mb-1">Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder:text-gray-500"
          required
        />
      </label>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <BasicButton type="submit" disabled={loading} className="cursor-pointer">
        {loading ? "Signing in..." : "Sign In"}
      </BasicButton>

      <p className="text-xs leading-relaxed text-gray-500">
        By signing in you agree to our{' '}
        <Link
          href="/terms"
          className="font-medium text-emerald-700 underline-offset-2 hover:text-emerald-800 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        >
          Terms of Use
        </Link>
        {' '}and acknowledge our{' '}
        <Link
          href="/privacy"
          className="font-medium text-emerald-700 underline-offset-2 hover:text-emerald-800 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        >
          Privacy Policy
        </Link>
        .
      </p>

      {/* Example for OAuth provider */}
      {/* <div className="text-center text-sm text-gray-500 mt-2">or</div>

      <BasicButton
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/profile" })}
        className="bg-red-500 hover:bg-red-600"
      >
        Sign in with Google
      </BasicButton> */}
    </form>
  );
}
