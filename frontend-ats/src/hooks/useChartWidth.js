import { useState, useRef, useLayoutEffect } from 'react';

/**
 * Đo bề rộng thật của khung chứa biểu đồ.
 *
 * Vấn đề: hai biểu đồ SVG đang dùng viewBox cố định 760 đơn vị rồi để `w-full` co lại vừa khung.
 * Trên máy tính khung rộng ~700px nên tỉ lệ gần 1:1 và mọi thứ đúng cỡ. Nhưng ở màn 375px, sau
 * padding trang và padding card chỉ còn ~303px — tỉ lệ tụt xuống 0.399, nên fontSize 12 trong
 * viewBox render ra 4.8px thật. Nhãn trục và số trên đầu cột không đọc được nữa.
 *
 * Giải pháp: đo bề rộng thật rồi đặt viewBox đúng bằng số đó, tức 1 đơn vị SVG = 1 pixel CSS.
 * Không còn phép co nào nữa nên fontSize 12 luôn ra đúng 12px ở mọi khổ màn hình. Cách này còn
 * cho biểu đồ biết nó đang rộng bao nhiêu để tự giảm mật độ nhãn — thứ mà chỉ phóng to cỡ chữ
 * không giải quyết được: chữ to hơn trong khung hẹp thì chồng lên nhau, chỉ đổi lỗi này lấy lỗi kia.
 *
 * Dùng useLayoutEffect để đo xong trước lượt sơn đầu tiên, tránh biểu đồ nháy một nhịp ở bề rộng
 * mặc định rồi mới nhảy sang bề rộng đúng.
 *
 * @param {number} fallback - Bề rộng dùng khi chưa đo được (SSR, hoặc trình duyệt không có ResizeObserver)
 * @returns {[React.RefObject, number]} ref gắn vào khung chứa, và bề rộng đo được
 */
export function useChartWidth(fallback = 760) {
    const ref = useRef(null);
    const [width, setWidth] = useState(fallback);

    useLayoutEffect(() => {
        const node = ref.current;
        if (!node) return;

        const measure = () => {
            // Math.round: bề rộng phân số làm viewBox và toạ độ lệch nửa pixel, nét kẻ bị mờ.
            const w = Math.round(node.getBoundingClientRect().width);
            if (w > 0) setWidth(w);
        };

        measure();

        if (typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(measure);
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    return [ref, width];
}
