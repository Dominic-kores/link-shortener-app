
import {
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import LinkStats from "./pages/LinkStats";

// Only authenticated users can access children.
function ProtectedRoute({ children }) {
  const { user } = useAuth();

  return user
    ? children
    : <Navigate to="/login" replace />;
}

export default function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <>
      <header className="bg-white border-b">
        <nav className="max-w-5xl mx-auto p-4 flex justify-between items-center gap-3">
          <Link
            to="/"
            className="font-bold text-indigo-700 text-xl"
          >
            🔗 Linkly
          </Link>

          <div className="flex items-center gap-3 text-sm">
            {user ? (
              <>
                <Link to="/">Dashboard</Link>

                <button
                  className="btn"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Routes>
          <Route
            path="/login"
            element={
              user
                ? <Navigate to="/" />
                : <Login />
            }
          />

          <Route
            path="/register"
            element={
              user
                ? <Navigate to="/" />
                : <Register />
            }
          />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/links/:id"
            element={
              <ProtectedRoute>
                <LinkStats />
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={<h1>Page not found</h1>}
          />
        </Routes>
      </main>
    </>
  );
}
