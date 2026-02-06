import { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';
import Navbar from './components/Navbar';
import AdminSidebar from './components/AdminSidebar';
import CustomerSidebar from './components/CustomerSidebar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import PublicChat from './pages/PublicChat';
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
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerProjects from './pages/customer/CustomerProjects';
import CustomerProjectDetail from './pages/customer/CustomerProjectDetail';
import CustomerProjectEdit from './pages/customer/CustomerProjectEdit';
import CustomerDocumentUpload from './pages/customer/CustomerDocumentUpload';
import CustomerTestChat from './pages/customer/CustomerTestChat';
import CustomerAccount from './pages/customer/CustomerAccount';
import CustomerUserDetail from './pages/customer/CustomerUserDetail';
import CustomerUserEdit from './pages/customer/CustomerUserEdit';
import Users from './pages/admin/Users';
import UserDetail from './pages/admin/UserDetail';
import UserEdit from './pages/admin/UserEdit';
import NewUser from './pages/admin/NewUser';
import FAQManagement from './pages/admin/FAQManagement';
import FAQEdit from './pages/admin/FAQEdit';
import FAQDetail from './pages/admin/FAQDetail';
import Customers from './pages/admin/Customers';
import NewCustomer from './pages/admin/NewCustomer';
import NewCustomerProject from './pages/admin/NewCustomerProject';
import CustomerDetail from './pages/admin/CustomerDetail';
import CustomerEdit from './pages/admin/CustomerEdit';
import Projects from './pages/admin/Projects';
import NewProject from './pages/admin/NewProject';
import NewProjectMedia from './pages/admin/NewProjectMedia';
import ProjectMediaDetail from './pages/admin/ProjectMediaDetail';
import ProjectMediaEdit from './pages/admin/ProjectMediaEdit';
import NewProjectLink from './pages/admin/NewProjectLink';
import ProjectDetail from './pages/admin/ProjectDetail';
import ProjectEdit from './pages/admin/ProjectEdit';
import TestChat from './pages/admin/TestChat';
import AdminDocumentViewer from './pages/admin/AdminDocumentViewer';
import Database from './pages/admin/Database';
import ChatParameters from './pages/admin/ChatParameters';
import ChatParameterEdit from './pages/admin/ChatParameterEdit';
import ChatParameterDetail from './pages/admin/ChatParameterDetail';
import DemoProjects from './pages/admin/DemoProjects';
import { useAuth } from './context/AuthProvider';

export default function App() {
  const { isAdmin, isCustomer } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // If we are on a public chat route, render standalone layout
  if (location.pathname.startsWith('/chats/')) {
    return (
      <Routes>
        <Route path="/chats/:slug" element={<PublicChat />} />
      </Routes>
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
                <CustomerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/customer/projects" element={
              <ProtectedRoute requireCustomer>
                <CustomerProjects />
              </ProtectedRoute>
            } />
            <Route path="/customer/account" element={
              <ProtectedRoute requireCustomer>
                <CustomerAccount />
              </ProtectedRoute>
            } />
            <Route path="/customer/account/users/:uuid" element={
              <ProtectedRoute requireCustomer>
                <CustomerUserDetail />
              </ProtectedRoute>
            } />
            <Route path="/customer/account/users/:uuid/edit" element={
              <ProtectedRoute requireCustomer>
                <CustomerUserEdit />
              </ProtectedRoute>
            } />
            <Route path="/customer/projects/:uuid" element={
              <ProtectedRoute requireCustomer>
                <CustomerProjectDetail />
              </ProtectedRoute>
            } />
            <Route path="/customer/projects/:uuid/edit" element={
              <ProtectedRoute requireCustomer>
                <CustomerProjectEdit />
              </ProtectedRoute>
            } />
            <Route path="/customer/projects/:uuid/:tab" element={
              <ProtectedRoute requireCustomer>
                <CustomerProjectDetail />
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
            <Route path="/admin/customers/new" element={
              <ProtectedRoute requireAdmin>
                <NewCustomer />
              </ProtectedRoute>
            } />
            <Route path="/admin/customers/:uuid" element={
              <ProtectedRoute requireAdmin>
                <CustomerDetail />
              </ProtectedRoute>
            } />
            <Route path="/admin/customers/:uuid/projects/new" element={
              <ProtectedRoute requireAdmin>
                <NewCustomerProject />
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
            <Route path="/admin/projects/new" element={
              <ProtectedRoute requireAdmin>
                <NewProject />
              </ProtectedRoute>
            } />
            <Route path="/admin/projects/:uuid" element={
              <ProtectedRoute requireAdmin>
                <ProjectDetail />
              </ProtectedRoute>
            } />
            <Route path="/admin/projects/:uuid/media/new" element={
              <ProtectedRoute requireAdmin>
                <NewProjectMedia />
              </ProtectedRoute>
            } />
            <Route path="/admin/projects/:uuid/media/:mediaUuid" element={
              <ProtectedRoute requireAdmin>
                <ProjectMediaDetail />
              </ProtectedRoute>
            } />
            <Route path="/admin/projects/:uuid/media/:mediaUuid/edit" element={
              <ProtectedRoute requireAdmin>
                <ProjectMediaEdit />
              </ProtectedRoute>
            } />
            <Route path="/admin/projects/:uuid/links/new" element={
              <ProtectedRoute requireAdmin>
                <NewProjectLink />
              </ProtectedRoute>
            } />
            <Route path="/admin/projects/:uuid/:tab" element={
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
            <Route path="/admin/projects/:uuid/documents/:document_uuid" element={
              <ProtectedRoute requireAdmin>
                <AdminDocumentViewer />
              </ProtectedRoute>
            } />
            <Route path="/admin/faq" element={
              <ProtectedRoute requireAdmin>
                <FAQManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/faq/new" element={
              <ProtectedRoute requireAdmin>
                <FAQEdit />
              </ProtectedRoute>
            } />
            <Route path="/admin/faq/:uuid" element={
              <ProtectedRoute requireAdmin>
                <FAQDetail />
              </ProtectedRoute>
            } />
            <Route path="/admin/faq/:uuid/edit" element={
              <ProtectedRoute requireAdmin>
                <FAQEdit />
              </ProtectedRoute>
            } />
            <Route path="/admin/database" element={
              <ProtectedRoute requireAdmin>
                <Database />
              </ProtectedRoute>
            } />
            <Route path="/admin/chat-parameters" element={
              <ProtectedRoute requireAdmin>
                <ChatParameters />
              </ProtectedRoute>
            } />
            <Route path="/admin/chat-parameters/:uuid" element={
              <ProtectedRoute requireAdmin>
                <ChatParameterDetail />
              </ProtectedRoute>
            } />
            <Route path="/admin/chat-parameters/:uuid/edit" element={
              <ProtectedRoute requireAdmin>
                <ChatParameterEdit />
              </ProtectedRoute>
            } />
            <Route path="/admin/demo-projects" element={
              <ProtectedRoute requireAdmin>
                <DemoProjects />
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
