import { RidesAndTrailsServer } from "./components/RidesAndTrailsServer";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MTB Group Ride - Find and Join Mountain Bike Group Rides",
  description: "Connect with local mountain bikers, join group rides, and discover amazing trails. Find your next adventure with fellow riders in your area.",
  openGraph: {
    title: "MTB Group Ride - Find and Join Mountain Bike Group Rides",
    description: "Connect with local mountain bikers, join group rides, and discover amazing trails together.",
    type: "website",
  },
};

export default async function Home() {
  const session = await getServerSession(authOptions);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mtbgroupride.com';
  
  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "MTB Group Ride",
    "description": "Connect with local mountain bikers, join group rides, and discover amazing trails",
    "url": siteUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteUrl}/rides?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-b border-gray-200">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
              Your Next Ride
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                Starts with the Crew
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Link up with local mountain bikers, join group rides, and discover trails together. Adventure’s better when it’s shared.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!session ? (
                <>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-lg hover:shadow-xl"
                  >
                    Get Started
                  </Link>
                  <Link
                    href="/rides"
                    className="inline-flex items-center justify-center px-6 py-3 border-2 border-emerald-600 text-base font-medium rounded-lg text-emerald-600 bg-white hover:bg-emerald-50 transition-colors"
                  >
                    Browse Rides
                  </Link>
                </>
              ) : (
                <Link
                  href="/rides/new"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-lg hover:shadow-xl"
                >
                  Create a Ride
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <RidesAndTrailsServer />
      </section>
    </main>
    </>
  );
}
