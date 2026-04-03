import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

//pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { OTPVerify } from './pages/auth/OTPVerify';
import { ResetPassword } from './pages/auth/ResetPassword';

// candidate pages
import { JobSearchPage } from './pages/candidate/JobSearchPage';
import { JobDetailPage } from './pages/candidate/JobDetailPage';

//recruiter pages
import { RecruiterDashboard } from './pages/recruiter/RecruiterDashboard';
import { JobManagementPage } from './pages/recruiter/JobManagementPage';
import { ApplicantsPage } from './pages/recruiter/ApplicantsPage';
import { CandidateDetailPage } from './pages/recruiter/CandidateDetailPage';
import { InterviewsPage } from './pages/recruiter/InterviewsPage';
import { NotificationsPage } from './pages/recruiter/NotificationsPage';

// admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagementPage } from './pages/admin/UserManagementPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<OTPVerify />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Candidate routes */}
          <Route path="/jobs" element={
            <ProtectedRoute allowedRoles={['candidate']}>
              <JobSearchPage />
            </ProtectedRoute>
          } />
          <Route path="/jobs/:id" element={
            <ProtectedRoute allowedRoles={['candidate']}>
              <JobDetailPage />
            </ProtectedRoute>
          } />

          {/* Recruiter routes */}
          <Route path="/recruiter/dashboard" element={
            <ProtectedRoute allowedRoles={['recruiter']}>
              <RecruiterDashboard />
            </ProtectedRoute>
          } />
          <Route path="/recruiter/jobs" element={
            <ProtectedRoute allowedRoles={['recruiter']}>
              <JobManagementPage />
            </ProtectedRoute>
          } />
          <Route path="/recruiter/jobs/:jobId/applicants" element={
            <ProtectedRoute allowedRoles={['recruiter']}>
              <ApplicantsPage />
            </ProtectedRoute>
          } />
          <Route path="/recruiter/candidates/:appId" element={
            <ProtectedRoute allowedRoles={['recruiter']}>
              <CandidateDetailPage />
            </ProtectedRoute>
          } />
          <Route path="/recruiter/interviews" element={
            <ProtectedRoute allowedRoles={['recruiter']}>
              <InterviewsPage />
            </ProtectedRoute>
          } />
          <Route path="/recruiter/notifications" element={
            <ProtectedRoute allowedRoles={['recruiter']}>
              <NotificationsPage />
            </ProtectedRoute>
          } />

          {/* Admin routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagementPage />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}