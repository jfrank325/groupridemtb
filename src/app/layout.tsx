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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://mtbgroupride.com'),
  title: {
    default: "MTB Group Ride - Find and Join Mountain Bike Group Rides",
    template: "%s | MTB Group Ride",
  },
  description: "Connect with local mountain bikers, join group rides, and discover amazing trails. Find your next adventure with fellow riders in your area.",
  keywords: [
    "mountain biking",
    "group rides",
    "mtb",
    "trail riding",
    "bike community",
    "mountain bike trails",
    "cycling groups",
    "bike meetups",
  ],
  authors: [{ name: "MTB Group Ride" }],
  creator: "MTB Group Ride",
  publisher: "MTB Group Ride",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "MTB Group Ride",
    title: "MTB Group Ride - Find and Join Mountain Bike Group Rides",
    description: "Connect with local mountain bikers, join group rides, and discover amazing trails.",
    images: [
      {
        url: "/og-image.jpg", // You'll need to add this image
        width: 1200,
        height: 630,
        alt: "MTB Group Ride - Mountain Bike Community",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MTB Group Ride - Find and Join Mountain Bike Group Rides",
    description: "Connect with local mountain bikers, join group rides, and discover amazing trails.",
    images: ["/og-image.jpg"], // You'll need to add this image
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes when ready
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
    // bing: "your-bing-verification-code",
  },
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
