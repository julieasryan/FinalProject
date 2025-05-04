import { useEffect, useState } from "react";
import styles from "./DailyFilter.module.css";

export default function Extremes() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      // Try to get cached data first
      try {
        const cached = sessionStorage.getItem("extremesData");
        if (cached) {
          const parsedData = JSON.parse(cached);
          // Verify the data has the expected structure
          if (parsedData && parsedData.highest && parsedData.lowest) {
            setData(parsedData);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error("Error parsing cached data", e);
        // If there's an error with cached data, we'll clear it and continue to fetch
        sessionStorage.removeItem("extremesData");
      }

      // Fetch fresh data
      try {
        setLoading(true);
        const res = await fetch("http://18.213.155.62:5000/api/extremes");

        if (!res.ok) {
          throw new Error(`API returned status: ${res.status}`);
        }

        const result = await res.json();

        // Validate the response structure
        if (!result || !result.highest || !result.lowest) {
          throw new Error("Invalid data structure from API");
        }

        // Cache the valid results
        sessionStorage.setItem("extremesData", JSON.stringify(result));
        setData(result);
        setError(null);
      } catch (e) {
        console.error("Error fetching extremes", e);
        setError(`Failed to load data: ${e.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const icons = {
    temperature: <img src="https://images-in-website.s3.us-east-1.amazonaws.com/AboutIcons/temperature.png" alt="temperature"/>,
    humidity: <img src="https://images-in-website.s3.us-east-1.amazonaws.com/AboutIcons/humidity.png" alt="humidity"/>,
    uv: <img src="https://images-in-website.s3.us-east-1.amazonaws.com/AboutIcons/uv.png" alt="uv"/>,
    "wind speed": <img src="https://images-in-website.s3.us-east-1.amazonaws.com/AboutIcons/anemometer.png" alt="wind_speed"/>,
    rain: <img src="https://images-in-website.s3.us-east-1.amazonaws.com/AboutIcons/rain.png" alt="rain"/>,
    pm2_5: <img src="https://images-in-website.s3.us-east-1.amazonaws.com/AboutIcons/pm2.png" alt="pm2_5"/>,
    pressure: <img src="https://images-in-website.s3.us-east-1.amazonaws.com/AboutIcons/pressure.png" alt="pressure"/>
  };

  if (error) {
    return (
      <div className={styles.container}>
        <h1>📊 Daily Extremes</h1>
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>📊 Daily Extremes</h1>

      {loading ? (
        <div className={styles.loader}></div>
      ) : data ? (
        <div className={styles.grid}>
          {Object.entries(data.highest).map(([key, maxVal]) => {
            const minVal = data.lowest[key];
            if (!maxVal || !minVal) return null;

            return (
              <div className={styles.card} key={key}>
                <h2 className={styles.title}>
                  {key}
                  <span className={styles.icon}>{icons[key] || null}</span>
                </h2>
                <div className={styles.valueBlock}>
                  <span className={styles.label}>⬆ Max:</span>
                  <span className={styles.value}>{maxVal?.value}</span>
                  <div className={styles.info}>{maxVal?.location}</div>
                  <div className={styles.timestamp}>{maxVal?.timestamp}</div>
                </div>
                <div className={styles.valueBlock}>
                  <span className={styles.label}>⬇ Min:</span>
                  <span className={styles.value}>{minVal?.value}</span>
                  <div className={styles.info}>{minVal?.location}</div>
                  <div className={styles.timestamp}>{minVal?.timestamp}</div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.error}>
          <p>No data available</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}
    </div>
  );
}