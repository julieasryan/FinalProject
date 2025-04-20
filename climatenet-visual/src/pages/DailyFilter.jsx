import { useEffect, useState } from "react";
import styles from "./DailyFilter.module.css";

export default function Extremes() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchedOnce, setFetchedOnce] = useState(false);

  useEffect(() => {
    const cached = sessionStorage.getItem("extremesData");
    if (cached) {
      setData(JSON.parse(cached));
      setFetchedOnce(true);
      setLoading(false);
      return;
    }
  
    async function fetchData() {
      try {
        const res = await fetch("http://localhost:5000/api/extremes");
        const result = await res.json();
        sessionStorage.setItem("extremesData", JSON.stringify(result));
        setData(result);
        setFetchedOnce(true);
      } catch (e) {
        console.error("Error fetching extremes", e);
      } finally {
        setLoading(false);
      }
    }
  
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

  return (
    <div className={styles.container}>
      <h1>📊 Daily Extremes</h1>
  
      {loading ? (
        <div className={styles.loader}></div>
      ) : (
        <div className={styles.grid}>
          {Object.entries(data.highest).map(([key, maxVal]) => {
            const minVal = data.lowest[key];
            return (
              <div className={styles.card} key={key}>
                <h2 className={styles.title}>
                  {key}
                  <span className={styles.icon}>{icons[key]}</span>
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
      )}
    </div>
  );
}