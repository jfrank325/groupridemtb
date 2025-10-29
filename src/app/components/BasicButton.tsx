"use client";

import { ButtonHTMLAttributes } from "react";

export default function BasicButton({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
    >
      {children}
    </button>
  );
}
