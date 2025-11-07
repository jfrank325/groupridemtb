'use client'

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import BasicButton from "./BasicButton";

export default function LogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        await signOut({ redirect: false });
        router.push("/");
        router.refresh(); // Refresh to update server components
    }

    return (
        <BasicButton onClick={handleLogout}>Logout</BasicButton>
    )
}