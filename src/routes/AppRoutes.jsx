import { useSelector } from 'react-redux';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import LandingPage from '../pages/public/LandingPage';
import RegisterPage from '../pages/auth/RegisterPage';
import RegisterDetailsPage from '../pages/auth/RegisterDetailsPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import DashboardHome from '../pages/dashboard/DashboardHome';
import DashboardLayout from '../components/templates/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import NotFoundPage from '../pages/notfound/NotFoundPage';
import AboutPage from '../pages/public/AboutPage';
import TermsPage from '../pages/public/TermsPage';
import PrivacyPage from '../pages/public/PrivacyPage';
import RefundPage from '../pages/public/RefundPage';

function AppRoutes() {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <Router>
      <Routes>
        {/* Root path logic: Landing page for guests, Dashboard for users */}
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} />

        {/* --- PUBLIC ROUTES (Accessible only if NOT logged in) --- */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register-details" element={<RegisterDetailsPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* --- PROTECTED ROUTES (Accessible only if logged in) --- */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardHome />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* --- STANDALONE PUBLIC ROUTES --- */}
        <Route path="/about" element={<AboutPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/refund" element={<RefundPage />} />

        {/* --- 404 NOT FOUND --- */}
        <Route path="*" element={<NotFoundPage />} />

      </Routes>
    </Router>
  );
}

export default AppRoutes;