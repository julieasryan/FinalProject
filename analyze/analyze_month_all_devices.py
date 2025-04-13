import requests
import os
from datetime import datetime, timedelta
import json
from tqdm import tqdm

API_ENDPOINT = "https://emvnh9buoh.execute-api.us-east-1.amazonaws.com/getData"
DEVICE_LIST_URL = "https://climatenet.am/device_inner/list"

measurements_to_analyze = {
    "temperature": max,
    "uv": max,
    "pm2_5": max,
    "humidity": max,
    "pressure": max,
    "wind speed": max,
    "rain": max
}

def get_devices():
    try:
        response = requests.get(DEVICE_LIST_URL)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"❌ Failed to get device list: {e}")
        return []

def get_data_for_device_on_day(device_id, date_str):
    try:
        response = requests.get(f"{API_ENDPOINT}?device_id={device_id}&date={date_str}")
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"[ERROR] device_id={device_id}: {e}")
        return None

def has_known_issues(device):
    return "issues" in device and device["issues"]

def analyze_day(date, devices):
    summary_high = {key: {"value": None, "location": None, "timestamp": None} for key in measurements_to_analyze}
    summary_low = {key: {"value": None, "location": None, "timestamp": None} for key in measurements_to_analyze}
    
    date_str = date.strftime("%Y-%m-%d")

    for device in tqdm(devices, desc=f"Analyzing {date_str}"):
        if has_known_issues(device):
            continue

        device_id = device["generated_id"]
        location = f"{device['parent_name']} - {device['name']}"
        result = get_data_for_device_on_day(device_id, date_str)

        if not result or "data" not in result or not result["data"]:
            continue

        keys = result["keys"]
        for entry in result["data"]:
            entry_dict = dict(zip(keys, entry))

            try:
                timestamp = datetime.strptime(entry_dict["timestamp"], "%Y-%m-%d %H:%M:%S")
            except:
                continue

            if timestamp.date() != date.date():
                continue

            for key in measurements_to_analyze:
                if key not in entry_dict or entry_dict[key] in [None, ""]:
                    continue

                try:
                    value = float(entry_dict[key])
                except:
                    continue

                # High
                current_high = summary_high[key]["value"]
                if current_high is None or value > current_high:
                    summary_high[key] = {
                        "value": value,
                        "location": location,
                        "timestamp": entry_dict["timestamp"]
                    }

                # Low
                current_low = summary_low[key]["value"]
                if current_low is None or value < current_low:
                    summary_low[key] = {
                        "value": value,
                        "location": location,
                        "timestamp": entry_dict["timestamp"]
                    }

    return summary_high, summary_low

def analyze_month(year, month):
    devices = get_devices()
    if not devices:
        print("No devices found.")
        return

    output_dir = "monthly_analysis"
    os.makedirs(output_dir, exist_ok=True)

    start_date = datetime(year, month, 1)
    if month == 12:
        end_date = datetime(year + 1, 1, 1)
    else:
        end_date = datetime(year, month + 1, 1)

    current_date = start_date
    while current_date < end_date:
        high, low = analyze_day(current_date, devices)

        date_str = current_date.strftime("%d-%m-%Y")
        with open(f"{output_dir}/{date_str}_highest.json", "w", encoding="utf-8") as f:
            json.dump(high, f, ensure_ascii=False, indent=2)

        with open(f"{output_dir}/{date_str}_lowest.json", "w", encoding="utf-8") as f:
            json.dump(low, f, ensure_ascii=False, indent=2)

        current_date += timedelta(days=1)

    print("📊 Monthly analysis completed!")

if __name__ == "__main__":
    year = int(input("Enter year (e.g. 2025): "))
    month = int(input("Enter month (1-12): "))
    analyze_month(year, month)
