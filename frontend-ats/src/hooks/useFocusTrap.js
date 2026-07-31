import { useEffect } from 'react';

// Thứ tự Tab của trình duyệt không biết gì về lớp phủ: nó vẫn đi tiếp xuống nội dung nằm dưới
// overlay. Người dùng bàn phím Tab vài nhịp là con trỏ biến mất vào phần trang đang bị che, focus
// ring nằm sau lớp mờ nên không thấy, và không có cách nào quay lại ngoài Shift+Tab mò ngược.
const FOCUSABLE = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Giữ focus bên trong một lớp phủ (modal, drawer) suốt thời gian nó mở.
 *
 * Gom từ ConfirmDialog — nơi logic này ra đời — để drawer mobile dùng chung thay vì chép lại.
 * Hai chỗ dùng có một khác biệt đáng kể nên hook nhận `initialFocusRef`:
 *   - ConfirmDialog cố tình focus nút HỦY chứ không phải nút đầu tiên: hộp thoại đó hỏi trước một
 *     thao tác xóa không hoàn tác được, để mặc định vào nút Xóa thì một phím Enter theo quán tính
 *     là mất dữ liệu.
 *   - Drawer điều hướng không có hành động phá hủy nào nên lấy phần tử focus được đầu tiên.
 *
 * @param {Object}  options
 * @param {boolean} options.active            - Lớp phủ đang mở hay không
 * @param {React.RefObject} options.containerRef - Khung bao lớp phủ
 * @param {() => void} [options.onEscape]     - Gọi khi bấm Esc
 * @param {React.RefObject} [options.initialFocusRef] - Phần tử nhận focus đầu tiên; bỏ trống thì lấy phần tử đầu
 * @param {boolean} [options.lockScroll=true] - Khóa cuộn nền phía sau
 */
export function useFocusTrap({
    active,
    containerRef,
    onEscape,
    initialFocusRef,
    lockScroll = true,
}) {
    useEffect(() => {
        if (!active) return;

        const node = containerRef.current;
        if (!node) return;

        // Ghi lại phần tử đang focus TRƯỚC khi lớp phủ mở, để lúc đóng trả con trỏ về đúng chỗ cũ.
        // Không có bước này thì đóng drawer xong focus rơi về <body> và người dùng phải Tab lại từ
        // đầu trang — với sidebar hơn chục mục thì đó là hơn chục nhịp Tab vô ích.
        const previouslyFocused = document.activeElement;

        const getFocusable = () => Array.from(node.querySelectorAll(FOCUSABLE));

        if (initialFocusRef?.current) {
            initialFocusRef.current.focus();
        } else {
            getFocusable()[0]?.focus();
        }

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onEscape?.();
                return;
            }
            if (e.key !== 'Tab') return;

            const items = getFocusable();
            if (items.length === 0) return;
            const first = items[0];
            const last = items[items.length - 1];

            // Chỉ can thiệp ở hai đầu vòng: ở giữa cứ để trình duyệt tự đi cho đúng thứ tự tự nhiên.
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        let previousOverflow;
        if (lockScroll) {
            previousOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            if (lockScroll) document.body.style.overflow = previousOverflow;
            if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
        };
    }, [active, containerRef, onEscape, initialFocusRef, lockScroll]);
}
