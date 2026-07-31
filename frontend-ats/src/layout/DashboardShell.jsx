import { useState, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { Logo } from '@/ui/Logo';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { useFocusTrap } from '@/hooks/useFocusTrap';

// Vấn đề: RecruiterLayout, CandidateLayout và AdminLayout gần như trùng nhau 100% (sidebar, drawer mobile, header, khung content).
// Ba bản sao này đã bắt đầu lệch nhau — Admin dùng rounded-xl/font-bold còn hai layout kia rounded-lg/font-semibold — và mọi sửa lỗi
// đều phải làm 3 lần.
// Giải pháp: Gom phần khung vào DashboardShell; ba layout chỉ còn khai báo dữ liệu riêng của mình (menu, nhãn, khối user).

/**
 * @param {Object} props
 * @param {{name: string, path: string, icon: React.ElementType}[]} props.navItems
 * @param {string} props.sectionLabel - Nhãn nhóm menu, cũng là cách phân biệt 3 khu vực HR/ứng viên/admin
 * @param {React.ReactNode} props.userSlot - Khối thông tin người dùng ở đáy sidebar, mỗi vai trò hiển thị khác nhau
 * @param {() => void} props.onLogout
 * @param {boolean} props.showNotifications - Admin không cần chuông thông báo
 * @param {string} props.contentClassName - Ghi đè bề rộng tối đa vùng nội dung
 * @param {'comfortable'|'default'|'compact'} props.density - Mật độ theo loại việc của vai trò
 */

// Ba vai trò phải phân biệt được, nhưng phân biệt bằng MẬT ĐỘ và CẤU TRÚC — không đổi màu chủ
// đạo cho từng role. Đổi màu theo role sẽ phá vỡ nguyên tắc "một accent duy nhất" và khiến màu
// accent mất nghĩa "đây là hành động chính".
// Ứng viên đọc mô tả công việc (văn xuôi) → dòng menu cao hơn, nội dung hẹp hơn cho dễ đọc.
// HR/admin quét bảng dữ liệu → dòng menu thấp, nội dung rộng để chứa nhiều cột.
const densities = {
    comfortable: { main: 'density-comfortable', navRow: 'h-11', navGap: 'space-y-1.5' },
    default: { main: 'density-default', navRow: 'h-11', navGap: 'space-y-1' },
    compact: { main: 'density-compact', navRow: 'h-10', navGap: 'space-y-0.5' },
};

export function DashboardShell({
    navItems,
    sectionLabel,
    userSlot,
    onLogout,
    showNotifications = true,
    contentClassName = 'max-w-6xl',
    density = 'default',
    children,
}) {
    const d = densities[density] ?? densities.default;
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    // Vấn đề: `pathname.includes(path)` khớp cả những route chỉ tình cờ chứa chuỗi đó, dễ sáng cùng lúc 2 menu.
    // Giải pháp: So khớp chính xác path hoặc path kèm dấu "/" để chỉ nhận đúng route con.
    const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);
    const activeItem = navItems.find((item) => isActive(item.path));

    // Vấn đề: Drawer mobile chỉ đóng khi bấm link; bấm nút Back của trình duyệt thì drawer vẫn nằm đè lên trang mới.
    // Giải pháp: So path lúc mở với path hiện tại ngay trong lúc render và reset — đây là cách React khuyến nghị cho
    // state "phái sinh từ prop/route" (useEffect + setState sẽ render thừa một lượt và bị eslint chặn).
    const [openedAtPath, setOpenedAtPath] = useState(location.pathname);
    if (mobileOpen && openedAtPath !== location.pathname) {
        setMobileOpen(false);
        setOpenedAtPath(location.pathname);
    }

    // Vấn đề: Khi drawer mở, nền phía sau vẫn cuộn được nên người dùng vuốt là mất nội dung đang xem;
    // không đóng được bằng phím Esc; và Tab đi thẳng xuống nội dung nằm dưới lớp phủ — focus biến mất
    // sau lớp mờ mà người dùng không thấy con trỏ đang ở đâu.
    // Giải pháp: useFocusTrap lo cả ba việc (khóa cuộn, Esc, giữ focus trong drawer) và trả focus về
    // nút mở khi đóng. Cùng hook với ConfirmDialog nên hai lớp phủ hành xử giống nhau.
    const drawerRef = useRef(null);
    // useCallback: onEscape nằm trong deps của hook, hàm mới mỗi lần render sẽ gỡ/gắn lại listener liên tục.
    const closeDrawer = useCallback(() => setMobileOpen(false), []);

    useFocusTrap({
        active: mobileOpen,
        containerRef: drawerRef,
        onEscape: closeDrawer,
    });

    const sidebarContent = (
        <>
            <div className="h-16 flex items-center justify-between px-5 border-b border-border shrink-0">
                <Logo size="sm" />
                <button
                    onClick={() => setMobileOpen(false)}
                    className="md:hidden p-1.5 rounded-lg text-text-muted hover:bg-surface hover:text-text-main transition-colors"
                    aria-label="Đóng menu"
                >
                    <X size={20} />
                </button>
            </div>

            <nav className={clsx('flex-1 overflow-y-auto py-5 px-3', d.navGap)} aria-label={sectionLabel}>
                <div className="section-label px-2 mb-3">{sectionLabel}</div>
                {navItems.map((item) => {
                    const active = isActive(item.path);
                    const Icon = item.icon;
                    return (
                        // Mục đang chọn dùng nền trung tính + chữ đậm lên, accent chỉ còn một
                        // vạch 2px bên trái. Tô cả ô bằng màu accent sẽ khiến sidebar cạnh tranh
                        // thị giác với nút hành động chính trong nội dung — accent phải để dành
                        // cho thứ người dùng cần bấm, không phải thứ cho biết họ đang ở đâu.
                        <Link
                            key={item.path}
                            to={item.path}
                            aria-current={active ? 'page' : undefined}
                            className={clsx(
                                'relative flex items-center gap-3 pl-3 pr-3 rounded-sm text-sm transition-colors duration-200 ease-smooth',
                                d.navRow,
                                active
                                    ? 'bg-surface-sunken text-text-main font-semibold'
                                    : 'text-text-muted font-medium hover:bg-surface hover:text-text-main',
                            )}
                        >
                            {active && (
                                <span
                                    aria-hidden="true"
                                    className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary"
                                />
                            )}
                            <Icon size={18} className={clsx('shrink-0', active ? 'text-text-main' : 'text-text-subtle')} />
                            <span className="truncate">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-3 border-t border-border shrink-0">
                {userSlot}
                <button
                    onClick={onLogout}
                    className="flex items-center gap-3 w-full px-3 h-10 mt-1 text-sm font-semibold text-danger rounded-lg hover:bg-danger-50 transition-colors"
                >
                    <LogOut size={18} className="shrink-0" /> Đăng xuất
                </button>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-surface">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-sidebar bg-white border-r border-border fixed inset-y-0 left-0 z-20">
                {sidebarContent}
            </aside>

            {/* Mobile Sidebar */}
            {mobileOpen && (
                <div className="md:hidden">
                    <div
                        className="fixed inset-0 bg-neutral-900/50 z-30 animate-in fade-in duration-200"
                        onClick={() => setMobileOpen(false)}
                    />
                    <aside
                        ref={drawerRef}
                        className="fixed left-0 inset-y-0 w-sidebar bg-white border-r border-border z-40 flex flex-col shadow-xl animate-in slide-in-from-left duration-300"
                        role="dialog"
                        aria-modal="true"
                        aria-label={sectionLabel}
                    >
                        {sidebarContent}
                    </aside>
                </div>
            )}

            {/* Main Content */}
            <div className="md:ml-sidebar flex flex-col min-h-screen">
                {/* Vấn đề: Trước đây header chỉ có ở mobile nên trên desktop không có chỗ đặt chuông thông báo,
                    khiến NotificationBell viết xong mà không màn hình nào dùng tới.
                    Giải pháp: Header dùng chung cho mọi kích thước; tiêu đề lấy từ menu đang active nên không cần trang con truyền vào. */}
                {/* Header dùng nền trắng đặc, không bán trong + backdrop-blur: nội dung cuộn qua dưới
                    lớp mờ vẫn đọc loáng thoáng được và làm chữ trên header mất tương phản. */}
                <header className="h-16 shrink-0 bg-white border-b border-border sticky top-0 z-20 flex items-center justify-between gap-3 px-4 sm:px-6">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={() => {
                                // Ghi lại path lúc mở để lần điều hướng kế tiếp (kể cả bằng nút Back) tự đóng drawer.
                                setOpenedAtPath(location.pathname);
                                setMobileOpen(true);
                            }}
                            className="md:hidden p-2 -ml-2 rounded-lg text-text-muted hover:bg-surface hover:text-text-main transition-colors"
                            aria-label="Mở menu"
                        >
                            <Menu size={22} />
                        </button>
                        <span className="md:hidden">
                            <Logo size="sm" showText={false} />
                        </span>
                        {/* Cố tình KHÔNG dùng <h1>: mỗi trang đã có <h1> riêng, thêm một cái nữa sẽ tạo hai tiêu đề cấp 1
                            và screen reader đọc trùng. Ở đây chỉ là nhãn định vị "đang ở mục nào". */}
                        <span className="text-sm font-semibold text-text-muted truncate">
                            {activeItem?.name}
                        </span>
                    </div>

                    {showNotifications && <NotificationBell />}
                </header>

                <main className={clsx('flex-1 w-full mx-auto', d.main, contentClassName)}>
                    {children}
                </main>
            </div>
        </div>
    );
}
