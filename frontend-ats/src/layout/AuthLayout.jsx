import { Logo } from '@/ui/Logo';

// Vấn đề: Login/Register/ForgotPassword đều cần cùng một khung 2 cột (form trái + thông tin phải),
// copy mỗi trang vừa nặng vừa khó đồng bộ design.
// Giải pháp: AuthLayout chung để các trang auth chỉ render form ở children.

// Vấn đề: Cột phải của trang đăng nhập thường bị nhét slogan marketing ("Nâng tầm trải nghiệm",
// "Giải pháp toàn diện") — người dùng đã ở màn đăng nhập thì họ đã biết mình vào đâu, những câu đó
// không cho thêm thông tin nào.
// Giải pháp: Nói đúng ba việc hệ thống làm được, bằng câu mô tả thao tác cụ thể.
const capabilities = [
    {
        title: 'Chấm điểm CV tự động',
        desc: 'Hồ sơ nộp vào được so khớp với mô tả công việc và xếp hạng theo độ phù hợp.',
    },
    {
        title: 'Theo dõi từng vòng tuyển',
        desc: 'Biết mỗi ứng viên đang ở vòng nào và dừng lại ở đó bao lâu.',
    },
    {
        title: 'Phân quyền theo vai trò',
        desc: 'Ứng viên, nhà tuyển dụng và quản trị viên thấy đúng phần dữ liệu của mình.',
    },
];

export function AuthLayout({ children }) {
    return (
        <div className="min-h-screen flex bg-background">
            {/* Cột form */}
            <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
                <div className="w-full max-w-[400px] mx-auto">
                    <Logo className="mb-10" size="lg" />
                    {children}
                </div>
            </div>

            {/* Cột thông tin — chỉ hiện từ lg trở lên.
                Dùng nền phẳng surface + một đường viền trái, không gradient/blob/blur:
                phần này là nội dung phụ, không nên cạnh tranh thị giác với ô đăng nhập. */}
            <aside className="hidden lg:flex flex-1 bg-surface border-l border-border flex-col justify-center px-16">
                <div className="max-w-md">
                    <h2 className="text-2xl font-bold text-text-main">
                        Quản lý tuyển dụng trên một hệ thống
                    </h2>
                    <p className="text-text-muted mt-4 leading-relaxed">
                        Từ lúc đăng tin đến lúc chốt ứng viên, mọi hồ sơ và trạng thái nằm cùng một chỗ.
                    </p>

                    {/* Danh sách đánh số thay vì icon bọc tròn nền tint: số thứ tự hàm ý một quy trình
                        có trình tự, đúng với cách HR thực sự dùng hệ thống. */}
                    <ol className="mt-10 space-y-8">
                        {capabilities.map(({ title, desc }, i) => (
                            <li key={title} className="flex gap-4">
                                <span className="text-sm font-semibold text-text-subtle tabular-nums pt-0.5 shrink-0">
                                    {String(i + 1).padStart(2, '0')}
                                </span>
                                <div className="border-l border-border pl-4">
                                    <div className="font-semibold text-text-main">{title}</div>
                                    <div className="text-sm text-text-muted mt-1 leading-relaxed">{desc}</div>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            </aside>
        </div>
    );
}
