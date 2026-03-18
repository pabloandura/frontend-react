import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import ProductsPage from './pages/ProductsPage';
import CreateOrderPage from './pages/CreateOrderPage';
import ReportsPage from './pages/ReportsPage';

function Nav() {
  const { isAuthenticated, logout } = useAuth();
  if (!isAuthenticated) return null;
  return (
    <nav>
      <Link to="/products">Products</Link>
      {' | '}
      <Link to="/orders/new">Create Order</Link>
      {' | '}
      <Link to="/reports">Reports</Link>
      {' | '}
      <button onClick={logout}>Logout</button>
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Nav />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
          <Route path="/orders/new" element={<ProtectedRoute><CreateOrderPage /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
