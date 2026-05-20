import json
import os
import math
import requests
from typing import List, Optional, Tuple
from ..database import get_all_providers
from ..models.schemas import Provider, Intent

# Known Islamabad sectors — used only when user explicitly names one in their query
ISLAMABAD_SECTORS = {
    "G-13": {"lat": 33.6490, "lng": 72.9690},
    "G-11": {"lat": 33.6690, "lng": 72.9890},
    "G-9":  {"lat": 33.6820, "lng": 73.0290},
    "G-10": {"lat": 33.6755, "lng": 73.0090},
    "G-6":  {"lat": 33.7050, "lng": 73.0590},
    "G-7":  {"lat": 33.6990, "lng": 73.0490},
    "G-8":  {"lat": 33.6900, "lng": 73.0390},
    "F-8":  {"lat": 33.7120, "lng": 73.0430},
    "F-7":  {"lat": 33.7200, "lng": 73.0550},
    "F-10": {"lat": 33.6930, "lng": 73.0140},
    "F-11": {"lat": 33.6980, "lng": 73.0000},
    "F-6":  {"lat": 33.7300, "lng": 73.0650},
    "E-11": {"lat": 33.7260, "lng": 73.0060},
    "I-8":  {"lat": 33.6680, "lng": 73.0720},
    "I-9":  {"lat": 33.6640, "lng": 73.0650},
    "I-10": {"lat": 33.6610, "lng": 73.0580},
    "H-9":  {"lat": 33.6750, "lng": 73.0500},
    "H-11": {"lat": 33.6850, "lng": 73.0000},
    "D-12": {"lat": 33.7400, "lng": 73.0200},
    "B-17": {"lat": 33.7500, "lng": 72.9300},
}

# Pakistan centre as absolute last resort
DEFAULT_COORDS = {"lat": 30.3753, "lng": 69.3451}


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine formula — distance in km between two GPS points."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2))
         * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)


def reverse_geocode_location(lat: float, lng: float) -> str:
    """
    Convert GPS coordinates to a human-readable Pakistani area name
    using the free OpenStreetMap Nominatim API.
    Returns e.g. "Malir, Karachi" / "Gulberg, Lahore" / "G-13, Islamabad".
    Falls back to coordinate string if the API is unreachable.
    """
    try:
        url = "https://nominatim.openstreetmap.org/reverse"
        params = {
            "lat": lat,
            "lon": lng,
            "format": "json",
            "zoom": 14,          # neighbourhood / suburb granularity
            "addressdetails": 1,
        }
        headers = {"User-Agent": "AntiGravityServiceApp/1.0"}
        resp = requests.get(url, params=params, headers=headers, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        addr = data.get("address", {})

        # Build "Neighbourhood, City" label from address fields
        neighbourhood = (
            addr.get("suburb")
            or addr.get("neighbourhood")
            or addr.get("city_district")
            or addr.get("county")
            or addr.get("town")
        )
        city = addr.get("city") or addr.get("town") or addr.get("village") or addr.get("state")

        if neighbourhood and city and neighbourhood != city:
            return f"{neighbourhood}, {city}"
        elif city:
            return city
        elif neighbourhood:
            return neighbourhood
        # Ultimate fallback — first part of display_name
        return data.get("display_name", "").split(",")[0].strip() or f"{lat:.4f}°N, {lng:.4f}°E"
    except Exception:
        # Network failure or timeout — use coordinate string so UI still shows something
        return f"{lat:.4f}°N, {lng:.4f}°E"


def forward_geocode_location(location_name: str) -> Optional[Tuple[float, float]]:
    """
    Convert a location name (e.g., 'Malir, Karachi') into GPS coordinates
    using OpenStreetMap Nominatim API.
    """
    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            "q": location_name,
            "format": "json",
            "limit": 1
        }
        headers = {"User-Agent": "AntiGravityServiceApp/1.0"}
        resp = requests.get(url, params=params, headers=headers, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        if data:
            return float(data[0]["lat"]), float(data[0]["lon"])
    except Exception as e:
        print(f"Forward geocode failed for {location_name}: {e}")
    return None


# Keep this for backwards compat (Islamabad-only search by sector)
def find_nearest_sector(lat: float, lng: float) -> str:
    """Snap GPS to nearest Islamabad sector name (used only for pure Islamabad queries)."""
    nearest = min(
        ISLAMABAD_SECTORS.items(),
        key=lambda item: calculate_distance(lat, lng, item[1]["lat"], item[1]["lng"])
    )
    return nearest[0]


def estimated_arrival_str(distance_km: float, response_time_mins: int) -> str:
    """ETA = travel time (at 30 km/h city speed) + provider response time."""
    travel_mins = int((distance_km / 30.0) * 60)
    total_mins = travel_mins + response_time_mins
    if total_mins < 60:
        return f"{total_mins} min"
    hours = total_mins // 60
    mins = total_mins % 60
    return f"{hours}h {mins}min" if mins else f"{hours}h"


def discover_providers(
    intent: Intent,
    user_lat: Optional[float] = None,
    user_lng: Optional[float] = None,
) -> Tuple[List[Provider], str]:
    """
    Find and rank service providers for the given intent.

    Location priority (for distance calculation):
      1. Named Islamabad sector in the query  → use sector centre coords
      2. Real GPS from device                 → use raw GPS (works anywhere in Pakistan)
      3. Pakistan centre                      → absolute last resort, app never crashes
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    mock_file = os.path.join(base_dir, "mock_data", "providers.json")

    all_providers = get_all_providers()
    if not all_providers:
        with open(mock_file, "r", encoding="utf-8") as f:
            all_providers = json.load(f)

    # --- Resolve coordinates for distance measurement ---
    if intent.location != "unknown" and intent.location in ISLAMABAD_SECTORS:
        # User explicitly named an Islamabad sector → honour it exactly
        user_coords = ISLAMABAD_SECTORS[intent.location]
        location_source = f"query ({intent.location})"
    elif user_lat is not None and user_lng is not None:
        # GPS available (may be anywhere in Pakistan) → use it directly
        user_coords = {"lat": user_lat, "lng": user_lng}
        location_source = f"GPS ({intent.location})"
    else:
        user_coords = None
        location_source = f"text match ({intent.location})"

    # --- Filter by service category & compute distances ---
    NEARBY_KM   = 50   # prefer providers within this radius
    MAX_RESULTS = 6    # cap list size — only show what matters

    all_service: List[Provider] = []
    for p in all_providers:
        if p["service_category"].strip().lower() != intent.service.strip().lower():
            continue

        p_coords = p.get("coordinates", DEFAULT_COORDS)
        
        if user_coords is not None:
            dist = calculate_distance(
                user_coords["lat"], user_coords["lng"],
                p_coords["lat"],   p_coords["lng"],
            )
        else:
            # Fallback to textual match if we have no coordinates at all
            p_loc = p["location"].lower()
            i_loc = intent.location.lower()
            if i_loc in p_loc or p_loc in i_loc:
                dist = 2.0  # arbitrary close distance
            else:
                dist = 999.0 # far away

        if dist < 0.05:
            dist = 0.3

        # Generate deterministic contact number and services count
        pid_num = int(p["id"].replace("p", "")) if p["id"].replace("p", "").replace("_","").isdigit() else 1
        phone_num = f"0312{1000000 + (pid_num * 13579) % 8999999}"
        services_count = 15 + (pid_num * 7) % 150

        all_service.append(Provider(
            id=p["id"],
            provider_name=p["provider_name"],
            service_category=p["service_category"],
            location=p["location"],
            rating=p["rating"],
            available=p["available"],
            response_time_mins=p["response_time_mins"],
            distance_km=dist,
            estimated_arrival=estimated_arrival_str(dist, p["response_time_mins"]),
            phone_number=phone_num,
            total_services=services_count
        ))

    all_service.sort(key=lambda p: p.distance_km)

    # Keep only providers that are geographically nearby.
    # If none exist within NEARBY_KM (e.g. new city with sparse data),
    # fall back to the closest 5 so the app never returns empty.
    nearby = [p for p in all_service if p.distance_km <= NEARBY_KM]
    discovered = (nearby if nearby else all_service[:5])[:MAX_RESULTS]

    return discovered, location_source
