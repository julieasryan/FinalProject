import { Link, useLocation } from "react-router-dom";
import styles from "./Navbar.module.css";

const navItems = [
  { name: "Devices", path: "/" },
  { name: "Filter by Date", path: "/filter" },
  { name: "Suggestions", path: "/recommend" },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className={styles.nav}>
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`${styles.link} ${
            location.pathname === item.path ? styles.active : ""
          }`}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
}
