import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/layout/AdminLayout';
import { Users, Briefcase, FileText, Building2, Trash2, AlertOctagon, Target } from 'lucide-react';
import { Button } from '@/ui/Button';
import { StatCard } from '@/components/shared/charts/StatCard';
import { LineChart } from '@/components/shared/charts/LineChart';
import { DonutChart } from '@/components/shared/charts/DonutChart';
import { BarChart } from '@/components/shared/charts/BarChart';
import { ChartCard } from '@/components/shared/charts/ChartCard';
import api from '@/api/axios';

const formatDay = (iso) => {
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1}`;
};

export function AdminDashboardPage() {
    const [stats, setStats] = useState({ totalCandidates: 0, totalRecruiters: 0, totalJobs: 0, totalApplications: 0 });
    const [recentUsers, setRecentUsers] = useState([]);
    const [reports, setReports] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, reportsRes, analyticsRes] = await Promise.all([
                    api.get('/admin/dashboard'),
                    api.get('/admin/reports'),
                    api.get('/admin/analytics')
                ]);
                setStats(statsRes.data.data.stats);
                setRecentUsers(statsRes.data.data.recentUsers);
                setReports(reportsRes.data.data);
                setAnalytics(analyticsRes.data.data);
            } catch (error) {
                console.error('Lỗi lấy dữ liệu quản trị:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const handleDeleteUser = async (id, role) => {
        const confirmMsg = role === 'recruiter'
            ? 'Xóa HR này sẽ XÓA TOÀN BỘ Tin tuyển dụng của họ. Bạn có chắc chắn?'
            : 'Xóa ứng viên này sẽ XÓA TOÀN BỘ Đơn ứng tuyển của họ. Bạn có chắc chắn?';

        if (!window.confirm(confirmMsg)) return;

        try {
            await api.delete(`/admin/users/${id}`);
            setRecentUsers(prev => prev.filter(user => user._id !== id));
            setStats(prev => ({
                ...prev,
                totalCandidates: role === 'candidate' ? prev.totalCandidates - 1 : prev.totalCandidates,
                totalRecruiters: role === 'recruiter' ? prev.totalRecruiters - 1 : prev.totalRecruiters,
            }));
            alert('Đã xóa thành công!');
        } catch (error) {
            alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa!');
        }
    };

    const trendSeries = analytics ? [
        { name: 'Ứng viên mới', color: '#0284c7', points: analytics.trend.users.map(d => ({ x: d.date, y: d.count })) },
        { name: 'Tin tuyển dụng', color: '#10b981', points: analytics.trend.jobs.map(d => ({ x: d.date, y: d.count })) },
        { name: 'Đơn ứng tuyển', color: '#f59e0b', points: analytics.trend.applications.map(d => ({ x: d.date, y: d.count })) }
    ] : [];

    const roleDonut = analytics ? [
        { label: 'Ứng viên', value: stats.totalCandidates, color: '#0284c7' },
        { label: 'Nhà tuyển dụng', value: stats.totalRecruiters, color: '#a855f7' }
    ] : [];

    const approvalDonut = analytics ? [
        { label: 'Đã duyệt', value: analytics.jobApproval.approved, color: '#10b981' },
        { label: 'Chờ duyệt', value: analytics.jobApproval.pending, color: '#f59e0b' },
        { label: 'Từ chối', value: analytics.jobApproval.rejected, color: '#ef4444' }
    ] : [];

    const appStatusDonut = analytics ? [
        { label: 'Đã nộp', value: analytics.applicationStatus.applied, color: '#94a3b8' },
        { label: 'Đang xem', value: analytics.applicationStatus.reviewing, color: '#0284c7' },
        { label: 'Lọt vòng', value: analytics.applicationStatus.shortlisted, color: '#06b6d4' },
        { label: 'PV', value: analytics.applicationStatus.interviewed, color: '#8b5cf6' },
        { label: 'Đậu', value: analytics.applicationStatus.offered, color: '#10b981' },
        { label: 'Loại', value: analytics.applicationStatus.rejected, color: '#ef4444' }
    ] : [];

    const topRecruitersBars = analytics ? analytics.topRecruiters.map(r => ({
        label: r.name || 'Không tên',
        value: r.jobCount,
        color: '#a855f7'
    })) : [];

    return (
        <AdminLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-black text-text-main">Dashboard Quản trị</h1>
                <p className="text-text-muted mt-1 font-medium">Báo cáo tổng quan về tình trạng hệ thống Mini ATS.</p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-border rounded-3xl animate-pulse" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        icon={Users}
                        label="Ứng viên"
                        value={stats.totalCandidates}
                        growthPct={analytics?.growth.candidates.pct}
                        hint={`30 ngày: +${analytics?.growth.candidates.current ?? 0} (trước: ${analytics?.growth.candidates.previous ?? 0})`}
                        bgClass="bg-blue-50" colorClass="text-blue-600"
                    />
                    <StatCard
                        icon={Building2}
                        label="Nhà tuyển dụng"
                        value={stats.totalRecruiters}
                        growthPct={analytics?.growth.recruiters.pct}
                        hint={`30 ngày: +${analytics?.growth.recruiters.current ?? 0} (trước: ${analytics?.growth.recruiters.previous ?? 0})`}
                        bgClass="bg-purple-50" colorClass="text-purple-600"
                    />
                    <StatCard
                        icon={Briefcase}
                        label="Tin tuyển dụng"
                        value={stats.totalJobs}
                        growthPct={analytics?.growth.jobs.pct}
                        hint={`30 ngày: +${analytics?.growth.jobs.current ?? 0} (trước: ${analytics?.growth.jobs.previous ?? 0})`}
                        bgClass="bg-emerald-50" colorClass="text-emerald-600"
                    />
                    <StatCard
                        icon={FileText}
                        label="Đơn ứng tuyển"
                        value={stats.totalApplications}
                        growthPct={analytics?.growth.applications.pct}
                        hint={`Tỷ lệ đậu: ${analytics?.offeredRate ?? 0}%`}
                        bgClass="bg-orange-50" colorClass="text-orange-600"
                    />
                </div>
            )}

            {/* CHARTS GRID */}
            {analytics && (
                <>
                    <ChartCard
                        title="Xu hướng 30 ngày qua"
                        subtitle="Số lượng ứng viên, tin tuyển dụng và đơn ứng tuyển mới mỗi ngày"
                        className="mb-6"
                    >
                        <LineChart series={trendSeries} formatX={formatDay} />
                    </ChartCard>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <ChartCard title="Phân bố người dùng" subtitle="Cơ cấu vai trò trên hệ thống">
                            <DonutChart data={roleDonut} centerLabel="Tổng" />
                        </ChartCard>
                        <ChartCard title="Trạng thái duyệt tin" subtitle="Tin tuyển dụng theo trạng thái phê duyệt">
                            <DonutChart data={approvalDonut} centerLabel="Tin" />
                        </ChartCard>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <ChartCard title="Trạng thái đơn ứng tuyển" subtitle={`Tỷ lệ đậu toàn hệ thống: ${analytics.offeredRate}%`}>
                            <DonutChart data={appStatusDonut} centerLabel="Đơn" />
                        </ChartCard>
                        <ChartCard
                            title="Top 5 nhà tuyển dụng"
                            subtitle="Theo số tin tuyển dụng đã đăng"
                            action={<Target size={20} className="text-text-muted" />}
                        >
                            {topRecruitersBars.length
                                ? <BarChart data={topRecruitersBars} color="#a855f7" />
                                : <div className="h-60 flex items-center justify-center text-text-muted text-sm font-medium">Chưa có dữ liệu</div>}
                        </ChartCard>
                    </div>
                </>
            )}

            {/* BẢNG BÁO CÁO VI PHẠM TỪ NHÀ TUYỂN DỤNG */}
            {reports.length > 0 && (
                <div className="bg-danger/5 border-2 border-danger/20 rounded-3xl overflow-hidden mb-8">
                    <div className="p-6 bg-danger/10 border-b border-danger/20 flex justify-between items-center">
                        <h3 className="text-xl font-black text-danger flex items-center gap-2">
                            <AlertOctagon size={24} /> {reports.length} Hồ sơ bị báo cáo vi phạm
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-danger/60 text-xs uppercase font-black tracking-widest">
                                    <th className="p-4">Ứng viên</th>
                                    <th className="p-4">Lý do báo cáo</th>
                                    <th className="p-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.map((app) => (
                                    <tr key={app._id} className="border-b border-danger/10 hover:bg-danger/[0.02]">
                                        <td className="p-4">
                                            <div className="font-bold text-text-main">{app.candidate?.name}</div>
                                            <div className="text-xs text-text-muted">Nộp cho: {app.job?.title}</div>
                                        </td>
                                        <td className="p-4 font-medium text-danger italic">"{app.report.reason}"</td>
                                        <td className="p-4 text-right">
                                            <Link
                                                to={`/admin/applications/${app._id}`}
                                                className="px-4 py-2 bg-danger text-white rounded-xl font-bold text-sm hover:bg-danger/90 transition-colors"
                                            >
                                                Thẩm định
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* BẢNG NGƯỜI DÙNG MỚI */}
            <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border flex justify-between items-center">
                    <h3 className="text-xl font-bold text-text-main flex items-center gap-2"><Users size={20} className="text-primary" /> Người dùng mới</h3>
                    <Link to="/admin/users">
                        <Button variant="outline" size="sm">Xem tất cả</Button>
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface text-text-muted text-sm uppercase tracking-wider">
                                <th className="p-4 font-bold">Họ tên / Công ty</th>
                                <th className="p-4 font-bold">Email</th>
                                <th className="p-4 font-bold">Vai trò</th>
                                <th className="p-4 font-bold text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentUsers.map((u) => (
                                <tr key={u._id} className="border-b border-border hover:bg-surface/50">
                                    <td className="p-4 font-bold text-text-main">{u.name}</td>
                                    <td className="p-4 text-text-muted">{u.email}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${u.role === 'candidate' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                            {u.role === 'candidate' ? 'Ứng viên' : 'Nhà tuyển dụng'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => handleDeleteUser(u._id, u.role)}
                                            className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                                            title="Xóa người dùng"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
