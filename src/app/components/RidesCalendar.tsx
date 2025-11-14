"use client";

import { useState, useMemo } from "react";
import { type Ride } from "../hooks/useRides";
import { formatDateShort } from "@/lib/utils";

interface RidesCalendarProps {
  rides: Ride[];
  onDateClick?: (date: Date, rides: Ride[]) => void;
  selectedDate?: Date | null;
}

export function RidesCalendar({ rides, onDateClick, selectedDate }: RidesCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Group rides by date (YYYY-MM-DD) and sort by time
  const ridesByDate = useMemo(() => {
    const grouped: Record<string, Ride[]> = {};
    rides.forEach((ride) => {
      const date = new Date(ride.date);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(ride);
    });
    // Sort rides by time within each date
    Object.keys(grouped).forEach((dateKey) => {
      grouped[dateKey].sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        return timeA - timeB;
      });
    });
    return grouped;
  }, [rides]);

  // Get calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Day of week for first day (0 = Sunday, 6 = Saturday)
    const startDay = firstDay.getDay();
    
    // Total days in month
    const daysInMonth = lastDay.getDate();
    
    // Previous month's trailing days
    const prevMonth = new Date(year, month, 0);
    const daysInPrevMonth = prevMonth.getDate();
    
    const days: Array<{ date: Date; isCurrentMonth: boolean; rides: Ride[] }> = [];
    
    // Add previous month's trailing days
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, daysInPrevMonth - i);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      days.push({
        date,
        isCurrentMonth: false,
        rides: ridesByDate[dateKey] || [],
      });
    }
    
    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      days.push({
        date,
        isCurrentMonth: true,
        rides: ridesByDate[dateKey] || [],
      });
    }
    
    // Add next month's leading days to fill the grid
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      days.push({
        date,
        isCurrentMonth: false,
        rides: ridesByDate[dateKey] || [],
      });
    }
    
    return days;
  }, [currentMonth, ridesByDate]);

  const monthYear = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  const handleDateClick = (date: Date, dayRides: Ride[]) => {
    onDateClick?.(date, dayRides);
  };

  const isToday = (date: Date) => {
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return dateKey === todayKey;
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.getFullYear() === selectedDate.getFullYear() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getDate() === selectedDate.getDate()
    );
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label="Previous month"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">{monthYear}</h3>
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            Today
          </button>
        </div>
        <button
          onClick={handleNextMonth}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label="Next month"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Week Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const hasRides = day.rides.length > 0;
          const isTodayDate = isToday(day.date);
          const isSelectedDate = isSelected(day.date);
          const sortedRides = [...day.rides].sort((a, b) => {
            const timeA = new Date(a.date).getTime();
            const timeB = new Date(b.date).getTime();
            return timeA - timeB;
          });

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleDateClick(day.date, sortedRides)}
              className={`
                relative aspect-square p-1 rounded-lg text-sm font-medium transition-all flex flex-col items-start
                focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1
                ${
                  !day.isCurrentMonth
                    ? "text-gray-300 cursor-default"
                    : isSelectedDate
                    ? "bg-emerald-600 text-white shadow-md"
                    : isTodayDate
                    ? "bg-emerald-50 text-emerald-700 border-2 border-emerald-500"
                    : hasRides
                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:shadow-sm cursor-pointer"
                    : "text-gray-700 hover:bg-gray-50 cursor-pointer"
                }
              `}
            >
              <span className="text-xs font-semibold leading-none mb-0.5">{day.date.getDate()}</span>
              {hasRides && (
                <div className="flex-1 w-full flex flex-col gap-0.5 overflow-hidden">
                  {sortedRides.slice(0, 2).map((ride) => {
                    const rideName = ride.name || "Untitled Ride";
                    const truncatedName = rideName.length > 8 ? `${rideName.slice(0, 8)}...` : rideName;
                    return (
                      <div
                        key={ride.id}
                        className={`
                          text-[9px] leading-tight px-1 py-0.5 rounded truncate w-full
                          ${isSelectedDate ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"}
                        `}
                        title={rideName}
                      >
                        {truncatedName}
                      </div>
                    );
                  })}
                  {sortedRides.length > 2 && (
                    <div
                      className={`
                        text-[9px] leading-tight px-1 py-0.5 rounded truncate w-full
                        ${isSelectedDate ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"}
                      `}
                      title={`+${sortedRides.length - 2} more`}
                    >
                      +{sortedRides.length - 2} more
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200 flex flex-wrap items-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border-2 border-emerald-500" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 relative">
            <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-600" />
          </div>
          <span>Has rides</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white" />
          <span>Selected</span>
        </div>
      </div>
    </div>
  );
}

