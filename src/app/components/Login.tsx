'use client';

import Link from "next/link";
import BasicButton from "./BasicButton";


import { signIn, signOut } from "next-auth/react";

export default function Login({session}: {session: any}) {


    console.log({session}, 'session');
    return (
        <>
            {session ? <Link href="/profile">Profile</Link> : <BasicButton onClick={() => signIn()}>Sign In</BasicButton>}
        </>
    )
}