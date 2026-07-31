import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/ui/Button';
import { Badge } from '@/ui/Badge';
import { Logo } from '@/ui/Logo';
import { FileText, Gauge, ListFilter, ShieldCheck, ClipboardList, ArrowRight } from 'lucide-react';

// Vấn đề: Trang công khai thường bị nhét slogan ("nền tảng thế hệ mới", "giải pháp toàn diện").
// Người đọc đang cân nhắc có đăng ký hay không, mà những câu đó không trả lời được câu hỏi duy
// nhất họ có: hệ thống này LÀM ĐƯỢC GÌ. Cùng lý do đã ghi ở AuthLayout.
// Giải pháp: mỗi câu trên trang mô tả một thao tác hệ thống thật sự chạy. Không câu nào nói về
// cảm giác khi dùng.
//
// Ba việc hệ thống làm, xếp theo thứ tự người dùng gặp phải chứ không theo mức độ "ấn tượng".
const capabilities = [
    {
        icon: ListFilter,
        title: 'Lọc hồ sơ theo điểm khớp',
        desc: 'Nhà tuyển dụng lọc danh sách ứng viên theo điểm, theo tên, hoặc theo trạng thái xử lý của đơn.',
    },
    {
        icon: ShieldCheck,
        title: 'Kiểm duyệt tin trước khi hiển thị',
        desc: 'Tin tuyển dụng phải qua quản trị viên duyệt rồi mới xuất hiện trong kết quả tìm việc của ứng viên.',
    },
    {
        icon: ClipboardList,
        title: 'Theo dõi từng đơn đã nộp',
        desc: 'Ứng viên xem được đơn của mình đang ở trạng thái nào, không phải chờ email báo lại.',
    },
];

export function LandingPage() {
    const { user, loading } = useAuth();

    // Vấn đề: User đã login mà vẫn vào "/" sẽ thấy landing với CTA "đăng ký" — UX rất kỳ; hardcode redirect 1 chỗ thì khó mở rộng.
    // Giải pháp: Map role → home URL, chờ loading xong mới Navigate (replace để không đẩy "/" vào history).
    if (!loading && user) {
        const home = { candidate: '/candidate/jobs', recruiter: '/recruiter/dashboard', admin: '/admin/dashboard' };
        return <Navigate to={home[user.role] || '/login'} replace />;
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Nền trắng đặc, không bán trong + backdrop-blur: cùng lý do đã ghi ở DashboardShell —
                nội dung cuộn qua dưới lớp mờ vẫn đọc loáng thoáng được và làm chữ trên header mất
                tương phản. Phân vùng bằng viền dưới 1px. */}
            <header className="h-16 shrink-0 bg-background border-b border-border sticky top-0 z-20">
                <div className="max-w-content mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
                    {/* size="sm" chứ không phải mặc định md: ở 375px, logo md cộng link cộng nút vừa
                        đúng tràn khỏi 343px bề ngang còn lại. Đây cũng là cỡ DashboardShell dùng cho
                        header cùng chiều cao 64px, nên hai header khớp nhau. */}
                    <Logo size="sm" />
                    {/* Một hành động chính duy nhất được tô màu. "Đăng nhập" là lối vào của người đã
                        có tài khoản — họ đi tìm nó chứ không cần được mời, nên để dạng link văn bản.
                        Hai nút tô màu cạnh nhau sẽ buộc người mới phải đọc cả hai mới biết bấm cái nào. */}
                    <div className="flex items-center gap-4">
                        <Link
                            to="/login"
                            className="text-sm font-medium text-text-muted hover:text-text-main transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        >
                            Đăng nhập
                        </Link>
                        <Link to="/register" className="rounded-lg focus-visible:outline-none">
                            <Button size="sm">Tạo tài khoản</Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {/* Bố cục 7/5 lệch trái thay vì hero căn giữa. Căn giữa buộc mắt về đường trục và mọi
                    thứ có tầm quan trọng ngang nhau; ở đây có thứ tự đọc thật: đọc hệ thống làm gì
                    (trái) rồi mới nhìn kết quả nó trả ra trông thế nào (phải). Lệch trái giữ nguyên
                    mép chữ để mắt không phải nhảy lại tìm đầu dòng ở mỗi khối. */}
                <section className="border-b border-border">
                    <div className="max-w-content mx-auto px-4 sm:px-6 py-12 sm:py-20">
                        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-start">
                            <div className="lg:col-span-7">
                                {/* 28px là bậc lớn nhất của thang chữ, dùng đúng ở đây chứ không phóng to
                                    hơn: phân cấp trên trang này tạo bằng cân nặng và màu. */}
                                <h1 className="text-2xl font-bold text-text-main">
                                    Mỗi CV nộp vào được chấm điểm theo đúng tin bạn đăng
                                </h1>
                                <p className="mt-4 text-base text-text-muted leading-relaxed max-w-xl">
                                    Hệ thống đọc file PDF ứng viên nộp, so khớp nội dung với mô tả công việc,
                                    rồi trả về một điểm từ 0 đến 100 kèm hai danh sách: kỹ năng khớp và kỹ năng
                                    còn thiếu. Nhà tuyển dụng lọc hồ sơ theo điểm đó thay vì mở lần lượt từng file.
                                </p>

                                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                                    <Link to="/register" className="rounded-lg focus-visible:outline-none">
                                        <Button size="lg">
                                            Tạo tài khoản <ArrowRight size={18} aria-hidden="true" />
                                        </Button>
                                    </Link>
                                    <span className="text-sm text-text-muted">
                                        Đã có tài khoản?{' '}
                                        <Link
                                            to="/login"
                                            className="font-medium text-primary hover:text-primary-hover hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                        >
                                            Đăng nhập
                                        </Link>
                                    </span>
                                </div>
                            </div>

                            {/* Cột phải là MỘT MẪU kết quả chấm điểm, không phải hình trang trí. Mô tả bằng
                                lời "trả về điểm kèm kỹ năng khớp/thiếu" vẫn trừu tượng cho tới khi nhìn thấy
                                nó ra hình gì — nên thứ đặt cạnh đoạn văn là chính cái đang được nói tới. */}
                            <div className="lg:col-span-5 w-full">
                                <div className="border border-border rounded-lg bg-surface-raised">
                                    <div className="px-4 py-3 border-b border-border-subtle">
                                        <div className="section-label">Kết quả chấm điểm</div>
                                        <div className="text-sm font-semibold text-text-main mt-1">
                                            Lập trình viên Backend
                                        </div>
                                    </div>

                                    <div className="px-4 py-4 border-b border-border-subtle flex items-baseline gap-2">
                                        <span className="text-2xl font-bold text-text-main tabular-nums">82</span>
                                        <span className="text-sm text-text-subtle">/ 100 điểm khớp</span>
                                    </div>

                                    <div className="px-4 py-4 space-y-3">
                                        {/* Màu success dùng đúng một lần, cho danh sách mang nghĩa "đạt". Nhóm
                                            còn thiếu để trung tính — tô cả hai bằng màu ngữ nghĩa thì màu hết
                                            phân biệt được điều gì. Nhãn chữ mới là thứ nói nghĩa, không phải màu. */}
                                        <div>
                                            <div className="text-xs text-text-subtle mb-1.5">Kỹ năng khớp</div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {['Node.js', 'MongoDB', 'REST API'].map((s) => (
                                                    <Badge key={s} variant="success">{s}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-text-subtle mb-1.5">Kỹ năng còn thiếu</div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {['Docker', 'Redis'].map((s) => (
                                                    <Badge key={s}>{s}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <p className="mt-2 text-xs text-text-subtle">Ví dụ minh họa kết quả hệ thống trả về.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Khối chấm điểm chiếm 7/12 và có nội dung dày hơn hẳn ba mục còn lại vì đây là việc
                    duy nhất hệ thống làm mà một thư mục email không làm được. Ba mục kia là thao tác
                    quản lý thông thường — cho chúng cùng kích thước với nó là nói dối về mức quan trọng. */}
                <section className="max-w-content mx-auto px-4 sm:px-6 py-12 sm:py-16">
                    <h2 className="text-lg font-bold text-text-main">Hệ thống làm những việc này</h2>

                    <div className="mt-6 grid lg:grid-cols-12 gap-4">
                        <div className="lg:col-span-7 border border-border rounded-lg bg-surface-raised p-5 sm:p-6">
                            <div className="flex items-center gap-2">
                                <Gauge size={18} className="text-primary shrink-0" aria-hidden="true" />
                                <h3 className="text-base font-semibold text-text-main">Chấm điểm hồ sơ theo mô tả công việc</h3>
                            </div>
                            <p className="mt-2.5 text-sm text-text-muted leading-relaxed">
                                Đây là việc chạy tự động mỗi khi có hồ sơ mới nộp vào một tin tuyển dụng.
                            </p>

                            {/* Đánh số thay vì icon bọc tròn: ba bước này có TRÌNH TỰ, số thứ tự nói ra điều
                                đó còn ba hình tròn giống nhau thì không. Cùng cách đã dùng ở AuthLayout. */}
                            <ol className="mt-5 space-y-4">
                                {[
                                    ['Trích xuất', 'Đọc file PDF ứng viên tải lên và lấy ra phần văn bản bên trong.'],
                                    ['So khớp', 'Đối chiếu văn bản đó với mô tả công việc của tin tuyển dụng.'],
                                    ['Chấm điểm', 'Trả về điểm 0–100, kèm danh sách kỹ năng khớp và kỹ năng còn thiếu.'],
                                ].map(([step, detail], i) => (
                                    <li key={step} className="flex gap-3.5">
                                        <span className="text-sm font-semibold text-text-subtle tabular-nums pt-0.5 shrink-0">
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                        <div className="border-l border-border pl-3.5">
                                            <div className="text-sm font-semibold text-text-main">{step}</div>
                                            <div className="text-sm text-text-muted mt-0.5 leading-relaxed">{detail}</div>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </div>

                        {/* Ba mục phụ dùng dạng DANH SÁCH chia bằng viền, không phải ba thẻ rời. Khác cả
                            hình thức lẫn kích thước so với khối bên trái, nên không đọc nhầm thành ngang hàng. */}
                        <div className="lg:col-span-5 border border-border rounded-lg bg-surface-raised divide-y divide-border-subtle">
                            {capabilities.map(({ icon: Icon, title, desc }) => (
                                <div key={title} className="p-5">
                                    <div className="flex items-center gap-2">
                                        <Icon size={16} className="text-text-subtle shrink-0" aria-hidden="true" />
                                        <h3 className="text-sm font-semibold text-text-main">{title}</h3>
                                    </div>
                                    <p className="mt-1.5 text-sm text-text-muted leading-relaxed">{desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Định dạng file là ràng buộc người dùng cần biết TRƯỚC khi đăng ký, không phải sau
                        khi đã tạo tài khoản rồi mới phát hiện file .docx của mình không nộp được. */}
                    <p className="mt-6 flex items-center gap-2 text-sm text-text-subtle">
                        <FileText size={16} className="shrink-0" aria-hidden="true" />
                        Hồ sơ nộp vào phải ở định dạng PDF.
                    </p>
                </section>
            </main>

            <footer className="border-t border-border">
                <div className="max-w-content mx-auto px-4 sm:px-6 py-8">
                    <p className="text-sm text-text-subtle">© 2026 Mini ATS</p>
                </div>
            </footer>
        </div>
    );
}
