"use client";

import { ReactNode, useEffect } from "react";

export default function Modal({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current overflow style
      const originalOverflow = document.body.style.overflow;
      // Disable body scroll
      document.body.style.overflow = "hidden";
      return () => {
        // Restore original overflow when modal closes
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Prevent scroll events from propagating to the map
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
      onWheel={handleWheel}
      onTouchMove={handleTouchMove}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-[90%] max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
        onTouchMove={handleTouchMove}
      >
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
