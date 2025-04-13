import requests
from datetime import datetime
import json
from tqdm import tqdm

API_ENDPOINT = "https://emvnh9buoh.execute-api.us-east-1.amazonaws.com/getData"
DEVICE_LIST_URL = "https://climatenet.am/device_inner/list"

measurements = [
    "temperature", "uv", "pm2_5", "humidity", "pressure", "wind speed", "rain"
]

def fetch_all_devices():
    try:
        response = requests.get(DEVICE_LIST_URL)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"[ERROR fetching devices]: {e}")
        return []

def get_today_data(device_id):
    try:
        response = requests.get(f"{API_ENDPOINT}?device_id={device_id}")
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"[ERROR] device_id={device_id}: {e}")
        return None

def has_known_issues(device):
    return "issues" in device and device["issues"]

def analyze_extremes_today():
    today = datetime.utcnow().date()

    highest = {key: None for key in measurements}
    lowest = {key: None for key in measurements}

    devices = fetch_all_devices()

    for device in tqdm(devices, desc="Analyzing today's data"):
        if has_known_issues(device):
            continue

        device_id = device["generated_id"]
        location = f"{device['parent_name']} - {device['name']}"

        result = get_today_data(device_id)
        if not result or "data" not in result or not result["data"]:
            continue

        keys = result["keys"]
        for entry in result["data"]:
            entry_dict = dict(zip(keys, entry))

            try:
                timestamp = datetime.strptime(entry_dict["timestamp"], "%Y-%m-%d %H:%M:%S")
            except:
                continue

            if timestamp.date() != today:
                continue

            for key in measurements:
                if key not in entry_dict or entry_dict[key] in [None, ""]:
                    continue

                try:
                    value = float(entry_dict[key])
                except:
                    continue

                # Check max
                if highest[key] is None or value > highest[key]["value"]:
                    highest[key] = {
                        "value": value,
                        "location": location,
                        "timestamp": entry_dict["timestamp"]
                    }

                # Check min
                if lowest[key] is None or value < lowest[key]["value"]:
                    lowest[key] = {
                        "value": value,
                        "location": location,
                        "timestamp": entry_dict["timestamp"]
                    }

    return highest, lowest


if __name__ == "__main__":
    highest, lowest = analyze_extremes_today()
    today_str = datetime.utcnow().strftime("%d-%m-%Y")

    with open(f"{today_str}_highest.json", "w", encoding="utf-8") as f:
        json.dump(highest, f, ensure_ascii=False, indent=2)

    with open(f"{today_str}_lowest.json", "w", encoding="utf-8") as f:
        json.dump(lowest, f, ensure_ascii=False, indent=2)

    print(f"📊 Վերլուծությունը ավարտվեց։ Արդյունքները պահպանված են՝\n👉 {today_str}_highest.json\n👉 {today_str}_lowest.json")
