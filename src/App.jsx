import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './components/Dashboard';
import Overview from './pages/Overview';
import Crime from './pages/Crime';
import PoliceResponse from './pages/PoliceResponse';
import ThreeOneOne from './pages/ThreeOneOne';
import Economy from './pages/Economy';
import Admin from './pages/Admin';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AdminRoute({ children }) {
  const { user, isAdmin } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="crime" element={<Crime />} />
        <Route path="response-times" element={<PoliceResponse />} />
        <Route path="311" element={<ThreeOneOne />} />
        <Route path="economy" element={<Economy />} />
        <Route
          path="admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
