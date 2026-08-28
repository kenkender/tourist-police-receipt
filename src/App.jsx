import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ReceiptProvider } from './contexts/ReceiptContext';
import Navbar from './components/layout/Navbar';
import ParticleBackground from './components/three/ParticleBackground';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import NewReceiptPage from './pages/NewReceiptPage';
import ReceiptListPage from './pages/ReceiptListPage';
import SettingsPage from './pages/SettingsPage';
import './styles/index.css';
import './styles/print.css';

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0f1f3d',
    }}>
      <div style={{
        width: 48, height: 48,
        border: '3px solid rgba(201,168,76,0.3)',
        borderTopColor: '#c9a84c',
        borderRadius: '50%',
        animation: 'spin-slow 0.8s linear infinite',
      }} />
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

// Layout สำหรับหน้าที่ Login แล้ว
function AppLayout({ children }) {
  return (
    <>
      <ParticleBackground intensity={0.6} />
      <Navbar />
      <main style={{ flex: 1 }}>
        {children}
      </main>
    </>
  );
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout><DashboardPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/new-receipt"
        element={
          <ProtectedRoute>
            <AppLayout><NewReceiptPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/receipts"
        element={
          <ProtectedRoute>
            <AppLayout><ReceiptListPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppLayout><SettingsPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ReceiptProvider>
          <AppRoutes />
        </ReceiptProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
