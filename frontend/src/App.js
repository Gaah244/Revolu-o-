import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import MissionsPage from "./pages/MissionsPage";
import ReportsPage from "./pages/ReportsPage";
import ChatPage from "./pages/ChatPage";
import ToolsPage from "./pages/ToolsPage";
import AdminPage from "./pages/AdminPage";
import ProfilePage from "./pages/ProfilePage";
import Layout from "./components/Layout";
import "./App.css";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-black flex items-center justify-center">
        <div className="text-primary glow-text font-display text-2xl">
          CARREGANDO SISTEMA...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-black flex items-center justify-center">
        <div className="text-primary glow-text font-display text-2xl">
          CARREGANDO SISTEMA...
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route
          path="missions"
          element={
            <ProtectedRoute allowedRoles={["admin", "tenente", "elite", "soldado"]}>
              <MissionsPage />
            </ProtectedRoute>
          }
        />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route
          path="tools"
          element={
            <ProtectedRoute allowedRoles={["admin", "tenente", "elite", "soldado"]}>
              <ToolsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="scanlines grain">
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: '#0A0A0A',
                border: '1px solid rgba(0, 255, 148, 0.3)',
                color: '#00FF94',
                fontFamily: 'JetBrains Mono, monospace',
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
