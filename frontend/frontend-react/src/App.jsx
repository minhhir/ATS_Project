import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from './components/layouts/PublicLayout';
import DashboardLayout from './components/layouts/DashboardLayout';

// Pages
import JobSearch from './pages/candidate/JobSearch';
import HRDashboard from './pages/recruiter/Dashboard';
import AIEvaluation from './pages/recruiter/AIEvaluation';
import JobManagement from './pages/recruiter/JobManagement';
import Interviews from './pages/recruiter/Interviews';
import Analytics from './pages/recruiter/Analytics';
import Notifications from './pages/recruiter/Notifications';
// (Bạn có thể nhúng AdminDashboard tương tự)

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<PublicLayout />}>
                    <Route path="/" element={<Navigate to="/jobs" replace />} />
                    <Route path="/jobs" element={<JobSearch />} />
                    {/* Các route Login, Register... */}
                </Route>

                <Route path="/hr" element={<DashboardLayout />}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<HRDashboard />} />
                    <Route path="jobs" element={<JobManagement />} />
                    <Route path="interviews" element={<Interviews />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="notifications" element={<Notifications />} />

                    {/* Trang này ẩn trong sidebar, dùng khi click từ bảng Candidates */}
                    <Route path="evaluation/:id" element={<AIEvaluation />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}