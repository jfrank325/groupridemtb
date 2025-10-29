"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import BasicButton from "../components/BasicButton";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/profile";

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
      callbackUrl,
    });

    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else if (res?.ok) {
      router.push(callbackUrl);
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
          className="border border-gray-300 rounded-md px-3 py-2"
          required
        />
      </label>

      <label className="flex flex-col">
        <span className="text-sm font-medium text-gray-700 mb-1">Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2"
          required
        />
      </label>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <BasicButton type="submit" disabled={loading}>
        {loading ? "Signing in..." : "Sign In"}
      </BasicButton>

      {/* Example for OAuth provider */}
      <div className="text-center text-sm text-gray-500 mt-2">or</div>

      <BasicButton
        type="button"
        onClick={() => signIn("google", { callbackUrl })}
        className="bg-red-500 hover:bg-red-600"
      >
        Sign in with Google
      </BasicButton>
    </form>
  );
}
