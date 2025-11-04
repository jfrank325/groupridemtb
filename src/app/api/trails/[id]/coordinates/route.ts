import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MTB_PROJECTS_API_KEY = process.env.MTB_PROJECTS_API_KEY;

// Simple polyline decoder (for MTB Projects encoded polylines)
function decodePolyline(encoded: string): [number, number][] {
  const coordinates: [number, number][] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = ((result & 1) !== 0) ? ~(result >> 1) : (result >> 1);
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = ((result & 1) !== 0) ? ~(result >> 1) : (result >> 1);
    lng += deltaLng;

    coordinates.push([lng / 1e5, lat / 1e5]);
  }

  return coordinates;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const trailId = params.id;

    // Get trail from database
    const trail = await prisma.trail.findUnique({
      where: { id: trailId },
      select: {
        id: true,
        name: true,
        location: true,
        lat: true,
        lng: true,
      },
    });

    if (!trail) {
      return NextResponse.json({ error: "Trail not found" }, { status: 404 });
    }

    // If we have lat/lng and API key, try to fetch from MTB Projects API
    if (trail.lat && trail.lng && MTB_PROJECTS_API_KEY) {
      try {
        // Search for trails near the location
        const searchUrl = `https://www.mtbproject.com/data/get-trails?lat=${trail.lat}&lon=${trail.lng}&maxDistance=5&key=${MTB_PROJECTS_API_KEY}`;
        const searchResponse = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'GroupRideMTB/1.0',
          },
        });
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          
          // Find matching trail by name (case-insensitive partial match)
          const matchingTrail = searchData.trails?.find((t: any) => {
            const trailNameLower = trail.name.toLowerCase();
            const apiNameLower = t.name?.toLowerCase() || '';
            return apiNameLower.includes(trailNameLower) || trailNameLower.includes(apiNameLower);
          });

          if (matchingTrail && matchingTrail.id) {
            // Get detailed trail data including coordinates
            const detailUrl = `https://www.mtbproject.com/data/get-trails-by-id?ids=${matchingTrail.id}&key=${MTB_PROJECTS_API_KEY}`;
            const detailResponse = await fetch(detailUrl, {
              headers: {
                'User-Agent': 'GroupRideMTB/1.0',
              },
            });
            
            if (detailResponse.ok) {
              const detailData = await detailResponse.json();
              const trailDetail = detailData.trails?.[0];
              
              if (trailDetail) {
                let coordinates: [number, number][] | null = null;
                
                // Try to get coordinates from shape (polyline encoded)
                if (trailDetail.shape) {
                  try {
                    coordinates = decodePolyline(trailDetail.shape);
                  } catch (decodeError) {
                    console.error("Error decoding polyline:", decodeError);
                  }
                }
                
                // Fallback to coordinates array if available
                if (!coordinates && trailDetail.coordinates) {
                  coordinates = trailDetail.coordinates;
                }
                
                if (coordinates && coordinates.length > 0) {
                  return NextResponse.json({ 
                    coordinates,
                    source: 'mtb-projects',
                    trailId: trailDetail.id
                  });
                }
              }
            }
          }
        }
      } catch (apiError) {
        console.error("MTB Projects API error:", apiError);
        // Fall through to return null coordinates
      }
    }

    // Return null if no coordinates found from API
    return NextResponse.json({ 
      coordinates: null,
      source: 'database',
      message: 'Coordinates not available from MTB Projects API'
    });
  } catch (error) {
    console.error("[GET_TRAIL_COORDINATES]", error);
    return NextResponse.json({ error: "Failed to fetch trail coordinates" }, { status: 500 });
  }
}

