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

  useEffect(() => {
    axios.get("http://localhost:5000/api/recommendations")
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading recommendations", err);
        setLoading(false);
      });
  }, []);

  const topData = [...data]
    .filter(d => {
      if (metric === "score") return true;
      return d.summary?.[metric] !== null && d.summary?.[metric] !== undefined;
    })
    .sort((a, b) => {
      const aVal = metric === "score" ? a.score : a.summary?.[metric];
      const bVal = metric === "score" ? b.score : b.summary?.[metric];
      return bVal - aVal;
    })
    .slice(0, 5)
    .map((loc) => ({
      name: loc.location,
      value: metric === "score" ? loc.score : loc.summary?.[metric]
    }));

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>🌍 Recommendations</h1>

      {loading ? (
        <p className={styles.loader}></p>
      ) : (
        <>
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

          <div style={{ width: '100%', height: 300, marginTop: "2rem" }}>
            <ResponsiveContainer>
              <BarChart
                data={topData.reverse()}
                layout="horizontal"
                margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
              >
                <XAxis type="category" dataKey="name" />
                <YAxis type="number" />
                <Tooltip />
                <Bar dataKey="value">
                  {topData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[metric]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default VisualRecommendations;
