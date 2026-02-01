import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';
import Navbar from './components/Navbar';
import AdminSidebar from './components/AdminSidebar';
import CustomerSidebar from './components/CustomerSidebar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import DocumentViewer from './pages/DocumentViewer';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import FAQ from './pages/FAQ';
import About from './pages/About';
import Contact from './pages/Contact';
import AdminHome from './pages/admin/AdminHome';
import CustomerProjects from './pages/customer/CustomerProjects';
import CustomerProjectDetail from './pages/customer/CustomerProjectDetail';
import CustomerProjectEdit from './pages/customer/CustomerProjectEdit';
import CustomerDocumentUpload from './pages/customer/CustomerDocumentUpload';
import CustomerTestChat from './pages/customer/CustomerTestChat';
import Users from './pages/admin/Users';
import UserDetail from './pages/admin/UserDetail';
import UserEdit from './pages/admin/UserEdit';
import NewUser from './pages/admin/NewUser';
import FAQManagement from './pages/admin/FAQManagement';
import Customers from './pages/admin/Customers';
import CustomerDetail from './pages/admin/CustomerDetail';
import CustomerEdit from './pages/admin/CustomerEdit';
import Projects from './pages/admin/Projects';
import ProjectDetail from './pages/admin/ProjectDetail';
import ProjectEdit from './pages/admin/ProjectEdit';
import TestChat from './pages/admin/TestChat';
import Database from './pages/admin/Database';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { isAdmin, isCustomer } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Normal app routes for main domain
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Full-width Navbar */}
      <Navbar sidebarOpen={sidebarOpen} onToggleSidebar={handleToggleSidebar} />
      <Toolbar /> {/* Spacer for fixed navbar */}

      {/* Content area with optional sidebar */}
      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* Sidebar column (admin or customer) */}
        {isAdmin && <AdminSidebar isOpen={sidebarOpen} />}
        {isCustomer && <CustomerSidebar isOpen={sidebarOpen} />}

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
            <Route path="/customer" element={
              <ProtectedRoute requireCustomer>
                <CustomerProjects />
              </ProtectedRoute>
            } />
            <Route path="/customer/projects/:uuid" element={
              <ProtectedRoute requireCustomer>
                <CustomerProjectDetail />
              </ProtectedRoute>
            } />
            <Route path="/customer/projects/:uuid/:tab" element={
              <ProtectedRoute requireCustomer>
                <CustomerProjectDetail />
              </ProtectedRoute>
            } />
            <Route path="/customer/projects/:uuid/edit" element={
              <ProtectedRoute requireCustomer>
                <CustomerProjectEdit />
              </ProtectedRoute>
            } />
            <Route path="/customer/projects/:uuid/test" element={
              <ProtectedRoute requireCustomer>
                <CustomerTestChat />
              </ProtectedRoute>
            } />
            <Route path="/customer/projects/:project_uuid/documents/new" element={
              <ProtectedRoute requireCustomer>
                <CustomerDocumentUpload />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute requireAdmin>
                <Users />
              </ProtectedRoute>
            } />
            <Route path="/admin/users/new" element={
              <ProtectedRoute requireAdmin>
                <NewUser />
              </ProtectedRoute>
            } />
            <Route path="/admin/users/:uuid" element={
              <ProtectedRoute requireAdmin>
                <UserDetail />
              </ProtectedRoute>
            } />
            <Route path="/admin/users/:uuid/edit" element={
              <ProtectedRoute requireAdmin>
                <UserEdit />
              </ProtectedRoute>
            } />
            <Route path="/admin/customers" element={
              <ProtectedRoute requireAdmin>
                <Customers />
              </ProtectedRoute>
            } />
            <Route path="/admin/customers/:uuid" element={
              <ProtectedRoute requireAdmin>
                <CustomerDetail />
              </ProtectedRoute>
            } />
            <Route path="/admin/customers/:uuid/edit" element={
              <ProtectedRoute requireAdmin>
                <CustomerEdit />
              </ProtectedRoute>
            } />
            <Route path="/admin/projects" element={
              <ProtectedRoute requireAdmin>
                <Projects />
              </ProtectedRoute>
            } />
            <Route path="/admin/projects/:uuid" element={
              <ProtectedRoute requireAdmin>
                <ProjectDetail />
              </ProtectedRoute>
            } />
            <Route path="/admin/projects/:uuid/edit" element={
              <ProtectedRoute requireAdmin>
                <ProjectEdit />
              </ProtectedRoute>
            } />
            <Route path="/admin/projects/:uuid/test" element={
              <ProtectedRoute requireAdmin>
                <TestChat />
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
