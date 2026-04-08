import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { LoginPage } from '@/pages/auth/LoginPage';
import { JobSearchPage } from '@/pages/candidate/JobSearchPage';
import { JobDetailPage } from '@/pages/candidate/JobDetailPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPassword } from '@/pages/auth/ForgotPassword';
import { OTPVerify } from '@/pages/auth/OTPVerify';
import { ResetPassword } from '@/pages/auth/ResetPassword';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<LoginPage />} />
          <Route path="/jobs" element={<JobSearchPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<OTPVerify />} />
          <Route path="/reset-password" element={<ResetPassword />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;