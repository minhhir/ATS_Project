import { useState, useEffect } from 'react';
import { RecruiterLayout } from '@/layout/RecruiterLayout';
import { Briefcase, Users, TrendingUp, Award, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatCard } from '@/components/shared/charts/StatCard';
import { LineChart } from '@/components/shared/charts/LineChart';
import { DonutChart } from '@/components/shared/charts/DonutChart';
import { BarChart } from '@/components/shared/charts/BarChart';
import { FunnelChart } from '@/components/shared/charts/FunnelChart';
import { ChartCard } from '@/components/shared/charts/ChartCard';
import { Skeleton } from '@/ui/Skeleton';
// Vấn đề: Bảng màu cũ của biểu đồ dùng 6 hue rời rạc (xám, xanh dương, cyan, TÍM, xanh lá, đỏ).
// Tím không có trong bảng màu hệ thống, và dùng 6 hue cho một chuỗi có thứ tự khiến người đọc
// tưởng đó là 6 loại khác nhau chứ không phải các bước nối tiếp của cùng một quy trình.
// Giải pháp: Phễu và phân bố điểm là đại lượng CÓ THỨ TỰ → dùng một hue, đậm dần theo mức độ.
// Chỉ hai kết cục thật sự (đậu / loại) mới được dùng màu ngữ nghĩa.
//
// Ramp rút từ 5 bước xuống 4: ba bước nhạt của bản cũ (#bae6fd 1.33:1, #7dd3fc 1.67:1,
// #38bdf8 2.14:1) đều dưới ngưỡng 3:1 của WCAG 1.4.11, tức thanh phễu "Đã nộp đơn" — bước đông
// người nhất — gần như không thấy trên nền trắng. Thang Sky chỉ có 4 bước từ 600 trở đi còn đạt
// ngưỡng, nên thà 4 bước nhìn được còn hơn 5 bước mà hai bước đầu vô hình.
import { CHART_RAMP as RAMP, CHART_SEMANTIC } from '@/utils/chartColors';
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

    // Vấn đề: Dashboard cần 2 nhóm dữ liệu (summary KPI + analytics chart) từ 2 endpoint khác nhau, gọi tuần tự sẽ gấp đôi thời gian load.
    // Giải pháp: Promise.all gửi song song; lỗi 1 endpoint không kill render, fallback hiển thị 0.
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

    const trendSeries = analytics ? [
        { name: 'Đơn ứng tuyển mới', color: RAMP[1], points: analytics.trend.map(d => ({ x: d.date, y: d.count })) }
    ] : [];

    const statusDonut = analytics ? [
        { label: 'Đã nộp', value: analytics.applicationStatus.applied, color: CHART_SEMANTIC.muted },
        { label: 'Đang xem', value: analytics.applicationStatus.reviewing, color: RAMP[0] },
        { label: 'Lọt vòng', value: analytics.applicationStatus.shortlisted, color: RAMP[1] },
        { label: 'Phỏng vấn', value: analytics.applicationStatus.interviewed, color: RAMP[2] },
        { label: 'Đã offer', value: analytics.applicationStatus.offered, color: CHART_SEMANTIC.success },
        { label: 'Loại', value: analytics.applicationStatus.rejected, color: CHART_SEMANTIC.danger }
    ] : [];

    // Phễu có 5 chặng nhưng ramp chỉ còn 4 bước đạt chuẩn. Chặng cuối "Đậu (offer)" lấy màu
    // success thay vì bước ramp thứ 5 — đúng với quy tắc đã đặt ở ngay trên: đậu là KẾT CỤC thật
    // sự chứ không phải một mức trung gian, nên nó thuộc nhóm màu ngữ nghĩa. Donut trạng thái
    // ngay bên cạnh cũng đang tô "Đã offer" bằng success, hai biểu đồ vì thế khớp nhau.
    const funnelSteps = analytics ? [
        { label: 'Đã nộp đơn', value: analytics.funnel.applied, color: RAMP[0] },
        { label: 'Đã xem xét', value: analytics.funnel.reviewing, color: RAMP[1] },
        { label: 'Lọt vào shortlist', value: analytics.funnel.shortlisted, color: RAMP[2] },
        { label: 'Đã phỏng vấn', value: analytics.funnel.interviewed, color: RAMP[3] },
        { label: 'Đậu (offer)', value: analytics.funnel.offered, color: CHART_SEMANTIC.success }
    ] : [];

    // Vấn đề: Bucket điểm AI của BE không kèm màu, FE phải tự gán.
    // Giải pháp: Đây là biểu đồ phân bố của một đại lượng có thứ tự (điểm 0→100), nên dùng
    // cùng một hue đậm dần theo khoảng điểm. Nhãn khoảng điểm đã nói rõ ý nghĩa, không cần
    // tô đỏ/vàng — tô màu cảnh báo ở đây sẽ khiến người đọc tưởng hồ sơ điểm thấp là "lỗi".
    // Bốn khoảng điểm khớp đúng bốn bước ramp — điểm càng cao màu càng đậm.
    const aiBars = analytics ? analytics.aiScoreBuckets.map(b => ({
        label: b.range,
        value: b.count,
        color: b.range === '80-100' ? RAMP[3]
            : b.range === '60-80' ? RAMP[2]
                : b.range === '40-60' ? RAMP[1]
                    : RAMP[0]
    })) : [];

    const topJobBars = analytics ? analytics.topJobs.map(j => ({
        label: j.title,
        value: j.applicantCount,
        color: RAMP[1]
    })) : [];

    return (
        <RecruiterLayout>
            <div>
                <h1 className="text-2xl font-semibold text-text-main">Tổng quan tuyển dụng</h1>
                <p className="text-sm text-text-muted mt-1">
                    Số liệu 30 ngày gần nhất trên các tin bạn đang phụ trách.
                </p>
            </div>

            {/* Mật độ cao: gap 3 thay vì 6, card padding 16px — HR cần thấy cả 4 chỉ số
                cùng lúc với biểu đồ bên dưới mà không phải cuộn. */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                    loading={loading}
                    icon={Briefcase}
                    label="Tổng tin tuyển dụng"
                    value={data.stats.totalJobs}
                    growthPct={analytics?.growth.jobs.pct}
                    hint={`30 ngày: +${analytics?.growth.jobs.current ?? 0} (kỳ trước: ${analytics?.growth.jobs.previous ?? 0})`}
                />
                <StatCard
                    loading={loading}
                    icon={TrendingUp}
                    label="Tin đang hoạt động"
                    value={data.stats.activeJobs}
                />
                <StatCard
                    loading={loading}
                    icon={Users}
                    label="Tổng số ứng viên"
                    value={data.stats.totalApplications}
                    growthPct={analytics?.growth.applications.pct}
                    hint={`30 ngày: +${analytics?.growth.applications.current ?? 0} (kỳ trước: ${analytics?.growth.applications.previous ?? 0})`}
                />
                <StatCard
                    loading={loading}
                    icon={Award}
                    label="Tỷ lệ đậu"
                    value={`${analytics?.offeredRate ?? 0}%`}
                    hint={`Tỷ lệ loại: ${analytics?.rejectedRate ?? 0}%`}
                />
            </div>

            {/* Trend chart */}
            {analytics && (
                <ChartCard
                    title="Xu hướng nhận hồ sơ — 30 ngày qua"
                    subtitle="Số đơn ứng tuyển mới mỗi ngày"
                >
                    <LineChart series={trendSeries} formatX={formatDay} />
                </ChartCard>
            )}

            {/* Funnel + Status */}
            {analytics && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <ChartCard
                        title="Phễu chuyển đổi tuyển dụng"
                        subtitle="Số ứng viên còn lại qua từng bước"
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <ChartCard
                        title="Phân bố điểm khớp CV"
                        subtitle="Số hồ sơ theo từng khoảng điểm, càng đậm càng khớp cao"
                    >
                        <BarChart data={aiBars} />
                    </ChartCard>
                    <ChartCard
                        title="Tin nhận nhiều hồ sơ nhất"
                        subtitle="5 vị trí dẫn đầu"
                    >
                        {topJobBars.length
                            ? <BarChart data={topJobBars} />
                            : <div className="h-80 flex items-center justify-center text-sm text-text-muted">Chưa đủ dữ liệu để xếp hạng</div>}
                    </ChartCard>
                </div>
            )}

            {/* Recent Apps */}
            <section className="border border-border rounded-lg bg-surface-raised overflow-hidden">
                <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between gap-3">
                    <h2 className="text-base font-semibold text-text-main">Hồ sơ mới nhận</h2>
                    <Link
                        to="/recruiter/candidates"
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover hover:underline rounded-sm"
                    >
                        Xem tất cả <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                </div>

                {/* Vấn đề: Khi đang tải, recentApplications vẫn là [] nên nếu chỉ kiểm tra length
                    sẽ hiện "chưa có ứng viên nào" — báo sai cho HR rằng không ai nộp hồ sơ.
                    Giải pháp: Kiểm tra loading trước, chỉ kết luận rỗng khi đã tải xong. */}
                {loading ? (
                    <div className="p-4 space-y-2.5" aria-busy="true" aria-label="Đang tải hồ sơ mới nhận">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between gap-4">
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        ))}
                    </div>
                ) : data.recentApplications.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-text-muted">
                        Chưa có ứng viên nào nộp hồ sơ trong thời gian gần đây.
                    </p>
                ) : (
                    <>
                        {/* Vấn đề: Bảng có 4 cột ở màn 375px sẽ tràn ngang, HR phải vuốt ngang mới đọc hết.
                            Giải pháp: Từ md trở lên dùng <table> đúng ngữ nghĩa; dưới md đổi sang danh sách
                            thẻ, mỗi hồ sơ là một khối đọc theo chiều dọc. */}
                        <div className="hidden md:block scroll-x">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-surface-sunken text-text-muted">
                                        <th scope="col" className="px-4 py-2.5 font-medium text-xs">Ứng viên</th>
                                        <th scope="col" className="px-4 py-2.5 font-medium text-xs">Vị trí</th>
                                        <th scope="col" className="px-4 py-2.5 font-medium text-xs">Ngày nộp</th>
                                        <th scope="col" className="px-4 py-2.5 font-medium text-xs text-right">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-subtle">
                                    {data.recentApplications.map((app) => (
                                        <tr key={app._id} className="hover:bg-surface transition-colors">
                                            <td className="px-4 py-2.5">
                                                <div className="font-medium text-text-main">{app.candidate.name}</div>
                                                <div className="text-xs text-text-subtle">{app.candidate.email}</div>
                                            </td>
                                            <td className="px-4 py-2.5 text-text-muted">{app.job.title}</td>
                                            <td className="px-4 py-2.5 text-text-muted tabular-nums">
                                                {new Date(app.createdAt).toLocaleDateString('vi-VN')}
                                            </td>
                                            <td className="px-4 py-2.5 text-right">
                                                <Link
                                                    to={`/recruiter/candidates?jobId=${app.job._id}`}
                                                    aria-label={`Xem hồ sơ của ${app.candidate.name}`}
                                                    className="inline-flex items-center h-8 px-2.5 rounded-lg border border-border bg-white text-xs font-semibold text-text-main transition-colors hover:bg-surface hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                                                >
                                                    Xem hồ sơ
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <ul className="md:hidden divide-y divide-border-subtle">
                            {data.recentApplications.map((app) => (
                                <li key={app._id} className="px-4 py-3">
                                    <div className="font-medium text-sm text-text-main">{app.candidate.name}</div>
                                    <div className="text-xs text-text-subtle">{app.candidate.email}</div>
                                    <div className="text-sm text-text-muted mt-1.5">{app.job.title}</div>
                                    <div className="flex items-center justify-between gap-3 mt-2">
                                        <span className="text-xs text-text-subtle tabular-nums">
                                            {new Date(app.createdAt).toLocaleDateString('vi-VN')}
                                        </span>
                                        <Link
                                            to={`/recruiter/candidates?jobId=${app.job._id}`}
                                            aria-label={`Xem hồ sơ của ${app.candidate.name}`}
                                            className="inline-flex items-center h-8 px-2.5 rounded-lg border border-border bg-white text-xs font-semibold text-text-main transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                                        >
                                            Xem hồ sơ
                                        </Link>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </section>
        </RecruiterLayout>
    );
}
