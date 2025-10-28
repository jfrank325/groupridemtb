import type { Metadata } from "next";
import { Geist, Geist_Mono, Roboto, Inter } from "next/font/google";
import "./globals.css";
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

// const session = await getServerSession(authOptions);
// const loggedIn = !!session;
const loggedIn = false;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${inter.variable} antialiased`}>
        <nav className="flex h-14 bg-gray-50 border-b border-b-gray-200 items-center px-6 text-2xl text-black z-10">
          <a href="/" className="whitespace-nowrap">Group Ride MTB</a>
          <div className="flex justify-center gap-12 w-full">
            <a href="/trails" className="cursor-pointer">Trails</a>
            <a href="/rides" className="cursor-pointer">Rides</a>
            <a href="/about" className="cursor-pointer">About</a>
            {loggedIn ? <a href="/profile" className="cursor-pointer">Profile</a> : <a href="/login" className="cursor-pointer">Login</a>}
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
