'use client';

import Link from "next/link";
import { signIn } from "next-auth/react";

export default function Login({session}: {session: any}) {
    return (
        <>
            {session ? (
                <Link 
                    href="/profile" 
                    className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors"
                >
                    Profile
                </Link>
            ) : (
                <button 
                    onClick={() => signIn()}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                >
                    Sign In
                </button>
            )}
        </>
    )
}