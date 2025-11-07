export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-gray-600 sm:px-6 lg:px-8">
        <p>
          Trail data courtesy of{" "}
          <a
            href="https://www.mtbproject.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-emerald-700 transition-colors hover:text-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            MTB Project
          </a>
          {" "}and its parent company{" "}
          <a
            href="https://www.onxmaps.com/offroad/app"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-emerald-700 transition-colors hover:text-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            onX Backcountry
          </a>
          .
        </p>
        <p>
          Maps rendered using{" "}
          <a
            href="https://maplibre.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-emerald-700 transition-colors hover:text-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            MapLibre
          </a>
          .
        </p>
        <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} MTB Group Ride. All rights reserved.</p>
      </div>
    </footer>
  );
}

