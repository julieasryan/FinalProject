import React, { useState, useEffect } from 'react';
import styles from "./Recommendations.module.css";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import axios from 'axios';

const measurementLabels = {
  score: "🏆 Score",
  temperature: "🌡️ Temperature (°C)",
  pm2_5: "🌫️ Air Pollution (μg/m³)",
  humidity: "💧 Humidity (%)",
  uv: "🔆 UV Index"
};

const colors = {
  score: "#4ade80",
  temperature: "#facc15",
  pm2_5: "#f87171",
  humidity: "#38bdf8",
  uv: "#fb923c"
};

const VisualRecommendations = () => {
  const [data, setData] = useState([]);
  const [metric, setMetric] = useState("score");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      // Try to get cached data first
      try {
        const cached = sessionStorage.getItem("recommendationsData");
        if (cached) {
          const parsedData = JSON.parse(cached);
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            setData(parsedData);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error("Error parsing cached recommendations", e);
        sessionStorage.removeItem("recommendationsData");
      }

      // Fetch fresh data if no valid cache
      try {
        setLoading(true);
        const res = await axios.get("http://18.213.155.62:5000/api/recommendations", {
        });

        if (Array.isArray(res.data)) {
          // Cache the valid results
          sessionStorage.setItem("recommendationsData", JSON.stringify(res.data));
          setData(res.data);
          setError(null);
        } else if (res.data && Array.isArray(res.data.recommendations)) {
          // Handle case where API returns { recommendations: [...] }
          sessionStorage.setItem("recommendationsData", JSON.stringify(res.data.recommendations));
          setData(res.data.recommendations);
          setError(null);
        } else {
          throw new Error("Invalid data format from API");
        }
      } catch (err) {
        console.error("Error loading recommendations", err);
        setError(err.message || "Failed to load recommendations");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Empty state check - return early if no data
  if (!loading && data.length === 0 && !error) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>🌍 Recommendations</h1>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>🌍 Recommendations</h1>
        <div className={styles.errorState}>
          <p>Error: {error}</p>
          <button
            onClick={() => {
              sessionStorage.removeItem("recommendationsData");
              window.location.reload();
            }}
            className={styles.retryButton}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const topData = [...data]
    .filter(d => {
      // Safety check for expected data structure
      if (!d || (metric !== "score" && (!d.summary || typeof d.summary !== 'object'))) {
        return false;
      }

      if (metric === "score") {
        return d.score !== null && d.score !== undefined;
      }

      return d.summary?.[metric] !== null && d.summary?.[metric] !== undefined;
    })
    .sort((a, b) => {
      const aVal = metric === "score" ? a.score : a.summary?.[metric];
      const bVal = metric === "score" ? b.score : b.summary?.[metric];

      // Handle undefined or null values
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      return bVal - aVal;
    })
    .slice(0, 5)
    .map((loc) => ({
      name: loc.location || "Unknown Location",
      value: metric === "score" ?
        (typeof loc.score === 'number' ? loc.score : 0) :
        (typeof loc.summary?.[metric] === 'number' ? loc.summary[metric] : 0)
    }));

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>🌍 Recommendations</h1>

      {loading ? (
        <div className={styles.loader}></div>
      ) : (
        <>
          <div className={styles.controls}>
            <label htmlFor="metric" className={styles.label}>Select a metric:</label>
            <select
              id="metric"
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className={styles.select}
            >
              {Object.keys(measurementLabels).map((key) => (
                <option key={key} value={key}>
                  {measurementLabels[key]}
                </option>
              ))}
            </select>
          </div>

          {topData.length > 0 ? (
            <div style={{ width: '100%', height: 300, marginTop: "2rem" }}>
              <ResponsiveContainer>
                <BarChart
                  data={topData.reverse()}
                  layout="horizontal"
                  margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                >
                  <XAxis type="category" dataKey="name" />
                  <YAxis type="number" />
                  <Tooltip formatter={(value) => value.toFixed(2)} />
                  <Bar dataKey="value">
                    {topData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[metric] || "#4ade80"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className={styles.noDataForMetric}>
              <p>No data available for {measurementLabels[metric]}</p>
              <p>Try selecting a different metric</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VisualRecommendations;