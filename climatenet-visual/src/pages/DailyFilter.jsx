import styles from "./DailyFilter.module.css";

export default function DailyFilter() {
  return (
    <div className={styles.container}>
      <h1>Daily Max/Min Filter</h1>
      <p>Select a specific day to view the max and min values for each measurement.</p>
    </div>
  );
}
