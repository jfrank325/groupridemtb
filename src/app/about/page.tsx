import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about MTB Group Ride - connecting mountain bikers with group rides and amazing trails. Join our community of passionate riders.",
  openGraph: {
    title: "About MTB Group Ride",
    description: "Learn about MTB Group Ride - connecting mountain bikers with group rides and amazing trails.",
    type: "website",
  },
};

export default function About() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                    <div className="text-center">
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                            About
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                                MTB Group Ride
                            </span>
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Connecting mountain biking enthusiasts and building an active, supportive community.
                        </p>
                    </div>
                </div>
            </section>

            {/* Content Section */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="space-y-8">
                    {/* Mission */}
                    <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-3">Our Mission</h2>
                                <p className="text-gray-600 leading-relaxed">
                                    We're dedicated to making mountain biking more accessible and enjoyable by helping riders 
                                    connect, organize group rides, and discover amazing trails. Whether you're a beginner looking 
                                    for your first trail or an experienced rider seeking new adventures, we're here to help you 
                                    find your next ride.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Features */}
                    <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">What We Offer</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Trail Discovery</h3>
                                    <p className="text-sm text-gray-600">
                                        Explore comprehensive trail maps with difficulty ratings, distances, and elevation info.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Group Rides</h3>
                                    <p className="text-sm text-gray-600">
                                        Create and join group rides with fellow enthusiasts in your area.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Community Messaging</h3>
                                    <p className="text-sm text-gray-600">
                                        Communicate with other riders about rides, trails, and share tips.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Favorites</h3>
                                    <p className="text-sm text-gray-600">
                                        Save your favorite trails and easily access them anytime.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-8 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to Get Started?</h2>
                        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                            Join our community of mountain biking enthusiasts and start exploring trails and group rides today.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}