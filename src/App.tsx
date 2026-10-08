import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './store/AppContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import ReportPage from './pages/ReportPage';
import ReportViewPage from './pages/ReportViewPage';
import DowntimeDetailPage from './pages/DowntimeDetailPage';
import InvestigationsPage from './pages/InvestigationsPage';
import AuditPage from './pages/AuditPage';
import UsersPage from './pages/UsersPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useApp();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { currentUser } = useApp();

  return (
    <Routes>
      <Route
        path="/login"
        element={currentUser ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<ReportPage />} />
        <Route path="/report/:reportId" element={<ReportViewPage />} />
        <Route path="/report/:reportId/downtime/:downtimeId" element={<DowntimeDetailPage />} />
        <Route path="/investigations" element={<InvestigationsPage />} />
        <Route path="/audit" element={<AuditPage />} />
        <Route path="/users" element={<UsersPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </HashRouter>
  );
}
