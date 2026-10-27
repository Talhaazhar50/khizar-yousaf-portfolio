import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Portfolio from "./Portfolio.jsx";
import Admin from "./Admin.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Portfolio />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
