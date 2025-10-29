import type { Metadata } from "next";
import { Geist, Geist_Mono, Roboto, Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Login from "./components/Login";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistRoboto = Roboto({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Group Ride MTB",
  description: "Find and join mountain bike group rides",
};

// const loggedIn = !!session;
const loggedIn = false;


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);


  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${inter.variable} antialiased`}>
        <nav className="flex h-14 bg-gray-50 border-b border-b-gray-200 items-center px-6 text-2xl text-black z-10">
          <Link href="/" className="whitespace-nowrap">Group Ride MTB</Link>
          <div className="flex justify-center gap-12 w-full">
            <Link href="/trails" className="cursor-pointer">Trails</Link>
            <Link href="/rides" className="cursor-pointer">Rides</Link>
            <Link href="/about" className="cursor-pointer">About</Link>
            <Link href="/register" className="cursor-pointer">Register</Link>
            {/* {loggedIn ? <Link href="/profile" className="cursor-pointer">Profile</Link> : <Link href="/login" className="cursor-pointer">Login</Link>} */}
            
            <Login session={session} />
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
