import { useParams, Link } from 'react-router-dom';
import { CandidateLayout } from '@/layout/CandidateLayout';
import { Button } from '@/ui/Button';
import { MapPin, DollarSign, Clock, Building, ChevronLeft, Send } from 'lucide-react';

export function JobDetailPage() {
    const { id } = useParams();

    // Dữ liệu giả lập
    const job = {
        id, title: 'Senior Frontend Developer (React)', company: 'TechNova Solutions',
        location: 'Hà Nội', salary: '1500$ - 2500$', type: 'Toàn thời gian', level: 'Senior',
        description: 'Chúng tôi đang tìm kiếm một Senior Frontend Developer có kinh nghiệm sâu rộng về React, Tailwind CSS và kiến trúc Frontend hiện đại. Bạn sẽ làm việc trực tiếp với đội ngũ Product để xây dựng các trải nghiệm người dùng tuyệt vời.',
        requirements: ['Ít nhất 3 năm kinh nghiệm làm việc với React.js', 'Thành thạo JavaScript/TypeScript, HTML5, CSS3', 'Có kinh nghiệm với hệ thống quản lý state (Redux, Zustand hoặc React Context)', 'Hiểu biết sâu về RESTful API và cách tối ưu hiệu năng Web'],
        benefits: ['Lương tháng 13 + Thưởng hiệu suất', 'Bảo hiểm sức khỏe cao cấp (PVI)', 'Trang bị Macbook Pro M3', 'Môi trường làm việc linh hoạt (Hybrid)']
    };

    return (
        <CandidateLayout>
            <Link to="/jobs" className="inline-flex items-center gap-2 text-text-muted hover:text-primary font-bold mb-6 transition-colors">
                <ChevronLeft size={20} />
                Quay lại danh sách
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Header Card */}
                    <div className="bg-white rounded-3xl p-8 border border-border shadow-sm">
                        <h1 className="text-3xl font-black text-text-main mb-4">{job.title}</h1>
                        <div className="flex flex-wrap items-center gap-6 mb-6">
                            <div className="flex items-center gap-2 text-text-muted font-medium">
                                <Building size={18} className="text-primary" />
                                <span className="text-lg">{job.company}</span>
                            </div>
                            <div className="flex items-center gap-2 text-text-muted font-medium">
                                <MapPin size={18} className="text-primary" />
                                <span>{job.location}</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 py-6 border-y border-border">
                            <div className="flex-1 min-w-[120px]">
                                <div className="text-sm text-text-muted font-semibold mb-1">Mức lương</div>
                                <div className="text-success font-bold flex items-center gap-1"><DollarSign size={18} />{job.salary}</div>
                            </div>
                            <div className="flex-1 min-w-[120px]">
                                <div className="text-sm text-text-muted font-semibold mb-1">Hình thức</div>
                                <div className="text-text-main font-bold flex items-center gap-1"><Clock size={18} />{job.type}</div>
                            </div>
                            <div className="flex-1 min-w-[120px]">
                                <div className="text-sm text-text-muted font-semibold mb-1">Cấp bậc</div>
                                <div className="text-text-main font-bold flex items-center gap-1"><User size={18} />{job.level}</div>
                            </div>
                        </div>
                    </div>

                    {/* Job Details Card */}
                    <div className="bg-white rounded-3xl p-8 border border-border shadow-sm space-y-8">
                        <section>
                            <h3 className="text-xl font-extrabold text-text-main mb-4">Mô tả công việc</h3>
                            <p className="text-text-muted leading-relaxed font-medium">{job.description}</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-extrabold text-text-main mb-4">Yêu cầu ứng viên</h3>
                            <ul className="space-y-3">
                                {job.requirements.map((req, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-text-muted font-medium">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0"></div>
                                        {req}
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-extrabold text-text-main mb-4">Quyền lợi</h3>
                            <ul className="space-y-3">
                                {job.benefits.map((ben, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-text-muted font-medium">
                                        <div className="mt-1 w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0 text-sm">✓</div>
                                        {ben}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl p-6 border border-border shadow-sm sticky top-24">
                        <h3 className="text-lg font-extrabold text-text-main mb-2">Sẵn sàng gia nhập?</h3>
                        <p className="text-text-muted text-sm font-medium mb-6">Gửi CV của bạn ngay hôm nay để không bỏ lỡ cơ hội này.</p>
                        <Button className="w-full py-3.5 text-base rounded-xl">
                            <Send size={18} />
                            Ứng tuyển ngay
                        </Button>

                        <div className="mt-6 pt-6 border-t border-border">
                            <h4 className="font-bold text-text-main mb-4">Về công ty</h4>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-surface rounded-xl flex items-center justify-center font-black text-primary">
                                    TN
                                </div>
                                <div>
                                    <div className="font-bold text-text-main">{job.company}</div>
                                    <div className="text-sm text-text-muted font-medium">Công nghệ & Phần mềm</div>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full text-sm">Xem hồ sơ công ty</Button>
                        </div>
                    </div>
                </div>
            </div>
        </CandidateLayout>
    );
}