import requests
from datetime import datetime, timedelta
from tqdm import tqdm
import json
from collections import defaultdict
import statistics

API_ENDPOINT = "https://emvnh9buoh.execute-api.us-east-1.amazonaws.com/getData"
DEVICE_JSON_PATH = "../climatenet-visual/public/data/devices.json"

# Updated list to match the exact field names returned by the API
measurements = ["temperature", "pm2_5", "humidity", "uv", "wind_speed", "rain"]

# Map of issue names to affected measurements
ISSUE_MEASUREMENT_MAP = {
    "Wind Speed and Direction": ["wind_speed"],
    "Rain": ["rain"],
    "Temperature": ["temperature"],
    "UV": ["uv"],
    "Humidity": ["humidity"],
    "Air Pollution": ["pm2_5"]
}

# Define valid ranges for each measurement
VALID_RANGES = {
    "temperature": (-50, 60),      # Celsius, extreme but possible Earth temperatures
    "pm2_5": (0, 1000),            # μg/m³, extremely high pollution but possible during events
    "humidity": (0, 100),          # Percentage
    "uv": (0, 15),                 # UV index
    "wind_speed": (0, 150),        # mph or km/h (adjust if using different units)
    "rain": (0, 50)                # mm/hour or similar
}

def fetch_all_devices():
    try:
        with open(DEVICE_JSON_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[ERROR reading devices.json]: {e}")
        return []

def get_all_data(device_id, days):
    try:
        # Calculate date range
        end_date = datetime.utcnow().date()
        start_date = end_date - timedelta(days=days)
        
        # Format dates for API
        start_time = start_date.strftime("%Y-%m-%d")
        end_time = end_date.strftime("%Y-%m-%d")
        
        # Make API request with date range
        url = f"{API_ENDPOINT}?device_id={device_id}&start_time={start_time}&end_time={end_time}"
        print(f"Fetching data from: {url}")
        
        res = requests.get(url)
        res.raise_for_status()
        return res.json()
    except Exception as e:
        print(f"[ERROR] {device_id}: {e}")
        return None

def get_problematic_measurements(device):
    """Extract measurements that have issues for this device"""
    problematic = set()
    
    if "issues" in device and device["issues"]:
        for issue in device["issues"]:
            issue_name = issue.get("name")
            if issue_name in ISSUE_MEASUREMENT_MAP:
                for measurement in ISSUE_MEASUREMENT_MAP[issue_name]:
                    problematic.add(measurement)
    
    return problematic

def is_value_valid(measurement, value):
    """Check if a measurement value is within valid range"""
    if measurement not in VALID_RANGES:
        return True  # No validation range defined
        
    min_val, max_val = VALID_RANGES[measurement]
    return min_val <= value <= max_val

def parse_data(result):
    if not result or "data" not in result or not result["data"]:
        return []

    keys = result["keys"]
    entries = []
    
    for raw in result["data"]:
        try:
            entry = dict(zip(keys, raw))
            entries.append(entry)
        except Exception as e:
            print(f"Error parsing entry: {e}")
            continue

    return entries

def compute_average(entries, problematic_measurements=None):
    if problematic_measurements is None:
        problematic_measurements = set()
        
    stats = defaultdict(list)
    invalid_counts = defaultdict(int)
    total_entries = len(entries)

    for e in entries:
        for m in measurements:
            # Skip measurements known to be problematic for this device
            if m in problematic_measurements:
                continue
                
            try:
                if m in e and e[m] is not None and e[m] != "null" and e[m] != "":
                    # Convert to float and handle potential string values
                    value = float(e[m])
                    
                    # Check if value is within valid range
                    if is_value_valid(m, value):
                        stats[m].append(value)
                    else:
                        invalid_counts[m] += 1
            except (KeyError, ValueError, TypeError) as err:
                # Skip this measurement for this entry
                continue

    # Check for high invalid rates (more than 30% invalid values)
    for m in measurements:
        if m in invalid_counts:
            invalid_rate = invalid_counts[m] / total_entries
            if invalid_rate > 0.3:  # If more than 30% of readings are invalid
                print(f"WARNING: Measurement {m} has {invalid_counts[m]}/{total_entries} invalid values ({invalid_rate:.1%})")
                # Add to problematic measurements
                problematic_measurements.add(m)
                # Remove from stats
                if m in stats:
                    del stats[m]

    summary = {}
    for key in measurements:
        values = stats.get(key, [])
        if values:
            try:
                # For PM2.5 specifically, check for consistently high values
                if key == "pm2_5":
                    avg_value = statistics.mean(values)
                    if avg_value > 500:  # Extremely high average PM2.5
                        print(f"WARNING: PM2.5 average is extremely high ({avg_value}), likely sensor issue")
                        summary[key] = None
                        continue
                
                summary[key] = round(statistics.mean(values), 2)
            except statistics.StatisticsError:
                summary[key] = None
        else:
            summary[key] = None

    return summary

def score_location(summary):
    score = 0
    measured_aspects = 0  # Track how many aspects could be measured

    # Temperature in comfort range
    temp = summary.get("temperature")
    if temp is not None:
        measured_aspects += 1
        if 18 <= temp <= 28:
            score += 2

    # Good air quality
    pm = summary.get("pm2_5")
    if pm is not None:
        measured_aspects += 1
        if pm <= 25:
            score += 2

    # Low rain
    rain = summary.get("rain")
    if rain is not None:
        measured_aspects += 1
        if rain < 0.5:
            score += 1

    # Sunshine
    uv = summary.get("uv")
    if uv is not None:
        measured_aspects += 1
        if uv > 1 and uv < 3:
            score += 1

    # Low wind
    wind = summary.get("wind_speed")
    if wind is not None:
        measured_aspects += 1
        if wind < 10:
            score += 1

    # If we have less than 2 measured aspects, the score isn't reliable
    if measured_aspects < 2:
        return 0
        
    # Normalize score based on available measurements
    # Maximum possible points = temperature(2) + pm2_5(2) + rain(1) + uv(1) + wind(1) = 7
    max_possible_score = min(measured_aspects * 2, 7)  # Simplified normalization
    
    # Return the actual score (not normalized) but ensure enough aspects are measured
    return score

def get_vacation_recommendations():
    devices = fetch_all_devices()
    if not devices:
        print("No devices returned from API")
        return []
        
    locations = []

    for device in tqdm(devices, desc="Analyzing vacation suitability"):
        device_id = device.get("generated_id")
        if not device_id:
            continue
            
        # Get parent and device names
        parent_name = device.get('parent_name', 'Unknown')
        device_name = device.get('name', 'Unknown')
        location_name = f"{parent_name} - {device_name}"
        
        # Extract measurements with known issues for this device
        problematic_measurements = get_problematic_measurements(device)
        if problematic_measurements:
            print(f"Device {device_id} has problematic measurements: {problematic_measurements}")

        # Get coordinates safely with defaults
        latitude = float(device.get('latitude', 0))
        longitude = float(device.get('longitude', 0))

        # Get data for the last 60 days
        result = get_all_data(device_id, days=120)
        if not result:
            print(f"No data returned for device {device_id}")
            continue
            
        entries = parse_data(result)
        print(f"Device {device_id} ({location_name}) has {len(entries)} entries")

        # Only consider locations with sufficient data
        if len(entries) < 10:  # Require at least 10 data points
            print(f"Skipping {location_name} due to insufficient data")
            continue

        # Compute averages, excluding problematic measurements
        summary = compute_average(entries, problematic_measurements)
        print(f"Summary for {location_name}: {summary}")
        
        # Calculate score based on available measurements
        score = score_location(summary)
        print(f"Score for {location_name}: {score}")

        locations.append({
            "location": location_name,
            "score": score,
            "summary": summary,
            "latitude": latitude,
            "longitude": longitude
        })

    # Sort by score descending
    sorted_locations = sorted(locations, key=lambda x: x["score"], reverse=True)
    return sorted_locations

# Run the function if this script is executed directly
if __name__ == "__main__":
    recommendations = get_vacation_recommendations()
    print(f"\nFound {len(recommendations)} recommended locations")
    
    # Print top 5 recommendations
    for i, loc in enumerate(recommendations[:5], 1):
        print(f"{i}. {loc['location']} (Score: {loc['score']})")
        print(f"   Coordinates: {loc['latitude']}, {loc['longitude']}")
        print(f"   Weather: {loc['summary']}")
        print()