import { RecruiterLayout } from '@/layout/RecruiterLayout';
import { Briefcase, Users, FileText, TrendingUp, Plus } from 'lucide-react';
import { Button } from '@/ui/Button';
import { Link } from 'react-router-dom';

export function DashboardPage() {
    const stats = [
        { title: 'Tin đang tuyển', value: '12', icon: Briefcase, color: 'text-primary', bg: 'bg-blue-50' },
        { title: 'Tổng ứng viên', value: '248', icon: Users, color: 'text-success', bg: 'bg-emerald-50' },
        { title: 'Hồ sơ mới (Tuần này)', value: '45', icon: FileText, color: 'text-warning', bg: 'bg-amber-50' },
        { title: 'Tỷ lệ phản hồi', value: '86%', icon: TrendingUp, color: 'text-primary', bg: 'bg-blue-50' },
    ];

    return (
        <RecruiterLayout>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main">Tổng quan</h1>
                    <p className="text-text-muted mt-1 font-medium">Chào mừng trở lại! Dưới đây là hoạt động tuyển dụng của bạn.</p>
                </div>
                <Link to="/recruiter/jobs/create">
                    <Button className="shrink-0 shadow-sm">
                        <Plus size={18} />
                        Đăng tin mới
                    </Button>
                </Link>
            </div>

            {/* Thẻ Thống kê */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <div key={idx} className="bg-white p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-text-muted text-sm font-semibold mb-1">{stat.title}</p>
                                    <h3 className="text-3xl font-black text-text-main">{stat.value}</h3>
                                </div>
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                                    <Icon size={24} className={stat.color} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Hoạt động gần đây */}
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border flex justify-between items-center">
                    <h2 className="text-xl font-bold text-text-main">Hồ sơ ứng tuyển mới nhất</h2>
                    <Link to="/recruiter/candidates" className="text-primary font-semibold text-sm hover:underline">Xem tất cả</Link>
                </div>

                <div className="divide-y divide-border">
                    {[1, 2, 3].map((_, idx) => (
                        <div key={idx} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center font-bold text-text-main">
                                    NV
                                </div>
                                <div>
                                    <h4 className="font-bold text-text-main">Nguyễn Văn {['A', 'B', 'C'][idx]}</h4>
                                    <p className="text-sm text-text-muted font-medium">Ứng tuyển: Senior Frontend Developer</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-warning-light/50 text-warning text-xs font-bold rounded-full border border-warning/20">
                                    Chờ đánh giá
                                </span>
                                <Button variant="outline" className="py-1.5 px-3 text-sm">Xem CV</Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </RecruiterLayout>
    );
}