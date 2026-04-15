import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { LandingPage } from '@/pages/LandingPage';
import { NotificationsPage } from '@/pages/shared/NotificationsPage';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPassword } from '@/pages/auth/ForgotPassword';
import { OTPVerify } from '@/pages/auth/OTPVerify';
import { ResetPassword } from '@/pages/auth/ResetPassword';

// Candidate Pages
import { JobSearchPage } from '@/pages/candidate/JobSearchPage';
import { JobDetailPage } from '@/pages/candidate/JobDetailPage';
import { SettingsPage as CandidateSettingsPage } from '@/pages/candidate/SettingsPage';
import { ApplicationsPage } from '@/pages/candidate/ApplicationsPage';
// Recruiter Pages (MỚI)
import { DashboardPage } from '@/pages/recruiter/DashboardPage';
import { JobsManagePage } from '@/pages/recruiter/JobsManagePage';
import { JobCreatePage } from '@/pages/recruiter/JobCreatePage';
import { CandidatesManagePage } from '@/pages/recruiter/CandidatesManagePage';
import { SettingsPage } from '@/pages/recruiter/SettingsPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<OTPVerify />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/jobs" element={<ProtectedRoute allowedRoles={['candidate']}><JobSearchPage /></ProtectedRoute>} />
          <Route path="/jobs/:id" element={<ProtectedRoute allowedRoles={['candidate', 'recruiter', 'admin']}><JobDetailPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute allowedRoles={['candidate']}><CandidateSettingsPage /></ProtectedRoute>} />
          <Route path="/applications" element={<ProtectedRoute allowedRoles={['candidate']}><ApplicationsPage /></ProtectedRoute>} />

          <Route path="/recruiter/dashboard" element={<ProtectedRoute allowedRoles={['recruiter', 'admin']}><DashboardPage /></ProtectedRoute>} />
          <Route path="/recruiter/jobs" element={<ProtectedRoute allowedRoles={['recruiter', 'admin']}><JobsManagePage /></ProtectedRoute>} />
          <Route path="/recruiter/jobs/create" element={<ProtectedRoute allowedRoles={['recruiter', 'admin']}><JobCreatePage /></ProtectedRoute>} />
          <Route path="/recruiter/jobs/:id/edit" element={<ProtectedRoute allowedRoles={['recruiter', 'admin']}><JobCreatePage /></ProtectedRoute>} />
          <Route path="/recruiter/candidates" element={<ProtectedRoute allowedRoles={['recruiter', 'admin']}><CandidatesManagePage /></ProtectedRoute>} />
          <Route path="/recruiter/settings" element={<ProtectedRoute allowedRoles={['recruiter', 'admin']}><SettingsPage /></ProtectedRoute>} />
          <Route path="/recruiter/jobs/:jobId/applicants" element={<ProtectedRoute allowedRoles={['recruiter', 'admin']}><CandidatesManagePage /></ProtectedRoute>} />
          <Route path="/" element={<LandingPage />} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;