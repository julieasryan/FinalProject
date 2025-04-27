import styles from "./DeviceCard.module.css";
import MeasurementValue from "../MeasurementValue/MeasurementValue";

export default function DeviceCard({ name, values, advice, timestamp }) {
  return (
    <div className={styles.card}>
      <div className={styles.title}>
        <h3 className={styles.name}>{name}</h3>
        <h4 className={styles.time}>{timestamp}</h4>
      </div>
      <div className={styles.measurements}>
        <div className={styles.measurementItem}>
          <span className={styles.measurementName}>Air Pollution</span>
          <MeasurementValue type="pm2_5" value={values.PM} />
        </div>
        <div className={styles.measurementItem}>
          <span className={styles.measurementName}>UV</span>
          <MeasurementValue type="uv" value={values.UV} />
        </div>
        <div className={styles.measurementItem}>
          <span className={styles.measurementName}>Wind</span>
          <MeasurementValue type="wind" value={values.Wind} />
        </div>
        <div className={styles.measurementItem}>
          <span className={styles.measurementName}>Rain</span>
          <MeasurementValue type="rain" value={values.Rain} />
        </div>
        <div className={styles.measurementItem}>
          <span className={styles.measurementName}>Heat Index</span>
          <MeasurementValue type="heat" value={[values.Temp, values.Humidity]} />
          </div>
      </div>
      <p className={styles.advice}>{advice}</p>
    </div>
  );
}
