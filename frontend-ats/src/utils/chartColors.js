/**
 * MÀU BIỂU ĐỒ — nguồn duy nhất
 *
 * Vấn đề: SVG fill/stroke không nhận class Tailwind nên biểu đồ buộc phải dùng hex. Hệ quả là
 * bảng màu tồn tại độc lập ở hai nơi — tailwind.config.js và hex rải trong JSX — và hai bên trôi
 * khỏi nhau. Đó là cách #0284c7 (bước config đã cố ý loại vì chữ trắng đặt lên chỉ đạt 4.10:1)
 * quay lại làm màu mặc định của thanh phễu.
 * Giải pháp: mọi hex của biểu đồ khai báo tại đây, mỗi giá trị ghi kèm tên token trong
 * tailwind.config.js để đối chiếu được. KHÔNG có hex nào ở file này không tra ngược được về config.
 *
 * NGƯỠNG ÁP DỤNG: WCAG 1.4.11 — hình khối mang thông tin phải đạt >= 3:1 so với nền kề (nền trắng
 * của card). Đây là ngưỡng KHÁC với 4.5:1 của văn bản: cung tròn, thanh cột, đường kẻ là hình,
 * không phải chữ. Số trong ngoặc sau mỗi màu là tỉ lệ so với #ffffff.
 *
 * HỆ QUẢ CỦA NGƯỠNG NÀY: thang Sky chỉ còn 4 bước dùng được (600→900). Sky 500 (#0ea5e9) đạt
 * 2.77:1 và mọi bước nhạt hơn còn thấp nữa — 200/300/400 nằm trong khoảng 1.33–2.14:1, tức gần
 * như vô hình trên nền trắng. Vì vậy ramp ở đây có 4 bước chứ không phải 5 như bản cũ: thà ít bước
 * mà bước nào cũng nhìn thấy, còn hơn 5 bước mà hai bước đầu biến mất.
 */

// ─── RAMP CÓ THỨ TỰ ────────────────────────────────────────────────────────────
// Dùng cho đại lượng CÓ THỨ TỰ: phễu tuyển dụng, phân bố điểm AI. Một hue, đậm dần.
// Không đổi hue giữa các bước — đổi hue khiến người đọc tưởng đây là các loại khác nhau
// chứ không phải các mức nối tiếp của cùng một thang.
export const CHART_RAMP = [
    '#0284c7', // primary-600 · 4.10:1 — bước nhạt nhất còn đạt ngưỡng
    '#0369a1', // primary-700 · 5.93:1
    '#075985', // primary-800 · 7.56:1
    '#0c4a6e', // primary-900 · 9.46:1
];

// ─── MÀU NGỮ NGHĨA ─────────────────────────────────────────────────────────────
// CHỈ dùng cho kết cục thật sự có tốt/xấu (đậu / loại / chờ duyệt). Không dùng để phân loại
// trung tính — tô đỏ cho một nhóm dữ liệu bình thường sẽ khiến HR tưởng đang có cảnh báo.
export const CHART_SEMANTIC = {
    success: '#047857', // success-700 · 5.48:1 — đã tuyển, đạt vòng
    warning: '#b45309', // warning-700 · 5.02:1 — chờ duyệt
    danger: '#b91c1c', // danger-700  · 6.47:1 — từ chối, loại
    // "muted" = trạng thái khởi điểm chưa mang phán xét (vd "Đã nộp"). Bản cũ dùng #cbd5e1
    // (neutral-300) chỉ đạt 1.48:1 — cung tròn của trạng thái phổ biến nhất lại là cung không
    // nhìn thấy.
    //
    // LƯU Ý ĐỌC CONFIG: giá trị này KHÔNG nằm trong thang `neutral` mà ở nhóm `border`
    // (tailwind.config.js dòng 151, `border.strong`). Tra trong thang neutral sẽ không thấy.
    // Nó dùng được ở đây không phải vì tiện tay: comment tại chỗ khai báo nói rõ nó tồn tại cho
    // "ranh giới mang thông tin (control cần WCAG 1.4.11)" — đúng điều khoản mà hình khối trong
    // biểu đồ phải tuân theo. Cùng ngưỡng, cùng lý do, nên dùng lại là nhất quán chứ không chắp vá.
    // Đây cũng là bước NHẠT NHẤT trong toàn config còn vượt 3:1; mọi bước xám nhạt hơn đều trượt.
    muted: '#7c8798', // border.strong · 3.64:1
};

// ─── PHÂN LOẠI TRUNG TÍNH ──────────────────────────────────────────────────────
// Dùng cho các nhóm KHÔNG có thứ tự và KHÔNG có tốt/xấu: vai trò người dùng trong donut admin,
// và ba chuỗi của biểu đồ đường (ứng viên mới / tin tuyển dụng / đơn ứng tuyển). Xen kẽ hue
// xanh ↔ xám để hai nhóm cạnh nhau tách được bằng sắc chứ không chỉ bằng độ đậm — dải đạt chuẩn
// đã bị dồn hết về nửa tối nên chênh lệch độ đậm còn rất ít.
//
// Giữ đúng chủ ý của bản redesign: thang xanh đậm dần cộng một mức xám, không dùng 4 hue rời rạc
// (bản cũ có xanh lá và vàng làm màu chuỗi, người đọc tưởng đường vàng nghĩa là "cảnh báo").
//
// VÌ SAO MỘT MẢNG CHỨ KHÔNG PHẢI HAI: bản đầu tách CHART_NEUTRAL cho donut và CHART_LINE cho
// biểu đồ đường, nhưng hai mảng ra giá trị y hệt nhau — cùng bài toán (phân loại trung tính),
// cùng ràng buộc (>= 3:1 trên nền trắng, một họ xanh-xám). Hai mảng trùng nhau chỉ tạo bẫy: sửa
// một bên rồi tưởng bên kia theo.
// KHI NÀO NÊN TÁCH LẠI: khi một loại hình cần ngưỡng khác. Nét đường 2px mảnh hơn cung donut dày
// 28px rất nhiều, nên nếu sau này thêm chuỗi thứ 5 cho line chart mà phải lấy một bước nhạt hơn,
// đó là lúc line cần bảng riêng chặt hơn — chứ không phải tách sẵn để đó.
export const CHART_CATEGORICAL = [
    '#0c4a6e', // primary-900 · 9.46:1 — xanh đậm
    '#0284c7', // primary-600 · 4.10:1 — xanh sáng
    '#64748b', // neutral-500 · 4.76:1 — xám trung
    '#475569', // neutral-600 · 7.58:1 — xám đậm (thay #94a3b8, vốn chỉ 2.56:1)
];

// ─── PHẦN KHUNG CỦA BIỂU ĐỒ ────────────────────────────────────────────────────
// Đây KHÔNG phải hình mang dữ liệu nên không áp ngưỡng 3:1: lưới và rãnh nền là vật dẫn hướng,
// bản thân chúng không nói lên số liệu nào. Ngược lại `label` và `valueText` là chữ thật nên
// phải đạt 4.5:1.
export const CHART_AXIS = {
    grid: '#e2e8f0', // border.DEFAULT — lưới ngang, nét đứt
    track: '#f1f5f9', // surface.sunken — rãnh nền của donut (phần chưa có dữ liệu)
    label: '#5a6b85', // text.muted · 5.42:1 — nhãn trục X/Y
    valueText: '#0f172a', // text.main  · 17.85:1 — số trên đầu cột
    // Đường dóng khi rê chuột. Bản cũ dùng #94a3b8 (2.56:1); tuy chỉ hiện lúc hover nhưng nó vẫn
    // là đường chỉ vị trí, hạ xuống một bước xám đậm hơn thì không mất gì.
    crosshair: '#64748b', // neutral-500 · 4.76:1
    tooltipBg: '#0f172a', // text.main / neutral-900 — hộp tooltip nền tối
    tooltipLabel: '#cbd5e1', // neutral-300 · 12.02:1 TRÊN NỀN TOOLTIP TỐI (không phải trên trắng)
    tooltipValue: '#ffffff', // 17.85:1 trên nền tooltip
};
