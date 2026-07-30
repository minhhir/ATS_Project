import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/ui/Button';
import { Logo } from '@/ui/Logo';
import { ArrowRight, Briefcase, Users, Zap, CheckCircle2 } from 'lucide-react';

// Vấn đề: User đã login mà vẫn vào "/" sẽ thấy landing với CTA "đăng ký" — UX rất kỳ; hardcode redirect 1 chỗ thì khó mở rộng.
// Giải pháp: Map role → home URL, chờ loading xong mới Navigate (replace để không đẩy "/" vào history).
export function LandingPage() {
    const { user, loading } = useAuth();

    if (!loading && user) {
        const home = { candidate: '/candidate/jobs', recruiter: '/recruiter/dashboard', admin: '/admin/dashboard' };
        return <Navigate to={home[user.role] || '/login'} replace />;
    }

    return (
        <div className="min-h-screen bg-surface flex flex-col font-sans">
            {/* Navbar Public */}
            <header className="bg-white/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Logo />
                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-sm font-bold text-text-main hover:text-primary transition-colors">
                            Đăng nhập
                        </Link>
                        <Link to="/register">
                            <Button className="py-2 text-sm shadow-sm">Tham gia ngay</Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-1">
                <section className="relative overflow-hidden bg-white pt-16 pb-24 sm:pt-24 sm:pb-32 border-b border-border">
                    <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3">
                        <div className="w-[600px] h-[600px] bg-primary-light/50 rounded-full blur-3xl"></div>
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                        <h1 className="text-4xl sm:text-6xl font-black text-text-main tracking-tight mb-6">
                            Nền tảng tuyển dụng <br className="hidden sm:block" />
                            <span className="text-primary">thông minh thế hệ mới</span>
                        </h1>
                        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-text-muted font-medium mb-10 leading-relaxed">
                            Kết nối ứng viên tài năng với các doanh nghiệp hàng đầu. Tích hợp AI hỗ trợ phân tích hồ sơ và tối ưu hóa quy trình tuyển dụng của bạn.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link to="/register">
                                <Button className="w-full sm:w-auto px-8 py-3.5 text-base h-auto">
                                    <Briefcase className="mr-2" size={20} /> Tìm việc ngay
                                </Button>
                            </Link>
                            <Link to="/register">
                                <Button variant="outline" className="w-full sm:w-auto px-8 py-3.5 text-base h-auto bg-white">
                                    <Users className="mr-2" size={20} /> Đăng tin tuyển dụng
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-20 bg-surface">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-extrabold text-text-main">Tại sao chọn Mini ATS?</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { icon: Zap, title: 'Chấm điểm bằng AI', desc: 'Hệ thống tự động đọc hiểu CV và đánh giá mức độ phù hợp với tin tuyển dụng chỉ trong vài giây.', color: 'text-warning', bg: 'bg-amber-50' },
                                { icon: Users, title: 'Quản lý tập trung', desc: 'Không còn phải duyệt CV qua email. Quản lý trạng thái hàng ngàn ứng viên trên một bảng điều khiển duy nhất.', color: 'text-primary', bg: 'bg-blue-50' },
                                { icon: CheckCircle2, title: 'Trải nghiệm mượt mà', desc: 'Giao diện tối giản, tốc độ phản hồi cực nhanh, đem lại trải nghiệm tuyệt vời cho cả HR và Ứng viên.', color: 'text-success', bg: 'bg-emerald-50' }
                            ].map((item, idx) => {
                                const Icon = item.icon;
                                return (
                                    <div key={idx} className="bg-white p-8 rounded-3xl border border-border shadow-sm hover:shadow-md transition-shadow">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${item.bg}`}>
                                            <Icon size={28} className={item.color} />
                                        </div>
                                        <h3 className="text-xl font-bold text-text-main mb-3">{item.title}</h3>
                                        <p className="text-text-muted font-medium leading-relaxed">{item.desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer Public */}
            <footer className="bg-white border-t border-border py-12">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <Logo className="justify-center mb-4" />
                    <p className="text-text-muted text-sm font-medium">© 2026 Mini ATS Inc. Nền tảng tuyển dụng thông minh.</p>
                </div>
            </footer>
        </div>
    );
}