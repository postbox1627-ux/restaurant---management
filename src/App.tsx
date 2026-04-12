import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext"; // 👈 ADD THIS
import Login from "./components/Login";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import Orders from "./components/Orders";
import Tables from "./components/Tables";
import Menu from "./components/Menu";
import Reservations from "./components/Reservations";
import Staff from "./components/Staff";
import Reports from "./components/Reports";
import { useAuth } from "./context/AuthContext";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};
function App() {
  return (
    <AuthProvider> {/* 👈 WRAP EVERYTHING */}
      <BrowserRouter>
        <Routes>
          {/* ✅ Login page */}
          <Route path="/login" element={<Login />} />

          {/* ✅ Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="tables" element={<Tables />} />
            <Route path="menu" element={<Menu />} />
            <Route path="reservations" element={<Reservations />} />
            <Route path="staff" element={<Staff />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
