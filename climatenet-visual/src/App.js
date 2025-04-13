import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Devices from "./pages/Devices";
import DailyFilter from "./pages/DailyFilter";
import Recommendations from "./pages/Recommendations";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Devices />} />
        <Route path="/filter" element={<DailyFilter />} />
        <Route path="/recommend" element={<Recommendations />} />
      </Routes>
    </Router>
  );
}

export default App;
