import styles from "./MeasurementValue.module.css";
import { FaCheckCircle, FaExclamationTriangle, FaTimesCircle } from "react-icons/fa";

export default function MeasurementValue({ type, value }) {
  let status = "";
  let colorClass = "";
  let displayValue = typeof value === "number" ? value.toFixed(1) : value;

  if (value === null || value === "—") {
    status = "No Data";
    colorClass = styles.moderate;
  } else {
    switch (type) {
      case "pm2_5":
        const pm = parseFloat(value);
        if (pm < 12) {
          status = "Good";
          colorClass = styles.good;
        } else if (pm < 36) {
          status = "Moderate";
          colorClass = styles.moderate;
        } else if (pm < 56) {
          status = "Unhealthy (Sensitive)";
          colorClass = styles.unhealthy;
        } else if (pm < 151) {
          status = "Very unhealthy";
          colorClass = styles.veryUnhealthy;
        } else {
          status = "Hazardous";
          colorClass = styles.hazardous;
        }
        break;

      case "uv":
        const uv = parseFloat(value);
        if (uv < 3) {
          status = "Low";
          colorClass = styles.good;
        } else if (uv <= 5) {
          status = "Moderate";
          colorClass = styles.moderate;
        } else if (uv <= 7) {
          status = "High";
          colorClass = styles.unhealthy;
        } else if (uv <= 10) {
          status = "Very High";
          colorClass = styles.veryUnhealthy;
        } else {
          status = "Extreme";
          colorClass = styles.hazardous;
        }
        break;

      case "wind":
        const wind = parseFloat(value);
        if (wind < 19) {
          status = "Light";
          colorClass = styles.good;
        } else if (wind <= 24) {
          status = "Fresh Breeze";
          colorClass = styles.moderate;
        } else if (wind <= 31) {
          status = "Strong Breeze";
          colorClass = styles.unhealthy;
        } else if (wind <= 38) {
          status = "Near Gale";
          colorClass = styles.veryUnhealthy;
        } else {
          status = "Gale";
          colorClass = styles.hazardous;
        }
        break;

      case "rain":
        const rain = parseFloat(value);
        if (rain < 2.5) {
          status = "Light";
          colorClass = styles.good;
        } else if (rain < 7.5) {
          status = "Moderate";
          colorClass = styles.moderate;
        } else if (rain < 15) {
          status = "Heavy";
          colorClass = styles.unhealthy;
        } else if (rain < 30) {
          status = "Intense";
          colorClass = styles.veryUnhealthy;
        } else {
          status = "Torrential";
          colorClass = styles.hazardous;
        }
        break;

        case "heat":
        if (!Array.isArray(value) || value.length !== 2) {
          // status = "No Data";
          colorClass = styles.moderate;
          displayValue = "—";
          break;
        }

        const [tempRaw, humidityRaw] = value;
        const temp = parseFloat(tempRaw);
        const humidity = parseFloat(humidityRaw);

        if (isNaN(temp) || isNaN(humidity)) {
          // status = "No Data";
          colorClass = styles.moderate;
          displayValue = "—";
          break;
        }

        const heatIndex = calculateHeatIndex(temp, humidity);
        displayValue = `${heatIndex.toFixed(1)}`;

        if (heatIndex < 80) {
          status = "Caution";
          colorClass = styles.good;
        } else if (heatIndex < 90) {
          status = "Extreme Caution";
          colorClass = styles.moderate;
        } else if (heatIndex < 103) {
          status = "Danger";
          colorClass = styles.unhealthy;
        } else if (heatIndex < 125) {
          status = "Extreme Danger";
          colorClass = styles.veryUnhealthy;
        } else {
          status = "Extreme Danger";
          colorClass = styles.hazardous;
        }
        break;

      default:
        status = "Unknown";
        colorClass = styles.moderate;
    }
  }

  const icon =
    colorClass === styles.good ? <FaCheckCircle /> :
    colorClass === styles.moderate ? <FaExclamationTriangle /> :
    <FaTimesCircle />;

  return (
    <div className={`${styles.valueBox} ${colorClass}`}>
      <span className={styles.icon}>{icon}</span>
      <span>{displayValue}</span>
      <span className={styles.label}>{status}</span>
    </div>
  );
}

function calculateHeatIndex(temp, humidity) {
  const T = parseFloat(temp) + 32;
  const R = parseFloat(humidity); 

  if (isNaN(T) || isNaN(R)) return null;

  const HI = -42.379 + 2.04901523 * T + 10.14333127 * R
             - 0.22475541 * T * R - 0.00683783 * T * T
             - 0.05481717 * R * R + 0.00122874 * T * T * R
             + 0.00085282 * T * R * R - 0.00000199 * T * T * R * R;

  return Math.round(HI * 10) / 10;  // rounded to 1 decimal
}
