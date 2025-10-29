'use client';

import BasicButton from "./BasicButton";


import { signIn, signOut } from "next-auth/react";

export default function Login({session}: {session: any}) {


    console.log({session}, 'session');
    return (
        <>
            {session ? <BasicButton onClick={() => signOut()}>Sign Out</BasicButton> : <BasicButton onClick={() => signIn()}>Sign In</BasicButton>}
        </>
    )
}