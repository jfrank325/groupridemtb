"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { type Trail } from "../hooks/useTrails";

interface TrailsListProps {
  trails: Trail[];
}

export function TrailsList({ trails }: TrailsListProps) {
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredTrails = useMemo(() => {
    return trails.filter((trail) => {
      // Filter by difficulty
      if (filter !== "all" && trail.difficulty?.toLowerCase() !== filter.toLowerCase()) {
        return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = trail.name?.toLowerCase().includes(query);
        const matchesLocation = trail.location?.toLowerCase().includes(query);
        return matchesName || matchesLocation;
      }

      return true;
    });
  }, [trails, filter, searchQuery]);

  const difficultyColors = {
    Easy: "bg-green-100 text-green-700 border-green-200",
    Intermediate: "bg-blue-100 text-blue-700 border-blue-200",
    Advanced: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <div className="w-full">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search trails by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          All Trails
          {filteredTrails.length !== trails.length && (
            <span className="text-lg font-normal text-gray-600 ml-2">
              ({filteredTrails.length} {filteredTrails.length === 1 ? 'trail' : 'trails'})
            </span>
          )}
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
              filter === "all"
                ? "bg-emerald-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("easy")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
              filter === "easy"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Easy
          </button>
          <button
            onClick={() => setFilter("intermediate")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              filter === "intermediate"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Intermediate
          </button>
          <button
            onClick={() => setFilter("advanced")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
              filter === "advanced"
                ? "bg-red-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Advanced
          </button>
        </div>
      </div>

      {/* Trails Grid */}
      {filteredTrails.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <svg
            className="w-16 h-16 mx-auto text-gray-300 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <p className="text-gray-700 text-lg mb-2">No trails found.</p>
          {(searchQuery || filter !== "all") && (
            <p className="text-gray-500 text-sm">
              Try adjusting your search or filters.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrails.map((trail) => (
            <Link
              key={trail.id}
              href={`/trails/${trail.id}`}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-emerald-300 hover:shadow-lg transition-all group focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2 focus-within:outline-none"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors mb-2">
                    {trail.name}
                  </h3>
                  {trail.location && (
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {trail.location}
                    </p>
                  )}
                </div>
                {trail.difficulty && (
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      difficultyColors[trail.difficulty as keyof typeof difficultyColors] ||
                      "bg-gray-100 text-gray-700 border-gray-200"
                    }`}
                  >
                    {trail.difficulty}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                {trail.distanceKm && (
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Distance</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {trail.distanceKm.toFixed(1)} km
                    </p>
                  </div>
                )}
                {trail.elevationGainM && (
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Elevation</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {trail.elevationGainM.toFixed(0)} m
                    </p>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

