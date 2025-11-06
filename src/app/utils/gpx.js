function extractCoordinatesFromGPX(xmlString) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlString, "text/xml");
  
    // GPX files use a namespace, so we must use getElementsByTagNameNS
    const NS = "http://www.topografix.com/GPX/1/1";
  
    const points = xml.getElementsByTagNameNS(NS, "trkpt");
    const coords = [];
  
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      const lat = parseFloat(pt.getAttribute("lat"));
      const lon = parseFloat(pt.getAttribute("lon"));
  
      if (!isNaN(lat) && !isNaN(lon)) {
        coords.push([lon, lat]); // GeoJSON-style ordering
      }
    }
  
    return String(coords.map(coord => `[${coord[0]}, ${coord[1]}]`));
  }