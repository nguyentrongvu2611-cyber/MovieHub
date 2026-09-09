import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute = () => {
  const token = localStorage.getItem('token');
  return token ? <Outlet /> : <Navigate to="/login" replace />;};
export const AdminRoute = () => {
  const role = localStorage.getItem('role');
  return role === 'admin' ? <Outlet /> : <Navigate to="/" replace />;};

