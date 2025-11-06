import { Trail } from "../hooks/useTrails";
import { formatDistanceValue } from "@/lib/utils";

interface TrailHoverPopupProps {
  trail: Trail;
  onShowMore: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export default function TrailHoverPopup({ trail, onShowMore, onMouseEnter, onMouseLeave }: TrailHoverPopupProps) {
  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 shadow-lg p-3 min-w-[200px] max-w-[250px]"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <h3 className="font-semibold text-gray-900 text-sm mb-2">{trail.name}</h3>
      {trail.distanceKm && (
        <p className="text-xs text-gray-600 mb-3">
          Distance: {formatDistanceValue(trail.distanceKm)} miles
        </p>
      )}
      <button
        onClick={onShowMore}
        className="w-full text-xs font-medium text-emerald-600 hover:text-emerald-700 border border-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
      >
        Show More
      </button>
    </div>
  );
}

