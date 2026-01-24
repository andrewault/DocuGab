import { Routes, Route } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Documents from './pages/Documents';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/Dashboard';
import UserDetail from './pages/admin/UserDetail';

export default function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Toolbar /> {/* Spacer for fixed navbar */}
      <Box component="main" sx={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/documents" element={
            <ProtectedRoute>
              <Documents />
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/users/:id" element={
            <ProtectedRoute requireAdmin>
              <UserDetail />
            </ProtectedRoute>
          } />
        </Routes>
      </Box>
    </Box>
  );
}
