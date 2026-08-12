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

// Recruiter Pages
import { DashboardPage } from '@/pages/recruiter/DashboardPage';
import { JobsManagePage } from '@/pages/recruiter/JobsManagePage';
import { JobCreatePage } from '@/pages/recruiter/JobCreatePage';
import { CandidatesManagePage } from '@/pages/recruiter/CandidatesManagePage';
import { SettingsPage as RecruiterSettingsPage } from '@/pages/recruiter/SettingsPage';
// Admin Pages
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminJobsPage } from '@/pages/admin/AdminJobsPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';
import { AdminApplicationDetailPage } from '@/pages/admin/AdminApplicationDetailPage';


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ===== PUBLIC ROUTES (Không cần đăng nhập) ===== */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<OTPVerify />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* ===== SHARED PROTECTED ROUTES (Ai đăng nhập cũng xem được) ===== */}
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/jobs/:id" element={<ProtectedRoute allowedRoles={['candidate', 'recruiter', 'admin']}><JobDetailPage /></ProtectedRoute>} />

          {/* ===== CANDIDATE ROUTES (Chỉ ứng viên) ===== */}
          <Route path="/candidate/jobs" element={<ProtectedRoute allowedRoles={['candidate']}><JobSearchPage /></ProtectedRoute>} />
          <Route path="/candidate/applications" element={<ProtectedRoute allowedRoles={['candidate']}><ApplicationsPage /></ProtectedRoute>} />
          <Route path="/candidate/settings" element={<ProtectedRoute allowedRoles={['candidate']}><CandidateSettingsPage /></ProtectedRoute>} />

          {/* ===== RECRUITER ROUTES (Chỉ nhà tuyển dụng / HR) ===== */}
          <Route path="/recruiter/dashboard" element={<ProtectedRoute allowedRoles={['recruiter', 'admin']}><DashboardPage /></ProtectedRoute>} />
          <Route path="/recruiter/jobs" element={<ProtectedRoute allowedRoles={['recruiter', 'admin']}><JobsManagePage /></ProtectedRoute>} />
          <Route path="/recruiter/jobs/create" element={<ProtectedRoute allowedRoles={['recruiter', 'admin']}><JobCreatePage /></ProtectedRoute>} />
          <Route path="/recruiter/jobs/:id/edit" element={<ProtectedRoute allowedRoles={['recruiter', 'admin']}><JobCreatePage /></ProtectedRoute>} />
          <Route path="/recruiter/candidates" element={<ProtectedRoute allowedRoles={['recruiter', 'admin']}><CandidatesManagePage /></ProtectedRoute>} />
          <Route path="/recruiter/jobs/:jobId/applicants" element={<ProtectedRoute allowedRoles={['recruiter', 'admin']}><CandidatesManagePage /></ProtectedRoute>} />
          <Route path="/recruiter/settings" element={<ProtectedRoute allowedRoles={['recruiter', 'admin']}><RecruiterSettingsPage /></ProtectedRoute>} />

          {/* ===== ADMIN ROUTES ===== */}
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsersPage /></ProtectedRoute>} />
          <Route path="/admin/jobs" element={<ProtectedRoute allowedRoles={['admin']}><AdminJobsPage /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettingsPage /></ProtectedRoute>} />
          <Route path="/admin/applications/:id" element={<ProtectedRoute allowedRoles={['admin']}><AdminApplicationDetailPage /></ProtectedRoute>} />
          {/* ===== BẮT LỖI 404 (Trang không tồn tại thì tự văng về trang chủ) ===== */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;