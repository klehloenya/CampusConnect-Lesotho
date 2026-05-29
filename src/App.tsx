import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { AuthProvider } from './components/AuthProvider';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Categories from './pages/Categories';
import Students from './pages/Students';
import Requests from './pages/Requests';
import Auth from './pages/Auth';
import CreateRequest from './pages/CreateRequest';
import StudentDashboard from './pages/StudentDashboard';
import VendorDashboard from './pages/VendorDashboard';
import SubmittedOffers from './pages/SubmittedOffers';
import Profile from './pages/Profile';
import { useAuthStore } from './store/authStore';
import LoadingScreen from './components/ui/LoadingScreen';
import FavoritesSheet from './components/ui/FavoritesSheet';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('student' | 'vendor')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuthStore();
  
  if (loading) {
    return null; // Let the global LoadingScreen handle the loading phase
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role as any)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const DashboardRouter: React.FC = () => {
  const { user } = useAuthStore();
  if (user?.role === 'vendor') {
    return <VendorDashboard />;
  }
  return <StudentDashboard />;
};

export default function App() {
  const { loading } = useAuthStore();

  return (
    <Router>
      <div className="min-h-screen bg-bg-main font-sans text-slate-900 selection:bg-brand-primary/10 selection:text-brand-primary">
        <AnimatePresence mode="wait">
          {loading ? (
            <LoadingScreen key="loading" />
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <Navbar />
              <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route 
                    path="/students" 
                    element={
                      <ProtectedRoute allowedRoles={['vendor']}>
                        <Students />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/requests" 
                    element={
                      <ProtectedRoute allowedRoles={['vendor']}>
                        <Requests />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="/login" element={<Auth />} />
                  <Route path="/register" element={<Auth />} />
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute allowedRoles={['student', 'vendor']}>
                        <DashboardRouter />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/create-request" 
                    element={
                      <ProtectedRoute allowedRoles={['student']}>
                        <CreateRequest />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/submitted-offers" 
                    element={
                      <ProtectedRoute allowedRoles={['vendor']}>
                        <SubmittedOffers />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/profile" 
                    element={
                      <ProtectedRoute allowedRoles={['student', 'vendor']}>
                        <Profile />
                      </ProtectedRoute>
                    } 
                  />
                </Routes>
              </main>
              <FavoritesSheet />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Router>
  );
}
