import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/layout/AdminLayout';
import { Users, Briefcase, FileText, Building2, Trash2 } from 'lucide-react';
import { StatCard } from '@/components/shared/charts/StatCard';
import { LineChart } from '@/components/shared/charts/LineChart';
import { DonutChart } from '@/components/shared/charts/DonutChart';
import { BarChart } from '@/components/shared/charts/BarChart';
import { ChartCard } from '@/components/shared/charts/ChartCard';
import { ConfirmDialog } from '@/ui/ConfirmDialog';
// Vấn đề: Bảng màu cũ ở đây là rainbow đúng nghĩa — xanh dương, xanh lá, vàng, đỏ, TÍM, cyan.
// Ba trong số đó là màu ngữ nghĩa nên "tím = nhà tuyển dụng" và "vàng = đơn ứng tuyển" khiến
// người đọc tưởng đang có cảnh báo, trong khi đó chỉ là hai loại dữ liệu bình thường.
// Giải pháp: Khu admin dùng tông trung tính nhất trong 4 phân hệ. Phân loại thường → thang
// xanh-xám đậm dần; chỉ trạng thái có tốt/xấu thật (duyệt / chờ / từ chối) mới dùng màu ngữ nghĩa.
//
// Bảng màu chuyển sang @/utils/chartColors: bản cũ khai báo hex tại chỗ và hai bước cuối
// (#94a3b8 2.56:1, #cbd5e1 1.48:1) nằm dưới ngưỡng 3:1 của WCAG 1.4.11 — cung tròn "Đã nộp",
// trạng thái phổ biến nhất trong donut, gần như không nhìn thấy trên nền trắng.
import { CHART_CATEGORICAL as NEUTRAL_RAMP, CHART_SEMANTIC as SEMANTIC } from '@/utils/chartColors';
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
    const [pendingDelete, setPendingDelete] = useState(null);

    // Vấn đề: Dashboard admin cần 3 nhóm dữ liệu (stats, reports, analytics) từ endpoint khác nhau, gọi tuần tự sẽ làm trang trắng tới 3-4s.
    // Giải pháp: Promise.all chạy song song; 1 endpoint fail không ảnh hưởng các phần khác do mỗi setState độc lập sau khi resolve.
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

    // Vấn đề: Xoá user kéo theo cascade xoá Job/Application của họ — admin phải hiểu rõ hậu quả; KPI cards phải giảm số ngay để đồng bộ với list.
    // Giải pháp: confirmMsg khác nhau theo role để cảnh báo cụ thể; sau API success thì optimistic giảm count tương ứng và xoá user khỏi list.
    // Toàn bộ phần optimistic dưới đây giữ nguyên; chỉ đổi cơ chế hỏi sang ConfirmDialog (focus vào Hủy).
    const handleDeleteUser = async (id, role) => {
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

    // Giữ nguyên nội dung cảnh báo theo role — đây là phần nói rõ hậu quả cascade.
    const deleteMessage = (role) => role === 'recruiter'
        ? 'Xóa nhà tuyển dụng này sẽ xóa toàn bộ tin tuyển dụng của họ, kèm mọi đơn ứng tuyển đã nộp cho các tin đó.'
        : 'Xóa ứng viên này sẽ xóa toàn bộ đơn ứng tuyển họ đã nộp. Nhà tuyển dụng sẽ không còn thấy hồ sơ này.';

    const trendSeries = analytics ? [
        { name: 'Ứng viên mới', color: NEUTRAL_RAMP[0], points: analytics.trend.users.map(d => ({ x: d.date, y: d.count })) },
        { name: 'Tin tuyển dụng', color: NEUTRAL_RAMP[1], points: analytics.trend.jobs.map(d => ({ x: d.date, y: d.count })) },
        { name: 'Đơn ứng tuyển', color: NEUTRAL_RAMP[2], points: analytics.trend.applications.map(d => ({ x: d.date, y: d.count })) }
    ] : [];

    // Hai vai trò không có tốt/xấu → hai mức đậm nhạt của cùng một hue.
    const roleDonut = analytics ? [
        { label: 'Ứng viên', value: stats.totalCandidates, color: NEUTRAL_RAMP[1] },
        { label: 'Nhà tuyển dụng', value: stats.totalRecruiters, color: NEUTRAL_RAMP[3] }
    ] : [];

    // Đây mới là trạng thái có tốt/xấu thật → dùng màu ngữ nghĩa.
    const approvalDonut = analytics ? [
        { label: 'Đã duyệt', value: analytics.jobApproval.approved, color: SEMANTIC.success },
        { label: 'Chờ duyệt', value: analytics.jobApproval.pending, color: SEMANTIC.warning },
        { label: 'Từ chối', value: analytics.jobApproval.rejected, color: SEMANTIC.danger }
    ] : [];

    // Chuỗi có thứ tự (nộp → xem → lọt vòng → phỏng vấn) đậm dần, hai kết cục cuối dùng màu ngữ nghĩa.
    const appStatusDonut = analytics ? [
        { label: 'Đã nộp', value: analytics.applicationStatus.applied, color: SEMANTIC.muted },
        { label: 'Đang xem', value: analytics.applicationStatus.reviewing, color: NEUTRAL_RAMP[3] },
        { label: 'Lọt vòng', value: analytics.applicationStatus.shortlisted, color: NEUTRAL_RAMP[1] },
        { label: 'Phỏng vấn', value: analytics.applicationStatus.interviewed, color: NEUTRAL_RAMP[0] },
        { label: 'Đậu', value: analytics.applicationStatus.offered, color: SEMANTIC.success },
        { label: 'Loại', value: analytics.applicationStatus.rejected, color: SEMANTIC.danger }
    ] : [];

    const topRecruitersBars = analytics ? analytics.topRecruiters.map(r => ({
        label: r.name || 'Không tên',
        value: r.jobCount,
        color: NEUTRAL_RAMP[2]
    })) : [];

    return (
        <AdminLayout>
            <div>
                <h1 className="text-2xl font-semibold text-text-main">Tổng quan hệ thống</h1>
                <p className="text-sm text-text-muted mt-1">
                    Số liệu toàn bộ Mini ATS: người dùng, tin tuyển dụng và đơn ứng tuyển.
                </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                    loading={loading}
                    icon={Users}
                    label="Ứng viên"
                    value={stats.totalCandidates}
                    growthPct={analytics?.growth.candidates.pct}
                    hint={`30 ngày: +${analytics?.growth.candidates.current ?? 0} (kỳ trước: ${analytics?.growth.candidates.previous ?? 0})`}
                />
                <StatCard
                    loading={loading}
                    icon={Building2}
                    label="Nhà tuyển dụng"
                    value={stats.totalRecruiters}
                    growthPct={analytics?.growth.recruiters.pct}
                    hint={`30 ngày: +${analytics?.growth.recruiters.current ?? 0} (kỳ trước: ${analytics?.growth.recruiters.previous ?? 0})`}
                />
                <StatCard
                    loading={loading}
                    icon={Briefcase}
                    label="Tin tuyển dụng"
                    value={stats.totalJobs}
                    growthPct={analytics?.growth.jobs.pct}
                    hint={`30 ngày: +${analytics?.growth.jobs.current ?? 0} (kỳ trước: ${analytics?.growth.jobs.previous ?? 0})`}
                />
                <StatCard
                    loading={loading}
                    icon={FileText}
                    label="Đơn ứng tuyển"
                    value={stats.totalApplications}
                    growthPct={analytics?.growth.applications.pct}
                    hint={`Tỷ lệ đậu: ${analytics?.offeredRate ?? 0}%`}
                />
            </div>

            {/* Hồ sơ bị báo cáo đặt NGAY dưới KPI: đây là việc duy nhất trên trang này cần admin
                xử lý ngay, mọi thứ còn lại chỉ để đọc. Trước đây nó nằm gần cuối trang. */}
            {reports.length > 0 && (
                <section className="border border-danger-100 rounded-lg bg-surface-raised overflow-hidden">
                    <div className="px-5 py-3 border-b border-danger-100 bg-danger-50">
                        <h2 className="text-base font-semibold text-danger-700">
                            {reports.length} hồ sơ bị báo cáo, chờ thẩm định
                        </h2>
                    </div>
                    <ul className="divide-y divide-border-subtle">
                        {reports.map((app) => (
                            <li key={app._id} className="px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="text-sm font-medium text-text-main">{app.candidate?.name}</div>
                                    <div className="text-xs text-text-subtle">Nộp cho: {app.job?.title}</div>
                                    <p className="text-sm text-text-muted mt-1">Lý do: {app.report.reason}</p>
                                </div>
                                <Link
                                    to={`/admin/applications/${app._id}`}
                                    aria-label={`Thẩm định hồ sơ của ${app.candidate?.name}`}
                                    className="inline-flex items-center justify-center h-9 px-3 rounded-lg bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 shrink-0"
                                >
                                    Thẩm định
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {analytics && (
                <>
                    <ChartCard
                        title="Xu hướng 30 ngày qua"
                        subtitle="Người dùng, tin tuyển dụng và đơn ứng tuyển mới mỗi ngày"
                    >
                        <LineChart
                            series={trendSeries}
                            formatX={formatDay}
                            title="Xu hướng tăng trưởng 30 ngày qua"
                        />
                    </ChartCard>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <ChartCard title="Cơ cấu người dùng" subtitle="Tỷ lệ ứng viên và nhà tuyển dụng">
                            <DonutChart data={roleDonut} centerLabel="Người dùng" title="Cơ cấu người dùng theo vai trò" />
                        </ChartCard>
                        <ChartCard title="Trạng thái duyệt tin" subtitle="Tin tuyển dụng theo kết quả kiểm duyệt">
                            <DonutChart data={approvalDonut} centerLabel="Tin" title="Tin tuyển dụng theo trạng thái duyệt" />
                        </ChartCard>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <ChartCard title="Trạng thái đơn ứng tuyển" subtitle={`Tỷ lệ đậu toàn hệ thống: ${analytics.offeredRate}%`}>
                            <DonutChart data={appStatusDonut} centerLabel="Đơn" title="Đơn ứng tuyển theo trạng thái" />
                        </ChartCard>
                        <ChartCard title="Nhà tuyển dụng đăng nhiều tin nhất" subtitle="5 tài khoản dẫn đầu">
                            {topRecruitersBars.length
                                ? <BarChart data={topRecruitersBars} title="Top 5 nhà tuyển dụng theo số tin đã đăng" />
                                : <div className="h-64 flex items-center justify-center text-sm text-text-muted">Chưa đủ dữ liệu để xếp hạng</div>}
                        </ChartCard>
                    </div>
                </>
            )}

            {/* BẢNG NGƯỜI DÙNG MỚI */}
            <section className="border border-border rounded-lg bg-surface-raised overflow-hidden">
                <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between gap-3">
                    <h2 className="text-base font-semibold text-text-main">Người dùng mới đăng ký</h2>
                    <Link
                        to="/admin/users"
                        className="text-sm font-medium text-primary hover:text-primary-hover hover:underline rounded-sm"
                    >
                        Xem tất cả
                    </Link>
                </div>

                {loading ? (
                    <div className="p-4 space-y-2.5" aria-busy="true" aria-label="Đang tải người dùng mới">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between gap-4">
                                <div className="h-4 w-56 skeleton" />
                                <div className="h-4 w-20 skeleton" />
                            </div>
                        ))}
                    </div>
                ) : recentUsers.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-text-muted">Chưa có tài khoản nào đăng ký gần đây.</p>
                ) : (
                    <>
                        <div className="hidden md:block scroll-x">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-surface-sunken text-text-muted">
                                        <th scope="col" className="px-4 py-2.5 font-medium text-xs">Họ tên</th>
                                        <th scope="col" className="px-4 py-2.5 font-medium text-xs">Email</th>
                                        <th scope="col" className="px-4 py-2.5 font-medium text-xs">Vai trò</th>
                                        <th scope="col" className="px-4 py-2.5 font-medium text-xs text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-subtle">
                                    {recentUsers.map((u) => (
                                        <tr key={u._id} className="hover:bg-surface transition-colors">
                                            <td className="px-4 py-2.5 font-medium text-text-main">{u.name}</td>
                                            <td className="px-4 py-2.5 text-text-muted">{u.email}</td>
                                            <td className="px-4 py-2.5">
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm border border-border text-xs text-text-muted">
                                                    {u.role === 'candidate' ? 'Ứng viên' : 'Nhà tuyển dụng'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => setPendingDelete(u)}
                                                    aria-label={`Xóa tài khoản ${u.name}`}
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-sm text-text-muted transition-colors cursor-pointer hover:bg-danger-50 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                                >
                                                    <Trash2 size={16} aria-hidden="true" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <ul className="md:hidden divide-y divide-border-subtle">
                            {recentUsers.map((u) => (
                                <li key={u._id} className="px-4 py-3 flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="font-medium text-sm text-text-main truncate">{u.name}</div>
                                        <div className="text-xs text-text-muted truncate">{u.email}</div>
                                        <div className="text-xs text-text-subtle mt-1">
                                            {u.role === 'candidate' ? 'Ứng viên' : 'Nhà tuyển dụng'}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setPendingDelete(u)}
                                        aria-label={`Xóa tài khoản ${u.name}`}
                                        className="inline-flex items-center justify-center w-9 h-9 rounded-sm border border-border text-text-muted shrink-0 cursor-pointer hover:bg-danger-50 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                    >
                                        <Trash2 size={16} aria-hidden="true" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </section>

            <ConfirmDialog
                open={Boolean(pendingDelete)}
                title="Xóa tài khoản vĩnh viễn"
                message={pendingDelete ? deleteMessage(pendingDelete.role) : ''}
                confirmLabel="Xóa tài khoản"
                onCancel={() => setPendingDelete(null)}
                onConfirm={() => {
                    const target = pendingDelete;
                    setPendingDelete(null);
                    if (target) handleDeleteUser(target._id, target.role);
                }}
            />
        </AdminLayout>
    );
}
