import styles from "./Recommendations.module.css";

export default function Recommendations() {
  return (
    <div className={styles.container}>
      <h1>Recommendations by Region</h1>
      <p>We’ll suggest regions for relaxing based on long-term data (e.g., cleanest air, low UV).</p>
    </div>
  );
}
