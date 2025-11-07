"use client";

import { useState } from "react";

const GPXtoCoords = () => {
  const [gpx, setGpx] = useState("");
  const [coords, setCoords] = useState<string>("");

  function extractCoordinatesFromGPX(xmlString: string): string {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlString, "text/xml");

    // GPX files use a namespace, so we must use getElementsByTagNameNS
    const NS = "http://www.topografix.com/GPX/1/1";

    const points = xml.getElementsByTagNameNS(NS, "trkpt");
    const coordsArray: number[][] = [];

    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      const latAttr = pt.getAttribute("lat");
      const lonAttr = pt.getAttribute("lon");

      if (latAttr && lonAttr) {
        const lat = parseFloat(latAttr);
        const lon = parseFloat(lonAttr);

        if (!isNaN(lat) && !isNaN(lon)) {
          coordsArray.push([lon, lat]); // GeoJSON-style ordering
        }
      }
    }

    return coordsArray.map(coord => `[${coord[0]}, ${coord[1]}]`).join(", ");
  }

  return (
    <div className="p-4">
      <textarea
        name="gpx"
        id="gpx"
        value={gpx}
        onChange={(e) => setGpx(e.target.value)}
        className="w-full h-64 p-2 border border-gray-300 rounded-md font-mono text-sm"
        placeholder="Paste GPX content here..."
      />
      <button
        onClick={() => setCoords(extractCoordinatesFromGPX(gpx))}
        className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
      >
        Extract Coordinates
      </button>
      {coords && (
        <p className="mt-4 p-4 bg-gray-100 text-black rounded-md text-sm max-w-19/20 mx-auto">
          {coords}
        </p>
      )}
    </div>
  );
};

export default GPXtoCoords;