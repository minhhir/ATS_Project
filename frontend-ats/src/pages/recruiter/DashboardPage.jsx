import { useState, useEffect } from 'react';
import { RecruiterLayout } from '@/layout/RecruiterLayout';
import { Briefcase, Users, FileText, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/api/axios';

export function DashboardPage() {
    const [data, setData] = useState({
        stats: { totalJobs: 0, activeJobs: 0, totalApplications: 0, newApplications: 0 },
        recentApplications: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const { data } = await api.get('/jobs/stats/summary');
                setData(data.data);
            } catch (error) {
                console.error('Lỗi khi tải dữ liệu Dashboard', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) return <div className="p-10 text-center font-bold">Đang tải số liệu...</div>;

    const statCards = [
        { label: 'Tổng tin tuyển dụng', value: data.stats.totalJobs, icon: Briefcase, color: 'text-primary', bg: 'bg-primary/10' },
        { label: 'Tin đang hoạt động', value: data.stats.activeJobs, icon: TrendingUp, color: 'text-success', bg: 'bg-success/10' },
        { label: 'Tổng số ứng viên', value: data.stats.totalApplications, icon: Users, color: 'text-warning', bg: 'bg-warning/10' },
        { label: 'Đơn ứng tuyển mới', value: data.stats.newApplications, icon: FileText, color: 'text-danger', bg: 'bg-danger/10' },
    ];

    return (
        <RecruiterLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-black text-text-main">Chào buổi sáng, Recruiter!</h1>
                <p className="text-text-muted font-medium">Dưới đây là tình hình tuyển dụng thực tế của bạn.</p>
            </div>

            {/* Grid Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {statCards.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-border shadow-sm flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                            <stat.icon size={28} />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-text-main">{stat.value}</div>
                            <div className="text-sm font-bold text-text-muted">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

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