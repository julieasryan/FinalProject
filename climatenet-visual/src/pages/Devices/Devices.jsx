import { useEffect, useState } from "react";
import DeviceCard from "../../components/DeviceCard/DeviceCard";
import styles from "./Devices.module.css";

export default function Devices() {
  const [groupedDevices, setGroupedDevices] = useState({});
  const [loading, setLoading] = useState(false);
  const [expandedRegions, setExpandedRegions] = useState({});

  const API_LIST = "/data/devices.json";
  const API_DATA = "https://emvnh9buoh.execute-api.us-east-1.amazonaws.com/getData";

  useEffect(() => {
    async function fetchDevices() {
      setLoading(true);

      try {
        const res = await fetch(API_LIST);
        const deviceList = await res.json();

        const enriched = await Promise.all(deviceList.map(async (device) => {
          const id = device.generated_id;
          const res = await fetch(`${API_DATA}?device_id=${id}`);
          const result = await res.json();

          const data = result?.data?.[result.data.length - 1] || [];
          const keys = result?.keys || [];
          const entry = Object.fromEntries(keys.map((k, i) => [k, data[i]]));
          const timestamp = entry.timestamp || "—";

          const issues = device.issues || [];
          const values = {
            UV: !issues.includes("uv") ? entry.uv ?? "—" : null,
            PM: !issues.includes("pm2_5") ? entry.pm2_5 ?? "—" : null,
            Temp: !issues.includes("temperature") ? entry.temperature ?? "—" : null,
            Wind: !issues.includes("wind speed") ? entry["wind speed"] ?? "—" : null,
            Humidity: !issues.includes("humidity") ? entry.humidity ?? "—" : null,
            Rain: !issues.includes("rain") ? entry.rain ?? "—" : null,
          };
          const advice = getAdvice(values);

          return {
            name: device.name,
            region: device.parent_name,
            values,
            advice,
            issues,
            timestamp
          };
        }));

        const grouped = enriched.reduce((acc, device) => {
          const region = device.region || "Other";
          if (!acc[region]) acc[region] = [];
          acc[region].push(device);
          return acc;
        }, {});

        setGroupedDevices(grouped);
        setExpandedRegions(Object.fromEntries(Object.keys(grouped).map(r => [r, false])));
      } catch (e) {
        console.error("Error loading devices", e);
      } finally {
        setLoading(false);
      }
    }

    fetchDevices();
  }, []);

  function getAdvice({ UV, PM, Temp, Wind, Humidity, Rain }) {
    const parsed = {
      uv: UV !== null ? parseFloat(UV) : null,
      pm: PM !== null ? parseFloat(PM) : null,
      temp: Temp !== null ? parseFloat(Temp) : null,
      wind: Wind !== null ? parseFloat(Wind) : null,
      humidity: Humidity !== null ? parseFloat(Humidity) : null,
      rain: Rain !== null ? parseFloat(Rain) : null,
    };

    const tips = [];
    
    if (parsed.pm !== null && parsed.pm >= 56) {
      tips.push("🚨 Air quality isn't great right now. If possible, try to stay indoors.");
    }
    if (parsed.uv !== null && parsed.uv > 5) {
      tips.push("☀️ It's sunny out there! Don't forget your sunscreen and a hat. 😎");
    }
    if (parsed.temp !== null && parsed.temp > 35) {
      tips.push("🔥 It's really hot today. Stay cool and drink lots of water. 💧");
    }
    if (parsed.wind !== null && parsed.wind > 10) {
      tips.push("💨 It's a windy day. Hold on to your hat and be careful with loose items.");
    }
    if (parsed.rain !== null && parsed.rain > 15) {
      tips.push("🌧 Looks like heavy rain is expected. Take an umbrella or stay cozy indoors.");
    }
    if (tips.length === 0) {
      tips.push("🌿 Beautiful weather outside – great time for a walk or some fresh air!");
    }

    return tips;
  }

  function toggleRegion(region) {
    setExpandedRegions(prev => ({
      ...prev,
      [region]: !prev[region]
    }));
  }

  return (
    <div className={styles.container}>
      <h1>📈 Live Device Data by Region</h1>
      {loading ? (
    <div className={styles.loader}></div>
      ) : Object.keys(groupedDevices).length === 0 ? (
        <p style={{ color: "red" }}>⚠️ No devices found.</p>
      ) : (
        Object.entries(groupedDevices).map(([region, devices]) => (
          <div key={region} className={styles.regionBlock}>
            <button onClick={() => toggleRegion(region)} className={styles.regionToggle}>
              {expandedRegions[region] ? "▼" : "▶"} {region}
            </button>
            {expandedRegions[region] && (
              <div className={styles.deviceGrid}>
                {devices.map((device, idx) => (
                  <DeviceCard key={idx} {...device} />
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
