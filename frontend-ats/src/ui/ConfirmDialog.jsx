import { useRef, useId } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

// Vấn đề: window.confirm luôn đặt focus mặc định vào nút OK và không cho can thiệp. Với thao tác
// xóa vĩnh viễn kèm cascade (xóa HR là mất hết tin tuyển dụng của họ), một phím Enter theo quán
// tính là đủ để mất dữ liệu. Nó cũng không style được và chặn cả luồng JS.
// Giải pháp: Dialog riêng, focus mặc định vào HỦY. Muốn xóa thì phải chủ động Tab sang hoặc bấm
// chuột — thêm đúng một hành động có ý thức vào giữa quán tính và hậu quả không hoàn tác được.
export function ConfirmDialog({
    open,
    title = 'Xác nhận',
    message,
    confirmLabel = 'Xóa',
    cancelLabel = 'Hủy',
    onConfirm,
    onCancel,
}) {
    const dialogRef = useRef(null);
    const cancelRef = useRef(null);
    const titleId = useId();
    const descId = useId();

    // Logic trap/restore đã tách sang useFocusTrap để drawer mobile dùng chung.
    // initialFocusRef trỏ nút Hủy chứ không phải nút Xóa — đây là toàn bộ lý do component này tồn tại.
    useFocusTrap({
        active: open,
        containerRef: dialogRef,
        onEscape: onCancel,
        initialFocusRef: cancelRef,
    });

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-neutral-900/50 flex items-center justify-center p-4">
            {/* alertdialog thay vì dialog: đây là cảnh báo cần trả lời ngay, không phải hộp thoại thường */}
            <div
                ref={dialogRef}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descId}
                className="w-full max-w-md rounded-2xl border border-border bg-surface-raised shadow-xl p-5 animate-in fade-in duration-200"
            >
                <div className="flex items-start gap-2.5">
                    <AlertTriangle size={20} className="text-danger shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="min-w-0">
                        <h2 id={titleId} className="text-base font-semibold text-text-main">{title}</h2>
                        <p id={descId} className="text-sm text-text-muted mt-1.5">{message}</p>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-5">
                    <button
                        ref={cancelRef}
                        type="button"
                        onClick={onCancel}
                        className="inline-flex items-center justify-center h-9 px-3 rounded-lg border border-border bg-white text-sm font-semibold text-text-main transition-colors cursor-pointer hover:bg-surface hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="inline-flex items-center justify-center h-9 px-3 rounded-lg bg-danger text-sm font-semibold text-white transition-colors cursor-pointer hover:bg-danger-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40 focus-visible:ring-offset-2"
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
