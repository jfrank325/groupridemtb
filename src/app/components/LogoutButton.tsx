'use client'

import { signOut } from "next-auth/react";
import BasicButton from "./BasicButton";
import { redirect } from "next/navigation";

const logout = async () => {
    await signOut();
    redirect("/");
}

export default function LogoutButton() {
    return (
        <BasicButton onClick={() => logout()}>Logout</BasicButton>
    )
}