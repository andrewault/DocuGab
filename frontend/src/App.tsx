import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';
import Navbar from './components/Navbar';
import AdminSidebar from './components/AdminSidebar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Documents from './pages/Documents';
import DocumentViewer from './pages/DocumentViewer';
import Chat from './pages/Chat';
import PublicChat from './pages/PublicChat';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import FAQ from './pages/FAQ';
import About from './pages/About';
import Contact from './pages/Contact';
import AdminHome from './pages/admin/AdminHome';
import AdminDashboard from './pages/admin/Dashboard';
import UserDetail from './pages/admin/UserDetail';
import NewUser from './pages/admin/NewUser';
import FAQManagement from './pages/admin/FAQManagement';
import Customers from './pages/admin/Customers';
import CustomerDetail from './pages/admin/CustomerDetail';
import Projects from './pages/admin/Projects';
import ProjectDetail from './pages/admin/ProjectDetail';
import Database from './pages/admin/Database';
import { isBrandedRoute } from './utils/subdomainUtils';
import { useAuth } from './context/AuthContext';

export default function App() {
  const isPublicBranded = isBrandedRoute();
  const { isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // For branded subdomains, show minimal UI with public chat
  if (isPublicBranded) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={<PublicChat />} />
          <Route path="*" element={<PublicChat />} />
        </Routes>
      </Box>
    );
  }

  // Normal app routes for main domain
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Full-width Navbar */}
      <Navbar sidebarOpen={sidebarOpen} onToggleSidebar={handleToggleSidebar} />
      <Toolbar /> {/* Spacer for fixed navbar */}

      {/* Content area with optional sidebar */}
      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* Admin sidebar column (only for admins) */}
        {isAdmin && <AdminSidebar isOpen={sidebarOpen} />}

        {/* Main content area */}
        <Box
          component="main"
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/documents" element={
              <ProtectedRoute>
                <Documents />
              </ProtectedRoute>
            } />
            <Route path="/documents/:uuid" element={
              <ProtectedRoute>
                <DocumentViewer />
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
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin>
                <AdminHome />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/users/new" element={
              <ProtectedRoute requireAdmin>
                <NewUser />
              </ProtectedRoute>
            } />
            <Route path="/admin/users/:id" element={
              <ProtectedRoute requireAdmin>
                <UserDetail />
              </ProtectedRoute>
            } />
            <Route path="/admin/customers" element={
              <ProtectedRoute requireAdmin>
                <Customers />
              </ProtectedRoute>
            } />
            <Route path="/admin/customers/:id" element={
              <ProtectedRoute requireAdmin>
                <CustomerDetail />
              </ProtectedRoute>
            } />
            <Route path="/admin/projects" element={
              <ProtectedRoute requireAdmin>
                <Projects />
              </ProtectedRoute>
            } />
            <Route path="/admin/projects/:id" element={
              <ProtectedRoute requireAdmin>
                <ProjectDetail />
              </ProtectedRoute>
            } />
            <Route path="/admin/faq" element={
              <ProtectedRoute requireAdmin>
                <FAQManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/database" element={
              <ProtectedRoute requireAdmin>
                <Database />
              </ProtectedRoute>
            } />
          </Routes>
        </Box>
      </Box>

      {/* Full-width Footer */}
      <Footer />
    </Box>
  );
}
