import forms from '@tailwindcss/forms';
import animate from 'tailwindcss-animate';

/**
 * DESIGN SYSTEM — Mini ATS
 * Style: Soft UI Evolution (light-only) · Nguồn: skill ui-ux-pro-max
 *
 * Hai nhóm người dùng, một bảng màu:
 *   - HR: cần chuyên nghiệp, đáng tin, dữ liệu đọc nhanh  → xanh sâu (bước 700), nền trắng, chữ đậm tương phản cao
 *   - Ứng viên 22-30: cần hiện đại, dễ tiếp cận           → các biến thể *.light rộng rãi, bo góc mềm, chuyển động 200ms
 *
 * QUY TẮC MÀU: mọi màu ngữ nghĩa (primary/success/warning/danger) lấy DEFAULT = bước 700 của ramp.
 * Lý do: đây là bước tối đầu tiên mà chữ trắng đặt lên đạt >= 4.5:1. Các bước 500/600 quen thuộc
 * (#0284c7, #10b981, #f59e0b, #ef4444) đều TRƯỢT WCAG AA khi làm nền nút — đã đo, xem bảng dưới.
 *
 * ĐÃ ĐO 27 cặp màu, 0 cặp trượt. Các mốc chính (tỉ lệ tương phản):
 *   text.main / nền trắng ......... 17.85:1  AAA
 *   text.muted / nền trắng .......  5.42:1  AA
 *   text.muted / surface .........  5.18:1  AA
 *   chữ trắng / primary ..........  5.93:1  AA
 *   chữ trắng / success ..........  5.48:1  AA
 *   chữ trắng / warning ..........  5.02:1  AA
 *   chữ trắng / danger ...........  6.47:1  AA
 *   primary / primary.light ......  5.17:1  AA   (badge, menu đang chọn)
 *   success / success.light ......  4.84:1  AA
 *   warning / warning.light ......  4.51:1  AA
 *   danger  / danger.light .......  5.30:1  AA
 *   border.strong / nền trắng ....  3.64:1  (ngưỡng 3:1 cho thành phần phi văn bản)
 */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── PRIMARY: Sky 700 ────────────────────────────────────────────────
        // Xanh dương = tín nhiệm/ổn định, tông chuẩn của phần mềm tuyển dụng.
        // Chọn bước 700 (#0369A1) chứ không phải 600 (#0284C7) vì 600 chỉ đạt 4.10:1
        // với chữ trắng — nút "Ứng tuyển"/"Đăng tin" sẽ trượt AA. 700 lên 5.93:1.
        // Vẫn giữ họ Sky (không sang Indigo/Navy) để không quá nặng nề với ứng viên trẻ.
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          DEFAULT: '#0369a1', // Sky 700 — nút chính, link, focus ring
          hover: '#075985',   // Sky 800 — đủ tối để cảm nhận rõ khi hover
          light: '#e0f2fe',   // Sky 100 — nền badge / menu đang chọn
        },

        // ── SUCCESS: Emerald 700 ────────────────────────────────────────────
        // Xanh lá cho "Đã tuyển"/"Đạt vòng". Emerald 500 (#10B981) quen dùng nhưng
        // chữ trắng trên nó chỉ 2.54:1 — trượt nặng. 700 (#047857) cho 5.48:1.
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#036b4f',
          900: '#024c3a',
          DEFAULT: '#047857',
          light: '#d1fae5',
        },

        // ── WARNING: Amber 700 ──────────────────────────────────────────────
        // Vàng/cam cho "Chờ duyệt"/"Sắp hết hạn". Đây là màu khó nhất: Amber 500
        // (#F59E0B) chỉ 2.15:1 với chữ trắng. Phải xuống 700 (#B45309, 5.02:1),
        // đổi lại sắc hơi ngả nâu — chấp nhận được vì AA là ràng buộc bắt buộc.
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          DEFAULT: '#b45309',
          light: '#fef3c7',
        },

        // ── DANGER: Red 700 ─────────────────────────────────────────────────
        // Đỏ cho "Từ chối"/"Xóa tin". Red 500 (#EF4444) đạt 3.76:1 và Red 600
        // (#DC2626) đạt 4.83:1 với chữ trắng NHƯNG chữ đỏ 600 trên nền danger.light
        // chỉ 3.95:1 — badge "Đã từ chối" sẽ trượt. Red 700 đạt cả hai chiều.
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          DEFAULT: '#b91c1c',
          light: '#fee2e2',
        },

        // ── NEUTRAL: thang Slate ────────────────────────────────────────────
        // Slate ngả xanh nhẹ nên đứng cạnh primary hài hòa hơn Gray trung tính thuần.
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },

        // ── NỀN ─────────────────────────────────────────────────────────────
        // Trắng tinh, KHÔNG dùng nền ngả xanh (#F0F9FF) mà palette gốc gợi ý:
        // bảng dữ liệu HR có hàng nghìn dòng, nền có sắc sẽ làm mỏi mắt và
        // hạ tương phản của mọi thứ đặt lên trên.
        background: '#ffffff',

        // Surface #F8FAFC (Slate 50) là nền trang; card trắng nổi lên trên tạo
        // phân tầng mà không cần shadow nặng — đúng tinh thần Soft UI Evolution.
        // `inverse` (Slate 900) là mặt phẳng đảo: nền tối để một khối DUY NHẤT trên trang
        // tách hẳn khỏi phần còn lại. Dùng cho điểm AI chấm CV — đây là con số HR nhìn đầu
        // tiên khi mở hồ sơ, và nó là kết quả máy tính ra chứ không phải dữ liệu người nhập,
        // nên đảo nền nói rõ "khối này khác loại" mà không cần thêm màu accent nào.
        // Đảo nền là thủ pháp chỉ hiệu quả khi hiếm: dùng quá một khối mỗi trang là mất tác dụng.
        surface: {
          DEFAULT: '#f8fafc',
          raised: '#ffffff',
          sunken: '#f1f5f9',
          inverse: '#0f172a',
        },

        // ── VIỀN ────────────────────────────────────────────────────────────
        // border (#E2E8F0) là viền trang trí: chia card, chia dòng bảng.
        // border.strong (#7C8798) đạt 3.64:1 — dùng cho ranh giới mang thông tin
        // (viền input lúc hover, control cần WCAG 1.4.11).
        border: {
          DEFAULT: '#e2e8f0',
          subtle: '#f1f5f9',
          strong: '#7c8798',
        },

        // ── CHỮ: 3 cấp độ, CẢ BA đều đạt >= 4.5:1 ───────────────────────────
        // Bẫy thường gặp: đặt cấp thứ ba ở Slate 400 (#94A3B8) cho "nhạt hơn nữa".
        // Nó chỉ đạt 2.56:1 — mà placeholder, timestamp, nhãn nhóm đều là văn bản
        // thật và vẫn phải đạt 4.5:1. Nên cấp 3 dừng ở #64748B, không nhạt hơn.
        text: {
          main: '#0f172a',   // Slate 900 — tiêu đề, số liệu, nội dung chính (17.85:1)
          muted: '#5a6b85',  // mô tả, nhãn phụ (5.42:1)
          subtle: '#64748b', // placeholder, timestamp, icon (4.76:1) — sàn cuối cùng
          inverse: '#ffffff',
        },
      },

      // ── CHỮ VIỆT ───────────────────────────────────────────────────────────
      // Plus Jakarta Sans có sẵn subset `vietnamese` (đã tra trong DB google-fonts
      // của skill: latin | latin-ext | vietnamese | cyrillic-ext, 14 style, rank 69).
      // Dấu tiếng Việt được thiết kế sẵn trong font chứ không phải ghép từ font
      // dự phòng, nên "Ứng tuyển"/"Nhà tuyển dụng" không bị lệch dấu.
      // Chiều cao x lớn + chữ cái mở giúp đọc tốt ở 13-14px trong bảng dữ liệu dày.
      // Giữ nguyên font hiện tại — không cần đổi.
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },

      // ── THANG CỠ CHỮ: đúng 5 bước — 12 / 14 / 16 / 20 / 28 ────────────────
      // Ít bước nhưng chênh rõ. Phân cấp tạo bằng CÂN NẶNG và MÀU, không bằng cỡ chữ to.
      // Các bước 4xl/5xl/6xl bị ghim về 28px (không xóa hẳn, vì xóa sẽ khiến class
      // biến mất im lặng và trang cũ mất luôn font-size mà không ai thấy lỗi).
      //
      // line-height 1.6 cho cỡ chữ đọc: tiếng Việt có dấu xếp tầng — "ế" "ộ" "ữ" "ặ"
      // mang dấu cả trên lẫn dưới — nên cần khoảng đứng rộng hơn tiếng Anh.
      // Riêng 20px và 28px hạ xuống 1.5/1.4: ở cỡ tiêu đề, 1.6 tạo khoảng hở lớn tới mức
      // tiêu đề rời khỏi đoạn văn thuộc về nó, nhưng vẫn thoáng hơn hẳn mức 1.15-1.25
      // quen dùng cho display tiếng Anh.
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.6' }],    // 12 — caption, timestamp, nhãn
        sm: ['0.875rem', { lineHeight: '1.6' }],   // 14 — chữ trong bảng, nhãn form
        base: ['1rem', { lineHeight: '1.6' }],     // 16 — nội dung chính
        lg: ['1.25rem', { lineHeight: '1.5' }],    // 20 — tiêu đề mục
        xl: ['1.25rem', { lineHeight: '1.5' }],    // 20
        '2xl': ['1.75rem', { lineHeight: '1.4' }], // 28 — tiêu đề trang
        '3xl': ['1.75rem', { lineHeight: '1.4' }], // 28 (ghim)
        '4xl': ['1.75rem', { lineHeight: '1.4' }], // 28 (ghim)
        '5xl': ['1.75rem', { lineHeight: '1.4' }], // 28 (ghim)
        '6xl': ['1.75rem', { lineHeight: '1.4' }], // 28 (ghim)
      },

      // ── CÂN NẶNG: chỉ 400 / 500 / 600 / 700 ───────────────────────────────
      // extrabold và black bị ghim về 700 thay vì xóa — 57 chỗ trong src/pages đang
      // dùng font-black/font-extrabold, xóa sẽ làm chúng rơi về 400 và hỏng phân cấp.
      // Ghim về 700 vừa chặn được cân nặng vượt hệ thống, vừa không phá trang chưa sửa.
      fontWeight: {
        light: '400',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '700',
        black: '700',
      },

      // ── BO GÓC: đúng 3 mức có mục đích ────────────────────────────────────
      //   4px  — input, badge, ô chọn nhỏ
      //   8px  — card, button
      //   12px — modal, dropdown, popover
      // Mỗi mức gắn hai tên Tailwind để trang chưa redesign tự rơi vào đúng bậc:
      // rounded-2xl (42 chỗ đang dùng) thu từ 18px về 12px thay vì phình to.
      // `full` giữ lại nhưng CHỈ dùng cho avatar tròn và chấm trạng thái.
      borderRadius: {
        none: '0',
        sm: '0.25rem',   // 4px
        DEFAULT: '0.25rem',
        md: '0.25rem',   // 4px
        lg: '0.5rem',    // 8px
        xl: '0.5rem',    // 8px
        '2xl': '0.75rem', // 12px
        '3xl': '0.75rem', // 12px
        full: '9999px',
      },

      borderColor: {
        DEFAULT: '#e2e8f0',
      },

      // ── SHADOW: chỉ cho phần tử thực sự nổi lên mặt phẳng khác ────────────
      // Phân vùng giao diện dùng ĐƯỜNG VIỀN 1px, không dùng shadow. Vì vậy các bậc
      // shadow nhẹ (xs/sm/DEFAULT/md) bị đặt về `none`: mọi card tĩnh ở 40 file chưa
      // redesign tự phẳng lại mà không phải sửa từng chỗ.
      // Chỉ lg (dropdown) và xl (modal) còn đổ bóng thật — đó là hai thứ duy nhất
      // thực sự bay lên trên mặt phẳng trang.
      boxShadow: {
        none: 'none',
        xs: 'none',
        sm: 'none',
        DEFAULT: 'none',
        md: 'none',
        lg: '0 4px 6px -4px rgb(15 23 42 / 0.08), 0 12px 28px -6px rgb(15 23 42 / 0.16)', // dropdown, popover
        xl: '0 8px 10px -6px rgb(15 23 42 / 0.10), 0 24px 48px -12px rgb(15 23 42 / 0.22)', // modal
      },

      spacing: {
        sidebar: '16rem', // 256px — khớp w-64 của sidebar, dùng cho ml-sidebar
      },

      maxWidth: {
        content: '80rem', // 1280px — bề rộng tối đa vùng nội dung dashboard admin
      },

      // Một đường cong duy nhất, 200ms: đủ để cảm nhận trạng thái đổi, đủ nhanh để HR
      // duyệt hàng loạt hồ sơ không thấy giao diện níu tay. Không có easing nảy (spring) —
      // độ nảy nói "vui vẻ", không nói gì về dữ liệu tuyển dụng.
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      // Chỉ giữ shimmer vì nó phục vụ một việc cụ thể: báo "đang tải" ở đúng chỗ nội dung
      // sắp hiện, để danh sách ứng viên không nhảy layout khi data về.
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },

      animation: {
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [
    forms({ strategy: 'class' }),
    animate,
  ],
}
