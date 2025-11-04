import type { Metadata } from "next";
import { Geist, Geist_Mono, Roboto, Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Login from "./components/Login";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { UserProvider } from "@/app/context/UserContext";
import { MessagesIcon } from "./components/MessagesIcon";

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
  console.log({ session }, 'session');


  return (
    <html lang="en">
      <UserProvider session={session}>

        <body
          className={`${geistSans.variable} ${inter.variable} antialiased`}>
          <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between">
                <Link 
                  href="/" 
                  className="flex items-center space-x-2 group"
                >
                  <svg 
                    className="w-8 h-8 text-emerald-600 group-hover:text-emerald-700 transition-colors" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Group Ride MTB
                  </span>
                </Link>
                <div className="flex items-center gap-6">
                  <Link 
                    href="/trails" 
                    className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors"
                  >
                    Trails
                  </Link>
                  <Link 
                    href="/rides" 
                    className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors"
                  >
                    Rides
                  </Link>
                  <Link 
                    href="/about" 
                    className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors"
                  >
                    About
                  </Link>
                  {!session && (
                    <Link 
                      href="/register" 
                      className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors"
                    >
                      Register
                    </Link>
                  )}
                  {session && (
                    <div className="flex items-center">
                      <MessagesIcon />
                    </div>
                  )}
                  <Login session={session} />
                </div>
              </div>
            </div>
          </nav>
          {children}
        </body>
      </UserProvider>
    </html>
  );
}
