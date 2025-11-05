import type { Metadata } from "next";
import { Geist, Geist_Mono, Roboto, Inter } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { UserProvider } from "@/app/context/UserContext";
import { Navigation } from "./components/Navigation";

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
  title: "MTB Group Ride",
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
          <Navigation session={session} />
          {children}
        </body>
      </UserProvider>
    </html>
  );
}
