import { useState, useEffect } from 'react';
import { RecruiterLayout } from '@/layout/RecruiterLayout';
import { Briefcase, Users, FileText, TrendingUp, Clock, ArrowRight, Award, Target, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatCard } from '@/components/shared/charts/StatCard';
import { LineChart } from '@/components/shared/charts/LineChart';
import { DonutChart } from '@/components/shared/charts/DonutChart';
import { BarChart } from '@/components/shared/charts/BarChart';
import { FunnelChart } from '@/components/shared/charts/FunnelChart';
import { ChartCard } from '@/components/shared/charts/ChartCard';
import api from '@/api/axios';

const formatDay = (iso) => {
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1}`;
};

export function DashboardPage() {
    const [data, setData] = useState({
        stats: { totalJobs: 0, activeJobs: 0, totalApplications: 0, newApplications: 0 },
        recentApplications: []
    });
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [summaryRes, analyticsRes] = await Promise.all([
                    api.get('/jobs/stats/summary'),
                    api.get('/jobs/stats/analytics')
                ]);
                setData(summaryRes.data.data);
                setAnalytics(analyticsRes.data.data);
            } catch (error) {
                console.error('Lỗi khi tải dữ liệu Dashboard', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) return <RecruiterLayout><div className="p-10 text-center font-bold">Đang tải số liệu...</div></RecruiterLayout>;

    const trendSeries = analytics ? [
        { name: 'Đơn ứng tuyển mới', color: '#0284c7', points: analytics.trend.map(d => ({ x: d.date, y: d.count })) }
    ] : [];

    const statusDonut = analytics ? [
        { label: 'Đã nộp', value: analytics.applicationStatus.applied, color: '#94a3b8' },
        { label: 'Đang xem', value: analytics.applicationStatus.reviewing, color: '#0284c7' },
        { label: 'Lọt vòng', value: analytics.applicationStatus.shortlisted, color: '#06b6d4' },
        { label: 'Phỏng vấn', value: analytics.applicationStatus.interviewed, color: '#8b5cf6' },
        { label: 'Đã offer', value: analytics.applicationStatus.offered, color: '#10b981' },
        { label: 'Loại', value: analytics.applicationStatus.rejected, color: '#ef4444' }
    ] : [];

    const funnelSteps = analytics ? [
        { label: 'Đã nộp đơn', value: analytics.funnel.applied, color: '#94a3b8' },
        { label: 'Đã xem xét', value: analytics.funnel.reviewing, color: '#0284c7' },
        { label: 'Lọt vào shortlist', value: analytics.funnel.shortlisted, color: '#06b6d4' },
        { label: 'Đã phỏng vấn', value: analytics.funnel.interviewed, color: '#8b5cf6' },
        { label: 'Đậu (offer)', value: analytics.funnel.offered, color: '#10b981' }
    ] : [];

    const aiBars = analytics ? analytics.aiScoreBuckets.map(b => ({
        label: b.range,
        value: b.count,
        color: b.range === '80-100' ? '#10b981'
            : b.range === '60-80' ? '#06b6d4'
                : b.range === '40-60' ? '#f59e0b'
                    : '#ef4444'
    })) : [];

    const topJobBars = analytics ? analytics.topJobs.map(j => ({
        label: j.title,
        value: j.applicantCount,
        color: '#0284c7'
    })) : [];

    return (
        <RecruiterLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-black text-text-main">Chào buổi sáng, Recruiter!</h1>
                <p className="text-text-muted font-medium">Dưới đây là tình hình tuyển dụng thực tế của bạn.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    icon={Briefcase}
                    label="Tổng tin tuyển dụng"
                    value={data.stats.totalJobs}
                    growthPct={analytics?.growth.jobs.pct}
                    hint={`30 ngày: +${analytics?.growth.jobs.current ?? 0} (trước: ${analytics?.growth.jobs.previous ?? 0})`}
                    bgClass="bg-primary/10" colorClass="text-primary"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Tin đang hoạt động"
                    value={data.stats.activeJobs}
                    bgClass="bg-success/10" colorClass="text-success"
                />
                <StatCard
                    icon={Users}
                    label="Tổng số ứng viên"
                    value={data.stats.totalApplications}
                    growthPct={analytics?.growth.applications.pct}
                    hint={`30 ngày: +${analytics?.growth.applications.current ?? 0} (trước: ${analytics?.growth.applications.previous ?? 0})`}
                    bgClass="bg-warning/10" colorClass="text-warning"
                />
                <StatCard
                    icon={Award}
                    label="Tỷ lệ đậu"
                    value={`${analytics?.offeredRate ?? 0}%`}
                    hint={`Tỷ lệ loại: ${analytics?.rejectedRate ?? 0}%`}
                    bgClass="bg-emerald-50" colorClass="text-emerald-600"
                />
            </div>

            {/* Trend chart */}
            {analytics && (
                <ChartCard
                    title="Xu hướng nhận hồ sơ — 30 ngày qua"
                    subtitle="Số đơn ứng tuyển mới mỗi ngày"
                    className="mb-6"
                >
                    <LineChart series={trendSeries} formatX={formatDay} />
                </ChartCard>
            )}

            {/* Funnel + Status */}
            {analytics && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <ChartCard
                        title="Phễu chuyển đổi tuyển dụng"
                        subtitle="Tỷ lệ ứng viên qua từng bước"
                        action={<Target size={20} className="text-text-muted" />}
                    >
                        <FunnelChart steps={funnelSteps} />
                    </ChartCard>
                    <ChartCard title="Trạng thái đơn ứng tuyển" subtitle="Phân bố toàn bộ hồ sơ">
                        <DonutChart data={statusDonut} centerLabel="Đơn" />
                    </ChartCard>
                </div>
            )}

            {/* AI score + Top jobs */}
            {analytics && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <ChartCard
                        title="Phân bố điểm AI"
                        subtitle="Số hồ sơ theo từng khoảng điểm"
                        action={<Sparkles size={20} className="text-primary" />}
                    >
                        <BarChart data={aiBars} />
                    </ChartCard>
                    <ChartCard
                        title="Top tin tuyển dụng nhiều ứng viên nhất"
                        subtitle="5 vị trí nhận nhiều CV nhất"
                    >
                        {topJobBars.length
                            ? <BarChart data={topJobBars} />
                            : <div className="h-60 flex items-center justify-center text-text-muted text-sm font-medium">Chưa có dữ liệu</div>}
                    </ChartCard>
                </div>
            )}

            {/* Recent Apps Section */}
            <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border flex justify-between items-center">
                    <h3 className="text-xl font-bold text-text-main">Ứng viên mới nộp gần đây</h3>
                    <Link to="/recruiter/candidates" className="text-primary font-bold text-sm flex items-center gap-1 hover:underline">
                        Xem tất cả <ArrowRight size={16} />
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface text-text-muted uppercase text-xs font-black tracking-wider">
                                <th className="px-6 py-4">Ứng viên</th>
                                <th className="px-6 py-4">Vị trí</th>
                                <th className="px-6 py-4">Thời gian</th>
                                <th className="px-6 py-4">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {data.recentApplications.map((app) => (
                                <tr key={app._id} className="hover:bg-surface/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                                {app.candidate.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-text-main">{app.candidate.name}</div>
                                                <div className="text-xs text-text-muted">{app.candidate.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-sm text-text-main">{app.job.title}</td>
                                    <td className="px-6 py-4 text-sm text-text-muted">
                                        <div className="flex items-center gap-1.5"><Clock size={14} /> {new Date(app.createdAt).toLocaleDateString('vi-VN')}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link to={`/recruiter/candidates?jobId=${app.job._id}`}>
                                            <button className="px-4 py-2 bg-surface hover:bg-border rounded-xl text-xs font-bold transition-colors">Chi tiết</button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </RecruiterLayout>
    );
}
