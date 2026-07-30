import { Logo } from '@/ui/Logo';

// Vấn đề: Login/Register/ForgotPassword đều cần cùng một khung 2-cột (form trái + branding phải), copy mỗi trang vừa nặng vừa khó đồng bộ design.
// Giải pháp: AuthLayout chung để các trang auth chỉ render form ở children, vế phải là decor chỉ hiện trên màn hình lớn.
export function AuthLayout({ children }) {
    return (
        <div className="min-h-screen flex bg-background">
            {/* Left Form Section */}
            <div className="flex-1 flex flex-col justify-center px-6 sm:px-16 lg:px-24 relative z-10">
                <div className="w-full max-w-[400px] mx-auto">
                    {/* ✅ Đã dùng component Logo và truyền margin-bottom */}
                    <Logo className="mb-10" />

                    {/* Form sẽ được render ở đây */}
                    {children}
                </div>
            </div>

            {/* Right Decor Section */}
            <div className="hidden lg:flex flex-1 bg-primary-light relative overflow-hidden flex-col items-center justify-center">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-white/40"></div>
                <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] rounded-full bg-primary/10"></div>

                <div className="relative z-10 max-w-md text-center px-8">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-8 text-primary">
                        {/* Icon Briefcase */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-extrabold text-primary-hover mb-4 leading-tight">Tuyển dụng thông minh</h2>
                    <p className="text-primary-hover/80 text-lg font-medium">Đơn giản hóa quy trình tìm kiếm và quản lý nhân tài của bạn trên một nền tảng duy nhất.</p>
                </div>
            </div>
        </div>
    );
}