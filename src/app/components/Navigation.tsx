"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import Login from "./Login";
import { MessagesIcon } from "./MessagesIcon";
import { Session } from "next-auth";

interface NavigationProps {
  session: Session | null;
}

export function Navigation({ session }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!session) return;

    async function fetchUnreadCount() {
      try {
        const res = await fetch("/api/messages/unread-count");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count || 0);
        }
      } catch (error) {
        console.error("Failed to fetch unread count", error);
      }
    }

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [session]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-2 group"
            onClick={closeMobileMenu}
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
              MTB Group Ride
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/trails"
              className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors focus:outline-none  focus:text-emerald-600 focus:font-bold"
            >
              Trails
            </Link>
            <Link
              href="/rides"
              className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors focus:outline-none focus:text-emerald-600 focus:font-bold"
            >
              Rides
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors focus:outline-none focus:text-emerald-600 focus:font-bold"
            >
              About
            </Link>
            {!session && (
              <Link
                href="/register"
                className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors focus:outline-none focus:text-emerald-600 focus:font-bold"
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

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
              onClick={closeMobileMenu}
            />
            {/* Menu Panel */}
            <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50 md:hidden">
              <div className="flex flex-col py-4">
                <Link
                  href="/trails"
                  className="px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors"
                  onClick={closeMobileMenu}
                >
                  Trails
                </Link>
                <Link
                  href="/rides"
                  className="px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors"
                  onClick={closeMobileMenu}
                >
                  Rides
                </Link>
                <Link
                  href="/about"
                  className="px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors"
                  onClick={closeMobileMenu}
                >
                  About
                </Link>
                {!session && (
                  <Link
                    href="/register"
                    className="px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Register
                  </Link>
                )}
                {session && (
                  <>
                    <Link
                      href="/messages"
                      className="px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors flex items-center gap-2 relative"
                      onClick={closeMobileMenu}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-700"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <span>Messages</span>
                      {unreadCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      href="/profile"
                      className="px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors"
                      onClick={closeMobileMenu}
                    >
                      Profile
                    </Link>
                  </>
                )}
                {!session && (
                  <div className="px-4 py-3 border-t border-gray-200 mt-2">
                    <button
                      onClick={() => {
                        closeMobileMenu();
                        signIn();
                      }}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                    >
                      Sign In
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}

