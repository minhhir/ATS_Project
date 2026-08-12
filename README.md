# 🎯 Mini ATS — Hệ thống quản lý tuyển dụng tích hợp AI sàng lọc hồ sơ

<<<<<<< HEAD
Hệ thống Applicant Tracking System (ATS) thu nhỏ, được thiết kế theo mô hình phân tán với 3 phân hệ độc lập: **Frontend React**, **Node.js API Gateway**, và **Python AI Microservice**. Hệ thống cho phép ứng viên nộp CV PDF, sau đó AI tự động chấm điểm độ phù hợp với JD bằng công thức composite kết hợp **semantic similarity** (Sentence-Transformer đa ngôn ngữ Việt-Anh), **skill matching** (đối chiếu từng kỹ năng JD yêu cầu) và **keyword overlap** (độ phủ từ khóa JD trong CV) — không phải TF-IDF.
=======
Tài liệu kỹ thuật toàn diện của dự án Mini ATS — bao gồm kiến trúc, luồng dữ liệu, mô hình CSDL, API, hệ thống thiết kế và hướng dẫn vận hành.
>>>>>>> 6f5042456f694c423e9c3158f29cb94324249ffa

---

## 📑 Mục lục

1. [Giới thiệu dự án](#1-giới-thiệu-dự-án)
2. [Kiến trúc tổng thể](#2-kiến-trúc-tổng-thể)
3. [Công nghệ sử dụng](#3-công-nghệ-sử-dụng)
4. [Cấu trúc thư mục](#4-cấu-trúc-thư-mục)
5. [Module Backend (Node.js)](#5-module-backend-nodejs)
6. [Module AI Service (FastAPI)](#6-module-ai-service-fastapi)
7. [Module Frontend (React + Vite)](#7-module-frontend-react--vite)
8. [Các luồng nghiệp vụ chính](#8-các-luồng-nghiệp-vụ-chính)
9. [Mô hình dữ liệu](#9-mô-hình-dữ-liệu)
10. [Hệ thống thiết kế](#10-hệ-thống-thiết-kế)
11. [Bảo mật và xác thực](#11-bảo-mật-và-xác-thực)
12. [Hướng dẫn cài đặt và chạy](#12-hướng-dẫn-cài-đặt-và-chạy)
13. [Kiểm thử nhanh](#13-kiểm-thử-nhanh)
14. [Xử lý sự cố thường gặp](#14-xử-lý-sự-cố-thường-gặp)
15. [Hướng phát triển tiếp theo](#15-hướng-phát-triển-tiếp-theo)

---

## 1. Giới thiệu dự án

Mini ATS là một hệ thống Applicant Tracking System hoàn chỉnh, tự động hoá khâu tốn thời gian nhất của quy trình tuyển dụng: đọc và sàng lọc hồ sơ ứng viên.

| Nhóm tính năng | Chi tiết |
| --- | --- |
| 👤 Tài khoản | Đăng ký theo vai trò, đăng nhập (JWT access + refresh cookie), quên mật khẩu qua OTP, cập nhật hồ sơ, upload avatar/CV (Cloudinary) |
| 🔍 Tìm việc | Lọc đa chiều theo từ khoá, địa điểm, mức lương, kinh nghiệm, cấp bậc, hình thức làm việc |
| 📄 Ứng tuyển | Nộp CV dạng PDF, hệ thống trích xuất văn bản và chấm điểm tự động |
| 🤖 Chấm điểm AI | So khớp CV với mô tả công việc, trả điểm 0–100 kèm danh sách kỹ năng khớp và kỹ năng còn thiếu |
| 📊 Quản lý HR | Lọc hồ sơ theo điểm AI, đổi trạng thái vòng tuyển dụng, dashboard thống kê với biểu đồ |
| 🛡️ Kiểm duyệt | Tin tuyển dụng phải qua duyệt của Quản trị viên trước khi hiển thị cho ứng viên |
| 🔔 Thông báo | Ứng viên và HR nhận thông báo khi trạng thái hồ sơ thay đổi |

Dự án gồm **3 phân hệ chạy độc lập**, giao tiếp qua REST:

| Phân hệ | Thư mục | Cổng |
| --- | --- | --- |
| Frontend React + Vite | `frontend-ats/` | 5173 |
| API Gateway Node.js | `backend-node/` | 5000 |
| AI Microservice Python | `backend-ai-python/` | 8000 |

---

## 2. Kiến trúc tổng thể

### 2.1. Sơ đồ kiến trúc cấp cao

```
<<<<<<< HEAD
┌──────────────────────┐
│   Frontend (React)   │  Port 5173
│   Vite + Tailwind    │
└──────────┬───────────┘
           │ JSON / FormData (withCredentials)
           ▼
┌──────────────────────┐         ┌──────────────┐
│  Node.js API Gateway │ ◄─────► │   MongoDB    │
│  Express 5 + JWT     │         │   (Mongoose) │
│   Port 5000          │         └──────────────┘
└──────────┬───────────┘
           │                     ┌──────────────┐
           │ ◄─────────────────► │  Cloudinary  │
           │                     │   (CV/Avatar)│
           │                     └──────────────┘
           │ POST /score (cv_url, jd_text, jd_skills)
           ▼
┌──────────────────────┐
│ Python AI Service    │  Port 8000
│ FastAPI + Uvicorn    │
│ Sentence-Transformer │
└──────────────────────┘
```

*(Hình: sơ đồ kiến trúc tổng thể và sơ đồ triển khai chi tiết hơn — xuất từ `ats-diagrams.drawio` (trang "1-Kien-truc-tong-the" và "2-Trien-khai") vào `docs/images/`, đặt tên file đúng theo các placeholder bên dưới rồi bỏ comment.)*

<!-- ![Kiến trúc tổng thể](docs/images/01-kien-truc-tong-the.png) -->
<!-- ![Sơ đồ triển khai](docs/images/02-trien-khai.png) -->
<!-- ![Phân lớp backend](docs/images/03-phan-lop-backend.png) -->
<!-- ![Thành phần AI Service](docs/images/04-ai-service.png) -->

**Tại sao tách 3 phân hệ:**
- **Frontend** chạy trên CDN, không cần biết backend logic
- **Node.js Gateway** xử lý nghiệp vụ chính, kết nối DB và file storage
- **Python AI** tách riêng vì tác vụ ML cần thư viện nặng (PyTorch, sentence-transformers), không nên đặt trên server xử lý request thường

**Giao tiếp Node.js ↔ Python:** một chiều, fire-and-forget. Node gọi `POST {AI_SERVICE_URL}/score` sau khi đã trả response cho client (timeout 60s để chịu được lần load model đầu tiên), Python không bao giờ gọi ngược lại Node.
=======
┌─────────────────────────────────────────┐
│        Frontend — React + Vite          │  :5173
│   SPA, Context API, axios interceptor   │
└────────────────────┬────────────────────┘
                     │ HTTPS · JSON · FormData
                     ▼
┌─────────────────────────────────────────┐      ┌──────────────────┐
│      API Gateway — Node.js Express      │◄────►│     MongoDB      │
│   JWT · RBAC · Mongoose · multer        │      │  4 collections   │
└────────────────────┬────────────────────┘      └──────────────────┘
                     │                            ┌──────────────────┐
                     │◄──────────────────────────►│    Cloudinary    │
                     │   upload_stream (buffer)   │   CV · Avatar    │
                     │                            └────────┬─────────┘
                     │ POST /score                          │
                     │ { cv_url, jd_text, jd_skills }        │ GET *.pdf
                     ▼                                      │
┌─────────────────────────────────────────┐                 │
│     AI Service — FastAPI + Uvicorn      │◄────────────────┘
│  Semaphore(5) · pdfminer · SBERT        │  :8000
└─────────────────────────────────────────┘
```

### 2.2. Nguyên tắc thiết kế

| Nguyên tắc | Áp dụng |
| --- | --- |
| Tách microservice | AI viết riêng bằng Python vì cần PyTorch + sentence-transformers (~500MB), không nên nằm cùng server xử lý request thường |
| Fire and Forget | Node trả `201 Created` cho ứng viên ngay sau khi lưu DB, việc chấm điểm chạy ngầm — người dùng không phải chờ 5–10 giây |
| Kiểm soát tài nguyên | AI Service dùng `asyncio.Semaphore(5)` giới hạn số tiến trình đồng thời, chống cạn RAM |
| Tách I/O và CPU | Tải PDF là I/O-bound chạy async; chấm điểm là CPU-bound đẩy sang `asyncio.to_thread` để không khoá event loop |
| Stateless JWT | Access token 15 phút giữ trong memory, refresh token 7 ngày trong cookie `httpOnly` |
| Không ghi file tạm | Multer dùng `memoryStorage`, buffer stream thẳng lên Cloudinary — server không cần quyền ghi đĩa |
| Graceful fallback | Nếu model SBERT không tải được, `scorer.py` vẫn chấm bằng keyword + skill overlap thay vì trả lỗi |
>>>>>>> 6f5042456f694c423e9c3158f29cb94324249ffa

---

## 3. Công nghệ sử dụng

<<<<<<< HEAD
### Cho Ứng viên (Candidate)
- Đăng ký, đăng nhập (JWT access token 15 phút + refresh token trong cookie httpOnly, tự động rotate)
- Quên mật khẩu qua OTP 6 số — **lưu ý:** hệ thống hiện **chưa tích hợp gửi email thật**, OTP chỉ được `console.log` ở server khi `NODE_ENV !== 'production'` (xem [Troubleshooting](#troubleshooting))
- Tìm kiếm việc làm với bộ lọc đa chiều: từ khóa, địa điểm, cấp bậc, loại hình, kinh nghiệm, khoảng lương; sắp xếp theo mới nhất / phổ biến / lương
- Nộp CV PDF (tối đa 5MB), AI tự động chấm điểm độ phù hợp với JD
- Theo dõi trạng thái hồ sơ ứng tuyển (applied → reviewing → shortlisted → interviewed → offered / rejected)
- Nhận thông báo (polling 30s) khi HR đổi trạng thái hồ sơ
- Cập nhật hồ sơ cá nhân (avatar, CV, kỹ năng, số điện thoại), đổi mật khẩu

### Cho Nhà tuyển dụng (Recruiter)
- Đăng tin tuyển dụng — mọi tin mới luôn ở trạng thái `approvalStatus: 'pending'`, cần admin duyệt mới hiển thị công khai
- Sửa / xóa mềm (soft delete, `isActive: false`) tin của chính mình
- Xem danh sách ứng viên theo từng job hoặc gộp tất cả tin của mình, lọc theo điểm AI / khoảng ngày nộp / từ khóa tên-email / đã đánh dấu nổi bật
- Đổi trạng thái đơn ứng tuyển kèm ghi chú nội bộ — hệ thống tự động thông báo cho ứng viên khi trạng thái đổi
- Đánh dấu ứng viên nổi bật
- Yêu cầu AI chấm lại điểm cho một hồ sơ (retrigger)
- Báo cáo đơn ứng tuyển nghi ngờ gian lận (CV giả...) cho admin xử lý
- Dashboard: KPI tổng quan (tổng tin, tin đang active, tổng đơn) + biểu đồ analytics (xu hướng đơn 30 ngày, tăng trưởng %, phễu trạng thái, top 5 tin nhiều ứng viên nhất, phân bố điểm AI theo khoảng)

### Cho Quản trị viên (Admin)
- Duyệt / từ chối tin tuyển dụng mới đăng
- Đánh dấu tin tuyển dụng nổi bật (Hot) — **đây là đặc quyền riêng của admin**, recruiter (kể cả chủ tin) không gọi được endpoint này
- Quản lý người dùng: xem danh sách, xem chi tiết kèm lịch sử hoạt động (job đã đăng / đơn đã nộp), xóa tài khoản vĩnh viễn kèm cascade xóa job/application liên quan. Hệ thống hiện **không có tính năng khóa/mở khóa tài khoản** — chỉ có xóa hẳn.
- Quản lý toàn bộ tin tuyển dụng (kể cả pending/rejected), xóa tin vi phạm — khi xóa sẽ cascade xóa mọi đơn ứng tuyển liên quan và gửi thông báo cho cả recruiter lẫn từng ứng viên bị ảnh hưởng
- Xem và xử lý báo cáo vi phạm do recruiter gửi lên, xem chi tiết một đơn ứng tuyển bất kỳ, xóa đơn vi phạm (hệ thống thông báo cho ứng viên trước khi xóa)
- Dashboard thống kê toàn hệ thống: KPI (số candidate/recruiter/job/application) + biểu đồ analytics (trend 30 ngày, tăng trưởng %, phân bố duyệt tin, phân bố trạng thái đơn, top 5 recruiter theo số tin đăng)
=======
### 3.1. Frontend

| Thư viện | Phiên bản | Vai trò |
| --- | --- | --- |
| React | 18.x | UI framework |
| Vite | 5.x | Bundler / dev server |
| Tailwind CSS | 3.4 | Utility-first CSS |
| React Router | 6.x | Định tuyến, ProtectedRoute |
| Axios | 1.x | HTTP client + interceptor refresh token |
| lucide-react | 0.4x | Bộ icon dạng đường |
| clsx + tailwind-merge | – | Gộp class an toàn, chống xung đột |
| @tanstack/react-query | 5.x | Cache và đồng bộ dữ liệu server |
| @tailwindcss/forms | – | Reset form theo strategy `class` |
| tailwindcss-animate | – | Animation utility cho trang auth |

### 3.2. Backend Node.js

| Thư viện | Vai trò |
| --- | --- |
| Express.js | REST framework |
| Mongoose | ODM cho MongoDB |
| jsonwebtoken | Ký và xác thực JWT |
| bcryptjs | Băm mật khẩu (cost 12) |
| multer | Nhận multipart/form-data vào RAM |
| cloudinary + streamifier | Đẩy buffer lên cloud storage |
| helmet | HTTP security headers |
| cors | Cấu hình cross-origin có credentials |
| express-rate-limit | Giới hạn 100 request / 15 phút |
| cookie-parser | Đọc refresh token từ cookie |
| dotenv | Nạp biến môi trường |

### 3.3. AI Service

| Thư viện | Vai trò |
| --- | --- |
| FastAPI | Web framework bất đồng bộ |
| Uvicorn | ASGI server |
| pdfminer.six | Trích xuất văn bản thuần từ PDF |
| sentence-transformers | Mô hình nhúng ngữ nghĩa đa ngôn ngữ |
| torch | Backend tính toán cho SBERT |
| httpx | HTTP client async, hỗ trợ streaming |
| pydantic | Kiểm soát schema request/response |

Model sử dụng: `paraphrase-multilingual-MiniLM-L12-v2` (~117MB) — hỗ trợ cả tiếng Việt và tiếng Anh, tải tự động ở lần chạy đầu tiên.
>>>>>>> 6f5042456f694c423e9c3158f29cb94324249ffa

---

## 4. Cấu trúc thư mục

<<<<<<< HEAD
| Phân hệ | Yêu cầu |
|---|---|
| Node.js | Khuyến nghị bản LTS hiện hành (repo không ghim version qua `engines`) |
| Python | >= 3.10 (dùng cú pháp `list[str] \| None` trong `app.py`) |
| MongoDB | Local hoặc MongoDB Atlas |
| RAM | Khuyến nghị tối thiểu 4GB — gói `torch` + `sentence-transformers` khá nặng |
| Cloudinary | Tài khoản free đủ dùng |
=======
```
ATS_Project/
├── 📁 backend-node/                       # API Gateway
│   ├── .env                               # Biến môi trường (không commit)
│   └── src/
│       ├── server.js                      # Entry point — dotenv.config() PHẢI ở dòng đầu
│       ├── 📁 config/
│       │   ├── db.js                      # Kết nối MongoDB
│       │   └── cloudinary.js              # Cấu hình Cloudinary SDK
│       ├── 📁 models/                     # Mongoose schema
│       │   ├── User.js                    # + pre('save') hash bcrypt
│       │   ├── Job.js                     # + text index cho tìm kiếm
│       │   ├── Application.js             # + unique index (job, candidate)
│       │   └── Notification.js
│       ├── 📁 controllers/                # Xử lý nghiệp vụ
│       │   ├── authController.js
│       │   ├── jobController.js
│       │   ├── applicationController.js
│       │   ├── adminController.js
│       │   └── notificationController.js
│       ├── 📁 routes/                     # Định tuyến — thứ tự route quan trọng
│       ├── 📁 middlewares/
│       │   ├── auth.js                    # protect — verify JWT, nạp req.user
│       │   ├── role.js                    # isRecruiter, isAdmin
│       │   ├── upload.js                  # multer memoryStorage + uploadToCloudinary
│       │   └── errorHandler.js
│       ├── 📁 services/
│       │   ├── authService.js             # Logic đăng ký/đăng nhập/OTP
│       │   └── aiService.js               # Gọi Python, cập nhật aiScore
│       └── 📁 utils/
│           └── AppError.js                # Error có statusCode
│
├── 📁 backend-ai-python/                  # AI Microservice
│   ├── app.py                             # FastAPI entry, Semaphore, endpoint /score
│   ├── requirements.txt
│   ├── .venv/                             # Virtual environment (không commit)
│   └── 📁 services/
│       ├── __init__.py
│       ├── extractor.py                   # Tải PDF async + pdfminer
│       └── scorer.py                      # Composite scoring
│
└── 📁 frontend-ats/                       # Web UI
    ├── tailwind.config.js                 # Design tokens — nguồn chân lý duy nhất
    ├── vite.config.js                     # Alias @/ → src/
    └── src/
        ├── App.jsx                        # Routes + ProtectedRoute
        ├── main.jsx                       # Entry, AuthProvider, QueryClientProvider
        ├── index.css                      # Base styles, :focus-visible, .overlay
        ├── 📁 api/
        │   ├── axios.js                   # Instance + interceptor refresh
        │   └── endpoints.js               # Gom toàn bộ lời gọi API
        ├── 📁 context/
        │   └── AuthContext.jsx            # checkSession, login, logout, updateUser
        ├── 📁 hooks/
        │   ├── useDebounce.js
        │   ├── useFocusTrap.js            # Dùng chung ConfirmDialog + drawer
        │   └── useChartWidth.js           # ResizeObserver cho SVG chart
        ├── 📁 layout/
        │   ├── AuthLayout.jsx
        │   ├── DashboardShell.jsx         # Khung chung cho 3 layout vai trò
        │   ├── CandidateLayout.jsx
        │   ├── RecruiterLayout.jsx
        │   └── AdminLayout.jsx
        ├── 📁 ui/                         # Component nguyên tử
        │   ├── Button.jsx                 # variant, isLoading, aria-busy
        │   ├── Input.jsx                  # useId, aria-invalid, toggle password
        │   ├── Badge.jsx
        │   ├── ConfirmDialog.jsx          # Focus trap + restore focus
        │   ├── Skeleton.jsx
        │   └── Logo.jsx
        ├── 📁 components/
        │   ├── 📁 layout/
        │   │   └── ProtectedRoute.jsx     # Chặn theo role, chờ loading
        │   └── 📁 shared/
        │       ├── NotificationBell.jsx   # Polling 30s
        │       ├── ChangePasswordForm.jsx
        │       └── 📁 charts/
        │           ├── BarChart.jsx
        │           ├── LineChart.jsx
        │           ├── DonutChart.jsx
        │           └── FunnelChart.jsx
        ├── 📁 pages/
        │   ├── LandingPage.jsx
        │   ├── 📁 auth/                   # Login, Register, ForgotPassword, OTP, Reset
        │   ├── 📁 candidate/              # JobSearch, JobDetail, Applications, Settings
        │   ├── 📁 recruiter/              # Dashboard, JobsManage, JobCreate, Candidates
        │   ├── 📁 admin/                  # Dashboard, Users, Jobs, ApplicationDetail
        │   └── 📁 shared/
        │       └── NotificationsPage.jsx
        └── 📁 utils/
            └── chartColors.js             # Bảng màu chart, tra ngược về tokens
```
>>>>>>> 6f5042456f694c423e9c3158f29cb94324249ffa

---

## 5. Module Backend (Node.js)

### 5.1. Sơ đồ phân lớp

```
Request
   │
   ▼
helmet → cors → rateLimit → express.json → cookieParser
   │
   ▼
Router  ──► protect (JWT) ──► role guard ──► Controller
                                                 │
                                                 ▼
                                            Service ──► Model (Mongoose)
                                                 │
                                                 ▼
                                            aiService ──► Python
   │
   ▼
errorHandler  ──►  { success: false, message }
```

### 5.2. Danh sách API REST

#### Auth — `/api/auth`

| Method | Endpoint | Quyền | Mô tả |
| --- | --- | --- | --- |
| POST | `/register` | Public | Đăng ký — role bị whitelist còn `candidate` / `recruiter` |
| POST | `/login` | Public | Trả `accessToken` + set cookie `refreshToken` |
| POST | `/refresh` | Cookie | Cấp access token mới |
| POST | `/logout` | Public | Xoá cookie |
| GET | `/me` | Login | Thông tin user hiện tại |
| POST | `/forgot-password` | Public | Sinh OTP 6 số, hash bcrypt, hạn 10 phút |
| POST | `/verify-otp` | Public | Xác thực OTP, đánh dấu `resetOTPVerified` |
| POST | `/reset-password` | Public | Đổi mật khẩu, xoá field OTP |
| PUT | `/profile` | Login | Cập nhật hồ sơ + upload avatar/CV |

#### Jobs — `/api/jobs`

| Method | Endpoint | Quyền | Mô tả |
| --- | --- | --- | --- |
| GET | `/` | Public | Danh sách tin **đã duyệt**, có filter + phân trang |
| GET | `/featured` | Public | Tin nổi bật |
| GET | `/my-jobs` | Recruiter | Tin của chính HR đang đăng nhập |
| GET | `/stats/summary` | Recruiter | Số liệu dashboard |
| GET | `/:id` | Login | Chi tiết — candidate chỉ xem được tin đã duyệt |
| POST | `/` | Recruiter | Tạo tin, backend ép `approvalStatus: 'pending'` |
| PUT | `/:id` | Recruiter | Sửa tin, **reset về pending** để duyệt lại |
| DELETE | `/:id` | Recruiter | Soft delete (`isActive: false`) |
| PATCH | `/:id/feature` | Recruiter | Bật/tắt nổi bật |
| PATCH | `/:id/approval` | Admin | Duyệt hoặc từ chối tin |

> ⚠️ Route `/my-jobs` và `/stats/summary` phải khai báo **trước** `/:id`, nếu không Express sẽ bắt chúng như một `id`.

#### Applications — `/api/applications`

| Method | Endpoint | Quyền | Mô tả |
| --- | --- | --- | --- |
| POST | `/:jobId/apply` | Candidate | Nộp CV, kích hoạt chấm điểm ngầm |
| GET | `/job/:jobId` | Recruiter | Danh sách ứng viên, filter theo điểm/từ khoá |
| GET | `/my-apps` | Candidate | Đơn ứng tuyển của mình, kèm `isActive` của job |
| PATCH | `/:id/status` | Recruiter | Đổi trạng thái vòng tuyển dụng |
| PATCH | `/:id/feature` | Recruiter | Đánh dấu hồ sơ nổi bật |
| POST | `/:id/score` | Recruiter | Chấm lại điểm AI |

#### Admin — `/api/admin`

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| GET | `/stats` | Thống kê toàn hệ thống, breakdown theo role |
| GET | `/users` | Danh sách user, filter role + tìm kiếm |
| PATCH | `/users/:id/status` | Khoá / mở khoá tài khoản |
| DELETE | `/users/:id` | Xoá user + cascade dữ liệu liên quan |
| GET | `/jobs` | Toàn bộ tin, kể cả pending và đã ẩn |

#### Notifications — `/api/notifications`

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| GET | `/` | 20 thông báo mới nhất |
| PUT | `/read-all` | Đánh dấu tất cả đã đọc |

### 5.3. Middleware upload

```
req.file (multipart)
   │
   ▼
multer.memoryStorage()        ← không ghi xuống đĩa
   │  fileFilter: PDF + image
   │  limits: 5MB
   ▼
Buffer trong RAM
   │
   ▼
streamifier.createReadStream(buffer)
   │
   ▼
cloudinary.uploader.upload_stream({
    resource_type: 'raw',
    format: 'pdf',
    access_mode: 'public'      ← bắt buộc, nếu thiếu Python nhận 401
})
   │
   ▼
secure_url  ──►  lưu vào Application.cvUrl
```

---

## 6. Module AI Service (FastAPI)

### 6.1. Sơ đồ thành phần

```
POST /score
   │
   ▼
async with semaphore (max 5)
   │
   ├─► extract_text_from_url()          [I/O-bound]
   │      httpx stream, follow_redirects
   │      check content-type / đuôi .pdf
   │      giới hạn 10MB
   │      pdfminer trong to_thread
   │
   ├─► len(cv_text) < 50 ? → HTTP 422 (PDF scan ảnh)
   │
   └─► asyncio.to_thread(score_cv)      [CPU-bound]
          ├─ semantic  → SBERT cosine
          ├─ skill     → regex khớp cụm
          └─ keyword   → TF trên vocabulary chung
   │
   ▼
{ score, matched_keywords, summary }
```

### 6.2. Endpoint chi tiết

#### `GET /health`

```json
{ "status": "ok", "service": "ai-python" }
```

#### `POST /score`

**Request:**

```json
{
  "cv_url": "https://res.cloudinary.com/.../cv_abc.pdf",
  "jd_text": "Mô tả công việc + Yêu cầu ứng viên gộp lại",
  "jd_skills": ["React", "Node.js", "MongoDB"]
}
```

**Response:**

```json
{
  "score": 82.1,
  "matched_keywords": ["React", "Node.js", "javascript", "api", "frontend"],
  "summary": "Điểm phù hợp: 82.1/100. Hồ sơ rất phù hợp với yêu cầu. Tương đồng ngữ nghĩa: 76.4%. Khớp 2 kỹ năng: React, Node.js. Còn thiếu kỹ năng: MongoDB."
}
```

**Mã lỗi:**

| Mã | Nguyên nhân |
| --- | --- |
| 400 | Không tải được PDF, sai định dạng, file quá lớn, Cloudinary từ chối |
| 422 | PDF không có lớp văn bản (ảnh scan) hoặc quá ngắn (< 50 ký tự) |
| 500 | Lỗi không xác định phía server |

### 6.3. Thuật toán Composite Scoring

Điểm cuối cùng là tổ hợp có trọng số của ba tín hiệu độc lập:

| Tín hiệu | Trọng số | Cách tính |
| --- | --- | --- |
| Semantic similarity | 0.55 | Cosine similarity giữa embedding CV và JD (SBERT) |
| Skill match | 0.25 | Tỉ lệ kỹ năng yêu cầu tìm thấy trong CV, hỗ trợ cụm nhiều từ |
| Keyword overlap | 0.20 | Tỉ lệ từ khoá JD (đã lọc stop word) xuất hiện trong CV |

```
composite = 0.55·semantic + 0.25·skill + 0.20·keyword
score     = min(1.0, composite × 1.1) × 100
```

**Cơ chế dự phòng** — nếu một tín hiệu không khả dụng, trọng số được phân bổ lại:

| Tình huống | Công thức |
| --- | --- |
| Đủ ba tín hiệu | `0.55·sem + 0.25·skill + 0.20·kw` |
| Không có `jd_skills` | `0.65·sem + 0.35·kw` |
| Model SBERT tải lỗi | `0.55·skill + 0.45·kw` |
| Chỉ còn keyword | `kw` |

**Điều kiện đầu vào tối thiểu:** CV ≥ 10 từ khoá có nghĩa, JD ≥ 5 từ khoá. Không đạt sẽ trả `score: 0` kèm lý do — đây là lý do một JD viết quá sơ sài luôn cho điểm 0.

**Xử lý tiếng Việt:** stop word gồm 2 bộ EN + VI, regex `\w` giữ nguyên Unicode nên không mất dấu.

---

## 7. Module Frontend (React + Vite)

### 7.1. Cây định tuyến

| Đường dẫn | Component | Quyền |
| --- | --- | --- |
| `/` | LandingPage | Public |
| `/login` `/register` | LoginPage, RegisterPage | Public |
| `/forgot-password` `/verify-otp` `/reset-password` | Luồng khôi phục | Public |
| `/jobs` `/jobs/:id` | JobSearchPage, JobDetailPage | Login |
| `/applications` | ApplicationsPage | Candidate |
| `/settings` | SettingsPage | Candidate |
| `/recruiter/dashboard` | DashboardPage | Recruiter |
| `/recruiter/jobs` | JobsManagePage | Recruiter |
| `/recruiter/jobs/new` `/recruiter/jobs/:id/edit` | JobCreatePage (dual mode) | Recruiter |
| `/recruiter/jobs/:jobId/applicants` | CandidatesManagePage | Recruiter |
| `/admin/dashboard` | AdminDashboardPage | Admin |
| `/admin/users` | UserManagementPage | Admin |
| `/admin/jobs` | AdminJobsPage | Admin |
| `/admin/applications/:id` | AdminApplicationDetailPage | Admin |

### 7.2. AuthContext — quản lý phiên

```
App mount
   │
   ▼
checkSession()  ── POST /auth/refresh ──► accessToken vào window.__accessToken
   │                                              │
   │                                              ▼
   │                                    GET /auth/me ──► setUser()
   │
   └─ thất bại ──► user = null
   │
   ▼
setLoading(false)  ──►  ProtectedRoute mới được phép quyết định redirect
```

> `loading` khởi tạo là `true`. Nếu để `false`, `ProtectedRoute` sẽ thấy `user === null` trong vài mili-giây đầu và đá người dùng về trang đăng nhập dù cookie còn hạn.

### 7.3. Axios interceptor

| Giai đoạn | Xử lý |
| --- | --- |
| Request | Gắn `Authorization: Bearer ${window.__accessToken}` nếu có |
| Response 401 lần đầu | Đánh dấu `_retry`, gọi `/auth/refresh`, phát lại request gốc |
| 401 khi đang refresh | Xếp vào `failedQueue`, chờ token mới rồi phát lại |
| Refresh thất bại | Xoá token, chuyển hướng `/login` |

> Với `FormData`, **không** set cứng `Content-Type` — Axios tự sinh `multipart/form-data` kèm `boundary`. Ghi đè sẽ khiến file bị serialize thành `[object Object]` và Multer không nhận được.

### 7.4. Hook dùng chung

| Hook | Vai trò |
| --- | --- |
| `useDebounce` | Trì hoãn giá trị lọc, tránh gọi API mỗi lần gõ phím |
| `useFocusTrap` | Trap Tab, đóng bằng Esc, khoá cuộn, trả focus khi đóng — dùng cho ConfirmDialog và drawer mobile |
| `useChartWidth` | Đo bề rộng thật bằng ResizeObserver, đặt `viewBox` bằng đúng số đó để 1 đơn vị SVG = 1 pixel CSS |

---

## 8. Các luồng nghiệp vụ chính

### 8.1. Nộp CV và chấm điểm ngầm

```
Candidate          Node.js           Cloudinary        MongoDB          Python AI
    │                 │                   │                │                │
    │─ POST /apply ──►│                   │                │                │
    │   (PDF)         │                   │                │                │
    │                 │─ validate PDF     │                │                │
    │                 │  JWT, deadline    │                │                │
    │                 │─ upload_stream ──►│                │                │
    │                 │◄── secure_url ────│                │                │
    │                 │─ create(aiStatus: 'pending') ──────►│                │
    │                 │◄──────────── _id ──────────────────│                │
    │◄─ 201 Created ──│                   │                │                │
    │                 │                   │                │                │
    │      ═══════ Fire and Forget — người dùng không phải chờ ═══════      │
    │                 │                   │                │                │
    │                 │─ POST /score ─────────────────────────────────────►│
    │                 │                   │                │  Semaphore(5)  │
    │                 │                   │◄── GET *.pdf ──────────────────│
    │                 │                   │─── binary ────────────────────►│
    │                 │                   │                │  extract text  │
    │                 │                   │                │  score_cv()    │
    │                 │◄─── { score, matched_keywords, summary } ──────────│
    │                 │─ updateOne(aiScore, aiStatus: 'done') ────────────►│
```

### 8.2. Kiểm duyệt tin tuyển dụng

```
Recruiter            Node.js              MongoDB           Candidate / Admin
    │                   │                     │                     │
    │─ POST /jobs ─────►│                     │                     │
    │                   │─ ép pending ───────►│                     │
    │◄─ 201 (chờ duyệt)─│                     │                     │
    │                   │                     │                     │
    │        ═════ Tin chưa duyệt — ứng viên không thấy ═════       │
    │                   │                     │                     │
    │                   │◄──────── GET /jobs (candidate) ───────────│
    │                   │─ find({approvalStatus:'approved'}) ──────►│
    │                   │◄── không gồm tin pending ─────────────────│
    │                   │─────────── 200 OK ───────────────────────►│
    │                   │                     │                     │
    │                   │◄─── PATCH /:id/approval (admin) ──────────│
    │                   │─ isAdmin guard      │                     │
    │                   │─ approvalStatus = 'approved' ────────────►│
    │                   │─────── 200 — tin hiển thị công khai ─────►│
```

### 8.3. Khôi phục mật khẩu qua OTP

| Bước | Endpoint | Xử lý |
| --- | --- | --- |
| 1 | `POST /forgot-password` | Sinh OTP 6 số bằng `crypto.randomInt`, hash bcrypt lưu DB, hạn 10 phút. **Luôn trả 200** dù email không tồn tại — tránh lộ danh sách người dùng |
| 2 | `POST /verify-otp` | So sánh hash, kiểm tra hạn, đặt `resetOTPVerified: true` |
| 3 | `POST /reset-password` | Kiểm tra đã verified, đổi mật khẩu, xoá toàn bộ field OTP |

---

## 9. Mô hình dữ liệu

### 9.1. ERD

```
┌──────────────┐         ┌──────────────┐         ┌──────────────────┐
│     User     │1       *│     Job      │1       *│   Application    │
│──────────────│─────────│──────────────│─────────│──────────────────│
│ _id       PK │recruiter│ _id       PK │   job   │ _id           PK │
│ name         │         │ recruiter FK │         │ job           FK │
│ email  unique│         │ title        │         │ candidate     FK │
│ password     │         │ description  │         │ cvUrl            │
│ role    enum │         │ requirements │         │ coverLetter      │
│ companyName  │         │ skills    [] │         │ aiScore          │
│ avatar       │         │ salaryMin/Max│         │ aiSummary        │
│ cvUrl        │         │ level    enum│         │ aiStatus    enum │
│ skills    [] │         │ type     enum│         │ matchedKeywords[]│
│ isActive     │         │ approvalStatus         │ status      enum │
│ resetOTPHash │         │ isActive     │         │ isFeatured       │
└──────┬───────┘         │ deadline     │         └──────────────────┘
       │1                │ applicantCount                    ▲
       │                 └──────────────┘                    │*
       │*                                                    │
┌──────▼───────┐                                    candidate│
│ Notification │────────────────────────────────────────────┘
│──────────────│
│ _id       PK │
│ recipient FK │
│ title        │
│ message      │
│ link         │
│ isRead       │
└──────────────┘
```

### 9.2. Bảng enum

| Trường | Giá trị hợp lệ |
| --- | --- |
| `User.role` | `candidate` · `recruiter` · `admin` |
| `Job.level` | `intern` · `fresher` · `junior` · `mid` · `senior` · `lead` |
| `Job.type` | `full-time` · `part-time` · `remote` · `contract` |
| `Job.experience` | `không yêu cầu` · `<1 năm` · `1-2 năm` · `3-5 năm` · `>5 năm` |
| `Job.approvalStatus` | `pending` · `approved` · `rejected` |
| `Application.aiStatus` | `pending` · `processing` · `done` · `error` |
| `Application.status` | `applied` · `reviewing` · `shortlisted` · `interviewed` · `offered` · `rejected` |

### 9.3. Index

| Collection | Index | Mục đích |
| --- | --- | --- |
| `users` | `email` unique | Chống trùng tài khoản |
| `jobs` | `{ title, description, skills }` text | Tìm kiếm toàn văn |
| `jobs` | `{ location, level, salaryMin, salaryMax }` | Tăng tốc bộ lọc |
| `applications` | `{ job, candidate }` unique | Chặn nộp trùng một vị trí |

---

## 10. Hệ thống thiết kế

### 10.1. Nguyên tắc

| Nguyên tắc | Lý do |
| --- | --- |
| Một màu accent duy nhất | Màu ngữ nghĩa (success/warning/danger) chỉ dành cho trạng thái thật — điểm AI, kết quả duyệt. Dùng màu để trang trí sẽ làm chúng mất khả năng truyền tin |
| Viền thay shadow | Card tĩnh dùng viền 1px. Shadow chỉ dành cho phần tử thật sự nổi lên khỏi mặt phẳng: modal, dropdown, tooltip, drawer |
| Mật độ theo ngữ cảnh | Trang auth thoáng; bảng dữ liệu HR dày — đây là nơi người dùng làm việc hàng giờ |
| Hierarchy bằng cân nặng | Phân cấp bằng font-weight và màu, không bằng cỡ chữ khổng lồ |
| Copy mô tả thao tác | Mỗi câu nói một việc hệ thống làm được, không mô tả cảm giác |

### 10.2. Thang giá trị

| Thang | Các bậc |
| --- | --- |
| Cỡ chữ | `text-xs` 12 · `text-sm` 14 · `text-base` 16 · `text-lg` 20 · `text-2xl` 28 |
| Cân nặng | 400 · 500 · 600 · 700 (không dùng 800/900) |
| Bo góc | 4px badge/input · 8px card/button · 12px chỉ cho lớp nổi |
| Shadow | 4 bậc nhỏ bị ghim về `none`; chỉ `shadow-lg` (dropdown) và `shadow-xl` (modal) là thật |

### 10.3. Màu biểu đồ

SVG `fill`/`stroke` không nhận class Tailwind nên bắt buộc dùng hex. Toàn bộ được gom về `src/utils/chartColors.js` để tránh bảng màu tồn tại độc lập ở hai nơi.

| Export | Mục đích | Ràng buộc |
| --- | --- | --- |
| `CHART_RAMP` | Thang có thứ tự (funnel, bar) | Mọi bậc ≥ 3:1 so với nền trắng |
| `CHART_SEMANTIC` | Trạng thái tốt/xấu | success · warning · danger · muted |
| `CHART_CATEGORICAL` | Phân loại không thứ tự (line, donut) | Cùng họ xanh-xám |
| `CHART_AXIS` | Lưới, rãnh, nhãn, tooltip | Không mang dữ liệu nên WCAG 1.4.11 không áp |

> WCAG 1.4.11 yêu cầu hình mang thông tin đạt ≥ 3:1. Thang Sky chỉ còn 4 bậc đạt ngưỡng này, nên `CHART_RAMP` rút từ 5 xuống 4 bậc — ramp ít bậc mà đọc được tốt hơn ramp nhiều bậc có hai bậc đầu vô hình.

---

## 11. Bảo mật và xác thực

### 11.1. Luồng JWT hai token

```
Login ──► accessToken  (15 phút, giữ trong RAM — không localStorage)
      └─► refreshToken (7 ngày, cookie httpOnly + sameSite)

Request ──► Bearer accessToken
   │
   ├─ 200 ──► xong
   │
   └─ 401 ──► POST /auth/refresh (cookie tự gửi)
                  │
                  ├─ ok ──► accessToken mới ──► phát lại request gốc
                  └─ fail ──► xoá token ──► /login
```

Access token cố tình **không** lưu vào `localStorage` — nếu có lỗ hổng XSS, script chỉ đọc được token sống 15 phút chứ không lấy được refresh token vì cookie `httpOnly` nằm ngoài tầm với của JavaScript.

### 11.2. Phân quyền RBAC

| Middleware | Kiểm tra |
| --- | --- |
| `protect` | Verify JWT, nạp user từ DB, chặn nếu `isActive === false` |
| `isRecruiter` | `role` ∈ { recruiter, admin } |
| `isAdmin` | `role === 'admin'` |

Kiểm tra quyền sở hữu được thực hiện ở tầng controller: HR chỉ thao tác được trên tin của chính mình, trừ admin.

### 11.3. Các biện pháp khác

| Biện pháp | Chi tiết |
| --- | --- |
| Whitelist role khi đăng ký | Chỉ nhận `candidate` / `recruiter` — gửi `role: 'admin'` từ client sẽ bị bỏ qua |
| Chống mass assignment | Controller destructure từng field, không `Object.assign(doc, req.body)` |
| Băm mật khẩu | bcrypt cost 12, field `select: false` |
| Hash OTP | OTP cũng được hash bcrypt, không lưu plaintext |
| Rate limit | 100 request / 15 phút cho `/api` |
| Validate ObjectId | `mongoose.Types.ObjectId.isValid` trước mọi truy vấn theo id |
| Không lộ thông tin | `forgot-password` luôn trả 200 dù email không tồn tại |

### 11.4. Khuyến nghị trước khi triển khai production

- ⚠️ Thêm rate limit chặt hơn cho `/api/auth/login` (10 lần / 15 phút) để chống dò mật khẩu.
- ⚠️ Thêm xác thực giữa Node và Python — hiện bất kỳ ai biết `localhost:8000/score` đều gọi được.
- ⚠️ Bật HTTPS, đặt `secure: true` cho cookie, cân nhắc `sameSite: 'strict'`.
- ⚠️ Ẩn stack trace trong error handler khi `NODE_ENV === 'production'`.
- ⚠️ Chuyển CV sang chế độ truy cập có ký (signed URL) thay vì public.

---

## 12. Hướng dẫn cài đặt và chạy

### 12.1. Yêu cầu môi trường

| Thành phần | Phiên bản tối thiểu |
| --- | --- |
| Node.js | 18+ |
| Python | 3.10+ |
| MongoDB | 6.x (local hoặc Atlas) |
| RAM | 4GB (model SBERT chiếm ~500MB) |
| Cloudinary | Tài khoản free là đủ |

### 12.2. Thứ tự khởi động

```
MongoDB  ──►  AI Service  ──►  Node.js API  ──►  Frontend
```

AI Service nên chạy trước để lần nộp CV đầu tiên không rơi vào lúc model đang tải.

### 12.3. Bước 1 — Clone và cài dependencies

```bash
git clone https://github.com/minhhir/ATS_Project.git
cd ATS_Project

# Backend Node.js
cd backend-node && npm install && cd ..

# AI Service
cd backend-ai-python
python -m venv .venv
.\.venv\Scripts\Activate.ps1      # Windows PowerShell
# source .venv/bin/activate       # macOS / Linux
pip install -r requirements.txt
cd ..

# Frontend
cd frontend-ats && npm install && cd ..
```

<<<<<<< HEAD
**Lưu ý:** Lần đầu chạy AI service, model `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` sẽ tự động tải về từ HuggingFace Hub. Cần kết nối internet trong lần chạy đầu tiên. Nếu model tải thất bại (không mạng, thiếu ổ đĩa...), `scorer.py` tự fallback về chấm điểm bằng keyword/skill overlap thay vì crash.

### Bước 4 — Cài đặt Frontend

```bash
cd ../frontend-ats
npm install
```

---

## Cấu hình biến môi trường

### `backend-node/.env`

Tạo file `.env` trong thư mục `backend-node/`. Đây là **toàn bộ** các biến mà code thực sự đọc (`grep process.env` trong `src/`):
=======
### 12.4. Bước 2 — Biến môi trường

**`backend-node/.env`**
>>>>>>> 6f5042456f694c423e9c3158f29cb94324249ffa

```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/ats_project_db

<<<<<<< HEAD
# JWT secrets — tự sinh bằng: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_ACCESS_SECRET=<secret_chuỗi_dài>
JWT_REFRESH_SECRET=<secret_khác_dài>
=======
JWT_ACCESS_SECRET=<chuỗi 64 ký tự ngẫu nhiên>
JWT_REFRESH_SECRET=<chuỗi 64 ký tự khác>
>>>>>>> 6f5042456f694c423e9c3158f29cb94324249ffa
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

CLOUDINARY_CLOUD_NAME=<cloud_name>
CLOUDINARY_API_KEY=<api_key>
CLOUDINARY_API_SECRET=<api_secret>

AI_SERVICE_URL=http://localhost:8000

# Tùy chọn — xem ảnh hưởng bên dưới
NODE_ENV=development
```

<<<<<<< HEAD
`NODE_ENV` không bắt buộc nhưng ảnh hưởng 3 chỗ trong code, đáng biết trước khi deploy:
- `authController.js`: cookie `refreshToken` chỉ set cờ `secure` khi `NODE_ENV === 'production'`.
- `authService.js`: OTP quên mật khẩu chỉ được log ra console khi `NODE_ENV !== 'production'`.
- `server.js` (error middleware): `stack` trace chỉ được trả về response khi `NODE_ENV` **đúng bằng** chuỗi `'development'` — để trống hoặc đặt giá trị khác (kể cả không set) sẽ ẩn stack trace.

### `frontend-ats/.env`

Tạo file `.env` trong thư mục `frontend-ats/`. Đây là biến duy nhất mà frontend đọc (`import.meta.env.VITE_API_URL`, dùng ở `src/api/axios.js`):
=======
Sinh secret ngẫu nhiên:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**`frontend-ats/.env`**
>>>>>>> 6f5042456f694c423e9c3158f29cb94324249ffa

```env
VITE_API_URL=http://localhost:5000/api
```

<<<<<<< HEAD
### `backend-ai-python`

**Không cần và không đọc file `.env` nào cả.** `app.py` hard-code `host="0.0.0.0"`, `port=8000` và `MAX_CONCURRENT_TASKS = 5` ngay trong code — muốn đổi phải sửa trực tiếp `app.py`, không có cơ chế override qua biến môi trường.
=======
> `dotenv.config()` phải là **dòng thực thi đầu tiên** trong `server.js`, trước mọi `require` khác. Nếu không, `cloudinary.js` sẽ được nạp trước khi biến môi trường tồn tại và báo `Must supply api_key`.

### 12.5. Bước 3 — Cấu hình Cloudinary

1. Đăng ký tại [cloudinary.com](https://cloudinary.com), vào Dashboard lấy 3 giá trị credentials.
2. Vào **Settings → Security**, cuộn tới **PDF and ZIP files delivery**.
3. Tick **"Allow delivery of PDF and ZIP files"** rồi Save.
>>>>>>> 6f5042456f694c423e9c3158f29cb94324249ffa

> Bước 3 là bắt buộc. Không có nó, Cloudinary trả 401 khi Python tải CV về và mọi hồ sơ sẽ mắc kẹt ở `aiStatus: 'error'`.

### 12.6. Bước 4 — Khởi chạy

| Terminal | Lệnh |
| --- | --- |
| 1 — MongoDB | `mongod` (bỏ qua nếu dùng Atlas) |
| 2 — AI Service | `cd backend-ai-python && python app.py` |
| 3 — Backend | `cd backend-node && npm run dev` |
| 4 — Frontend | `cd frontend-ats && npm run dev` |

Truy cập `http://localhost:5173`.

### 12.7. Bước 5 — Tạo tài khoản Admin

API đã chặn đăng ký role `admin`, nên phải tạo thủ công:

<<<<<<< HEAD
Tại Dashboard, copy 3 giá trị:
- `Cloud name`
- `API Key`
- `API Secret`

Dán vào `backend-node/.env` ở các biến `CLOUDINARY_*`.

### Bước 3 — Bật quyền delivery cho PDF

**Đây là bước quan trọng nhất** — không có bước này thì Python sẽ bị 401/403 khi tải CV về để chấm điểm.

1. Vào **Settings** (icon bánh răng góc trái)
2. Chọn tab **Security**
3. Cuộn xuống mục **PDF and ZIP files delivery**
4. **Tick vào ô "Allow delivery of PDF and ZIP files"**
5. Bấm **Save**

---

## Khởi chạy hệ thống

Mở tối đa **4 terminal riêng biệt** (bỏ Terminal 1 nếu dùng MongoDB Atlas):

### Terminal 1 — MongoDB (nếu dùng local)

```bash
mongod
```

### Terminal 2 — Python AI Service

```bash
cd backend-ai-python

# Kích hoạt venv (nếu chưa)
.\.venv\Scripts\Activate.ps1   # Windows
# source .venv/bin/activate     # macOS/Linux

python app.py
```

Server luôn chạy tại `http://0.0.0.0:8000` (hard-code, xem mục biến môi trường ở trên). Kiểm tra healthcheck: `http://localhost:8000/health`.

### Terminal 3 — Node.js API

```bash
cd backend-node
npm run dev
```

Server chạy tại `http://localhost:5000` (theo `PORT` trong `.env`, mặc định 5000 nếu không set). Healthcheck: truy cập `http://localhost:5000/` sẽ thấy "Backend Mini ATS đang chạy!".

### Terminal 4 — Frontend

```bash
cd frontend-ats
npm run dev
```

Truy cập `http://localhost:5173` để vào ứng dụng.

---

## Tạo tài khoản admin

Vì phía API chặn việc đăng ký role `admin` qua `/api/auth/register` (`authService.js` chỉ whitelist `candidate`/`recruiter`), repo có sẵn script `backend-node/createAdmin.js` để tạo/ép tài khoản admin thẳng vào DB.

**Cách 1 — Dùng script có sẵn (khuyến nghị):**

```bash
cd backend-node
node createAdmin.js
```

Script kết nối tới `MONGODB_URI` trong `.env`, tự hash mật khẩu bằng bcrypt (cost 12) rồi `upsert` (có thì ghi đè, chưa có thì tạo mới) tài khoản:

- Email: `admin@neu.edu.vn`
- Mật khẩu: `admin123`
- Role: `admin`

⚠️ Email/mật khẩu này đang hard-code trong `createAdmin.js` (đã nằm trong source đã commit) — **đổi mật khẩu ngay sau khi đăng nhập lần đầu** và không dùng script này để tạo admin trên môi trường production mà không sửa lại giá trị mặc định.

**Cách 2 — Sửa tay qua mongosh (nếu muốn dùng email khác):**

=======
>>>>>>> 6f5042456f694c423e9c3158f29cb94324249ffa
```bash
mongosh ats_project_db

db.users.updateOne(
    { email: "your-email@example.com" },
    { $set: { role: "admin" } }
)
```

<<<<<<< HEAD
Cách này yêu cầu tài khoản đã tồn tại từ trước (đăng ký thường qua `/register`, mặc định role `candidate`). Đăng nhập lại để nhận quyền admin mới.
=======
Đăng xuất và đăng nhập lại để nhận quyền mới.
>>>>>>> 6f5042456f694c423e9c3158f29cb94324249ffa

---

## 13. Kiểm thử nhanh

<<<<<<< HEAD
*(Hình: sơ đồ thực thể-quan hệ (ERD) của 4 model Mongoose — xuất từ `ats-diagrams.drawio`, trang "7-ERD", vào `docs/images/07-erd.png`.)*

<!-- ![ERD](docs/images/07-erd.png) -->

Cây thư mục dưới đây liệt kê đúng file thật đang có trong repo (đã loại `node_modules`, `.venv`, `dist`, `__pycache__`, các thư mục cấu hình editor/IDE):

```
ATS_Project/
├── backend-node/                    # API Gateway (Node.js / Express 5)
│   ├── createAdmin.js               # Script tạo/ép tài khoản admin (xem mục 8)
│   └── src/
│       ├── config/
│       │   ├── db.js                # Kết nối MongoDB (Mongoose)
│       │   └── cloudinary.js        # Cấu hình SDK Cloudinary
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── jobController.js
│       │   ├── applicationController.js
│       │   ├── adminController.js
│       │   └── notificationController.js
│       ├── middlewares/
│       │   ├── auth.js              # protect — verify JWT + load user
│       │   ├── role.js              # role(), isAdmin, isRecruiter, isCandidate
│       │   └── upload.js            # multer memoryStorage + upload lên Cloudinary
│       ├── models/
│       │   ├── User.js
│       │   ├── Job.js
│       │   ├── Application.js
│       │   └── Notification.js
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── jobRoutes.js
│       │   ├── applicationRoutes.js
│       │   ├── adminRoutes.js
│       │   └── notificationRoutes.js
│       ├── services/
│       │   ├── authService.js       # Logic đăng ký/login/OTP/refresh token
│       │   └── aiService.js         # Gọi Python AI (fire-and-forget) + batch scoring
│       ├── utils/
│       │   └── AppError.js
│       └── server.js                # Entry point
│
├── backend-ai-python/                # AI Microservice (FastAPI)
│   ├── app.py                        # Entry point — endpoint /health, /score
│   ├── requirements.txt
│   └── services/
│       ├── extractor.py              # Tải PDF từ Cloudinary (httpx) + extract text (pdfminer)
│       └── scorer.py                 # Composite scoring: semantic + skill + keyword
│
├── docs/
│   └── images/                       # Hình xuất từ ats-diagrams.drawio (hiện chỉ có .gitkeep, chờ export)
│
├── ats-diagrams.drawio                # Nguồn 10 sơ đồ kiến trúc/luồng/ERD của dự án
│
└── frontend-ats/                     # Web UI (React 19 + Vite)
    └── src/
        ├── api/
        │   ├── axios.js              # Instance axios + interceptor refresh token
        │   └── endpoints.js          # ⚠️ Định nghĩa sẵn authAPI/jobsAPI/applicationsAPI nhưng
        │                             #    KHÔNG được import ở bất kỳ page nào — toàn bộ page gọi
        │                             #    thẳng `api.get/post/...` với path string. Dead code.
        ├── assets/                   # ⚠️ Rỗng — chưa sử dụng. CSS thật nằm trực tiếp ở
        │                             #    src/App.css và src/index.css, không ở đây.
        ├── components/
        │   ├── candidate/JobCard.jsx
        │   ├── layout/ProtectedRoute.jsx
        │   └── shared/
        │       ├── ChangePasswordForm.jsx
        │       ├── NotificationBell.jsx
        │       └── charts/           # BarChart, ChartCard, DonutChart, FunnelChart, LineChart, StatCard
        ├── context/
        │   └── AuthContext.jsx       # Session (accessToken in-memory + /auth/refresh khi mount)
        ├── data/
        │   └── locales/              # ⚠️ Rỗng — chưa sử dụng, chưa có i18n
        ├── hooks/
        │   ├── useChartWidth.js
        │   └── useFocusTrap.js
        ├── layout/                   # AuthLayout, CandidateLayout, RecruiterLayout, AdminLayout, DashboardShell
        ├── pages/
        │   ├── auth/                 # LoginPage, RegisterPage, ForgotPassword, OTPVerify, ResetPassword
        │   ├── candidate/            # JobSearchPage, JobDetailPage, ApplicationsPage, SettingsPage
        │   ├── recruiter/            # DashboardPage, JobsManagePage, JobCreatePage, CandidatesManagePage, SettingsPage
        │   ├── admin/                # AdminDashboardPage, AdminUsersPage, AdminJobsPage, AdminSettingsPage, AdminApplicationDetailPage
        │   ├── shared/NotificationsPage.jsx
        │   └── LandingPage.jsx
        ├── redux/                    # ⚠️ Rỗng — chưa sử dụng, quản lý state hiện tại chỉ dùng Context API
        ├── services/                 # ⚠️ Rỗng — chưa sử dụng
        ├── ui/                       # Badge, Button, Card, ConfirmDialog, Input, Logo, Skeleton, Textarea
        ├── utils/chartColors.js
        ├── App.jsx                   # Toàn bộ route
        └── main.jsx                  # Entry point
=======
### 13.1. Health check từng phân hệ

```bash
curl http://localhost:8000/health
# { "status": "ok", "service": "ai-python" }

curl http://localhost:5000/
# Backend Mini ATS đang chạy!
>>>>>>> 6f5042456f694c423e9c3158f29cb94324249ffa
```

### 13.2. Test AI Service độc lập

```bash
curl -X POST http://localhost:8000/score \
  -H "Content-Type: application/json" \
  -d '{
    "cv_url": "https://res.cloudinary.com/.../cv.pdf",
    "jd_text": "Tuyển Frontend Developer có kinh nghiệm React, TypeScript, Tailwind CSS. Yêu cầu hiểu biết về RESTful API và tối ưu hiệu năng web.",
    "jd_skills": ["React", "TypeScript", "Tailwind CSS"]
  }'
```

<<<<<<< HEAD
*(Hình: route map theo vai trò — xuất từ `ats-diagrams.drawio`, trang "10-Route-map-vai-tro", vào `docs/images/10-route-map-vai-tro.png`.)*

<!-- ![Route map theo vai trò](docs/images/10-route-map-vai-tro.png) -->

Các bảng dưới liệt kê route **đúng theo thứ tự khai báo thật** trong từng file ở `backend-node/src/routes/`. Cột "Quyền" ghi middleware thật đang gắn trên route đó — `isRecruiter` trong code cho phép cả `recruiter` lẫn `admin` (không chỉ recruiter), `isCandidate` chỉ cho `candidate`.

### Auth (`/api/auth`)
| Method | Endpoint | Quyền |
|---|---|---|
| POST | `/register` | Public (rate-limit 20 req/15 phút/IP) |
| POST | `/login` | Public (rate-limit 20 req/15 phút/IP) |
| POST | `/refresh` | Public — đọc cookie `refreshToken`, rotate cả 2 token |
| POST | `/logout` | Public — xóa cookie `refreshToken` |
| GET | `/me` | protect |
| POST | `/forgot-password` | Public — luôn trả success để không lộ email tồn tại |
| POST | `/verify-otp` | Public |
| POST | `/reset-password` | Public |
| PUT | `/profile` | protect — multipart (`avatar`, `cv`, mỗi field 1 file) |
| PUT | `/change-password` | protect |

### Jobs (`/api/jobs`)
| Method | Endpoint | Quyền |
|---|---|---|
| GET | `/` | Public — lọc `isActive: true` **và** `approvalStatus: 'approved'`, chỉ tin đã duyệt mới lọt vào danh sách/tìm kiếm công khai |
| GET | `/featured` | Public — lọc `isActive && isFeatured && approvalStatus: 'approved'`, tối đa 6 tin. Endpoint tồn tại và hoạt động nhưng **không có page/component nào ở frontend gọi tới** (kể cả `LandingPage.jsx` cũng không fetch job nào) — chỉ được khai báo trong `endpoints.js` vốn cũng không được import ở đâu |
| GET | `/my-jobs` | protect + isRecruiter |
| GET | `/recruiter` | protect + isRecruiter — dropdown chọn job, chỉ trả `_id title isActive` |
| GET | `/stats/summary` | protect + isRecruiter — KPI dashboard |
| GET | `/stats/analytics` | protect + isRecruiter — dữ liệu biểu đồ |
| GET | `/:id` | Public có điều kiện — tin `approved` ai xem cũng được; tin `pending`/`rejected` chỉ chủ tin hoặc admin |
| PATCH | `/:id/feature` | protect + **isAdmin** — ⚠️ route này nằm trong `jobRoutes.js` cùng nhóm các route recruiter nhưng **chỉ admin** gọi được, không phải chủ tin (recruiter) |
| POST | `/` | protect + isRecruiter (từ đây route dùng `router.use(protect, isRecruiter)`) |
| PUT | `/:id` | protect + isRecruiter, controller check thêm chỉ chủ tin hoặc admin |
| DELETE | `/:id` | protect + isRecruiter, controller check thêm chỉ chủ tin hoặc admin — soft delete |

### Applications (`/api/applications`)
| Method | Endpoint | Quyền |
|---|---|---|
| POST | `/:jobId/apply` | protect + isCandidate + `upload.single('cv')` |
| GET | `/me` | protect + isCandidate |
| GET | `/job/:jobId` | protect + isRecruiter — `jobId='all'` gộp mọi tin của recruiter đang login |
| PATCH | `/:id/feature` | protect + isRecruiter |
| POST | `/:id/score` | protect + isRecruiter — trigger lại AI |
| PATCH | `/:id/status` | protect + isRecruiter |
| POST | `/:id/report` | protect + isRecruiter — *(đã sửa: trước đây chỉ có `protect`, không có role guard ở route, chỉ dựa vào controller tự so khớp `job.recruiter === req.user.id`; đã thêm `isRecruiter` cùng pattern các route recruiter-only khác trong file, controller vẫn giữ nguyên check ownership làm lớp phòng thủ thứ hai)* |

### Admin (`/api/admin`)
| Method | Endpoint | Quyền |
|---|---|---|
| GET | `/dashboard` | protect + checkAdmin (middleware `checkAdmin` cục bộ khai báo ngay trong `adminRoutes.js`, tương đương `isAdmin`) |
| GET | `/analytics` | protect + checkAdmin |
| GET | `/reports` | protect + checkAdmin — danh sách đơn bị report |
| GET | `/users` | protect + checkAdmin |
| GET | `/users/:id` | protect + checkAdmin |
| DELETE | `/users/:id` | protect + checkAdmin — cascade xóa job/application |
| GET | `/jobs` | protect + checkAdmin — mọi trạng thái duyệt |
| PATCH | `/jobs/:id/approve` | protect + checkAdmin |
| DELETE | `/jobs/:id` | protect + checkAdmin — cascade xóa application + notify |
| GET | `/applications/:id` | protect + checkAdmin ✅ — đã guard đầy đủ ở cả backend lẫn frontend (`/admin/applications/:id` trong `App.jsx` có `ProtectedRoute allowedRoles={['admin']}`) |
| DELETE | `/applications/:id` | protect + checkAdmin |

### Notifications (`/api/notifications`)
| Method | Endpoint | Quyền |
|---|---|---|
| GET | `/` | protect — trả **10** thông báo mới nhất |
| PUT | `/read-all` | protect |
| PATCH | `/:id/read` | protect — chỉ đánh dấu đọc thông báo của chính user (filter theo `recipient`) |
=======
Hoặc dùng Swagger UI tự sinh tại `http://localhost:8000/docs`.

### 13.3. Luồng end-to-end

| Bước | Thao tác | Kết quả mong đợi |
| --- | --- | --- |
| 1 | Đăng ký tài khoản recruiter | Redirect `/recruiter/dashboard` |
| 2 | Đăng tin tuyển dụng | Tin ở trạng thái chờ duyệt |
| 3 | Đăng nhập admin, duyệt tin | Tin chuyển sang approved |
| 4 | Đăng ký candidate, tìm việc | Tin vừa duyệt xuất hiện |
| 5 | Nộp CV PDF | Nhận 201 ngay, không phải chờ |
| 6 | Đợi 5–10 giây, HR xem ứng viên | `aiScore` hiện ra, `aiStatus: done` |
| 7 | HR đổi trạng thái sang shortlisted | Candidate nhận thông báo |
| 8 | F5 trang bất kỳ | Vẫn giữ đăng nhập |
>>>>>>> 6f5042456f694c423e9c3158f29cb94324249ffa

---

## 14. Xử lý sự cố thường gặp

<<<<<<< HEAD
### Luồng 1 — Nộp CV và chấm AI tự động (Fire-and-Forget)

*(Hình: luồng nộp CV và pipeline chấm điểm AI chi tiết — xuất từ `ats-diagrams.drawio`, trang "5-Luong-nop-CV" và "8-Pipeline-AI-chi-tiet".)*

<!-- ![Luồng nộp CV](docs/images/05-luong-nop-cv.png) -->
<!-- ![Pipeline AI chi tiết](docs/images/08-pipeline-ai-chi-tiet.png) -->

1. Candidate gửi PDF qua form upload (`POST /api/applications/:jobId/apply`)
2. Node.js validate file (chỉ PDF/ảnh theo mimetype, max 5MB), giữ trong RAM dạng Buffer (`multer.memoryStorage`)
3. Node.js stream Buffer lên Cloudinary, nhận `secure_url`
4. Node.js tạo bản ghi `Application` (`aiStatus: 'pending'`), tăng `applicantCount` của job (`$inc` atomic), tạo `Notification` cho recruiter
5. **Trả 201 cho candidate ngay** (không chờ AI)
6. Node.js gọi ngầm sang Python AI: `POST /score` (timeout 60s, không chặn response đã trả ở bước 5)
7. Python (`app.py` → `scorer.py`):
    - Đi qua `asyncio.Semaphore` (tối đa 5 task chấm điểm đồng thời)
    - Tải PDF từ Cloudinary (`extractor.py`, giới hạn 10MB), extract text bằng `pdfminer`; nếu text < 50 ký tự → trả lỗi 422 (nghi ngờ PDF scan ảnh)
    - Tokenize CV/JD, loại stop-word (Anh + Việt); nếu CV < 10 từ khóa hoặc JD < 5 từ khóa → trả thẳng điểm 0
    - Tính 3 tín hiệu độc lập: `semantic` (cosine similarity từ Sentence-Transformer, có thể `None` nếu model load lỗi), `skill_cov` (tỷ lệ skill JD khớp trong CV bằng regex word-boundary, `None` nếu job không khai skill), `kw_cov` (độ phủ từ khóa JD trong CV)
    - Trộn composite theo tín hiệu nào có mặt, ưu tiên semantic > skill > keyword — trọng số **luôn cộng lại đúng 1**:
      - Có đủ cả 3: `0.55×semantic + 0.25×skill + 0.20×keyword`
      - Không có skill (job không khai): `0.65×semantic + 0.35×keyword`
      - Không có semantic (model load lỗi): `0.55×skill + 0.45×keyword`
      - Chỉ có keyword: `= keyword`
    - Nếu có semantic: nhân thêm hệ số `×1.1` rồi clamp về tối đa 1.0 (bù cho việc cosine similarity của model multilingual hiếm khi vượt 0.85 với văn bản thật)
    - Trả về `{ score (0-100, làm tròn 1 chữ số thập phân), matched_keywords, summary }`
8. Node.js cập nhật `aiScore`, `aiSummary` và `aiStatus: 'done'` vào DB. Nếu bất kỳ bước nào ở Python lỗi/timeout, Node.js set `aiStatus: 'error'` (recruiter có thể bấm "chấm lại AI" — `POST /api/applications/:id/score` — để retry)

### Luồng 2 — Duyệt tin tuyển dụng

*(Hình: trạng thái tin tuyển dụng — xuất từ `ats-diagrams.drawio`, trang "9-Trang-thai-Job".)*

<!-- ![Trạng thái Job](docs/images/09-trang-thai-job.png) -->

1. Recruiter tạo job (`POST /api/jobs`) → backend luôn set `approvalStatus: 'pending'` (schema default, không nhận field này từ body)
2. Job không hiển thị ở danh sách/tìm kiếm công khai (`GET /api/jobs`) lẫn tin nổi bật (`GET /api/jobs/featured`) chừng nào còn `pending`/`rejected` — cả hai endpoint đều lọc `approvalStatus: 'approved'`
3. Trang chi tiết (`GET /api/jobs/:id`) cũng đúng thiết kế: tin `pending`/`rejected` chỉ chủ tin hoặc admin xem được, người khác nhận 403
4. Admin truy cập `/admin/jobs` (frontend), gọi `GET /api/admin/jobs` để xem tất cả jobs mọi trạng thái
5. Admin gửi `PATCH /api/admin/jobs/:id/approve` với body `{ status: 'approved' | 'rejected' }`
6. Tin `approved` chính thức hiển thị công khai; `rejected` vẫn tồn tại trong DB nhưng không public ở bất kỳ endpoint nào

> **Đã sửa (trước đây có bug):** `jobController.js` từng khai `const filter = { isActive, approvalStatus: 'approved' }` ở cấp module nhưng bị shadow bởi `const filter = { isActive: true }` khai lại bên trong `getJobs` — khiến tin `pending`/`rejected` từng lọt vào danh sách/tìm kiếm công khai dù trang chi tiết vẫn chặn đúng. Đã sửa bằng cách khai đúng `approvalStatus: 'approved'` ngay trong scope hàm ở cả `getJobs` và `getFeaturedJobs`, và xác nhận bằng test thủ công (seed 1 job `pending`, gọi `GET /api/jobs` không token → không xuất hiện; approve lại → xuất hiện; set `rejected` → biến mất lại).

### Luồng 3 — Báo cáo và xử lý đơn ứng tuyển vi phạm

*(Hình: trạng thái đơn ứng tuyển — xuất từ `ats-diagrams.drawio`, trang "6-Trang-thai-don".)*

<!-- ![Trạng thái đơn ứng tuyển](docs/images/06-trang-thai-don.png) -->

1. Recruiter nghi ngờ một CV giả mạo/spam → `POST /api/applications/:id/report` kèm `reason`, controller so khớp `job.recruiter` với người gọi trước khi set `report.isReported = true`
2. Admin xem danh sách báo cáo qua `GET /api/admin/reports` (sort theo `reportedAt` mới nhất)
3. Admin mở chi tiết (`GET /api/admin/applications/:id`), quyết định xóa (`DELETE /api/admin/applications/:id`)
4. Trước khi xóa, backend tạo `Notification` cảnh báo cho candidate (populate `job.title` trước vì sau khi xóa sẽ mất context), sau đó mới `findByIdAndDelete`
=======
| Triệu chứng | Nguyên nhân khả dĩ | Cách xử lý |
| --- | --- | --- |
| `Must supply api_key` khi nộp CV | `dotenv.config()` không ở dòng đầu `server.js`, hoặc `cloudinary.js` có `require('dotenv')` thừa | Đưa `dotenv.config()` lên trước mọi `require`, xoá dotenv trong `cloudinary.js` |
| Python báo `Lỗi HTTP khi tải file: 401` | Cloudinary chặn delivery PDF | Settings → Security → tick "Allow delivery of PDF and ZIP files". CV cũ vẫn lỗi, chỉ CV nộp sau khi tick mới chạy |
| AI luôn trả `0/100` | JD quá ngắn — dưới ngưỡng 5 từ khoá | Điền đủ `description` + `requirements`. Node gộp cả hai trước khi gửi Python |
| Hồ sơ kẹt `aiStatus: 'error'` | Lỗi tại thời điểm chấm, không tự retry | Gọi `POST /api/applications/:id/score` để chấm lại |
| Upload CV nhận `[object Object]` | Axios bị ép `Content-Type: application/json` | Không set cứng header cho `FormData` |
| Đăng nhập xong F5 bị đá ra | `AuthContext` thiếu `useEffect` gọi `/auth/refresh`, hoặc `loading` khởi tạo `false` | Kiểm tra `checkSession` chạy khi mount và `useState(true)` |
| Frontend reload vô tận | `useEffect` thiếu dependency array, hoặc có biến trong deps bị set lại bên trong chính effect đó | Thêm `[]`, hoặc tách state ra khỏi deps |
| Route `/my-jobs` trả 404 | Khai báo sau `/:id` nên Express hiểu `my-jobs` là một id | Đưa mọi route tĩnh lên trước route động |
| Một khối bị trắng trơn | Class tham chiếu token đã bị xoá khỏi `tailwind.config.js` | `npm run build` rồi `grep -c "\.bg-<tên>" dist/assets/*.css` — trả về 0 là token đã chết |
| `Cannot find module '@tailwindcss/forms'` | Plugin khai báo trong config nhưng chưa cài | `npm install -D @tailwindcss/forms` |
| Model SBERT tải chậm lần đầu | ~117MB tải từ Hugging Face | Bình thường, chỉ xảy ra một lần. Nếu thất bại, `scorer.py` tự chuyển sang chấm bằng keyword |
| MongoDB không kết nối được | Sai URI hoặc chưa khởi động | Kiểm tra `MONGODB_URI`, chạy `mongod`. Với Atlas cần whitelist IP |
>>>>>>> 6f5042456f694c423e9c3158f29cb94324249ffa

---

## 15. Hướng phát triển tiếp theo

<<<<<<< HEAD
### Backend Node.js không kết nối được MongoDB
- Kiểm tra `MONGODB_URI` trong `.env`
- Nếu dùng local, đảm bảo MongoDB đang chạy: `mongod`
- Nếu dùng Atlas, whitelist IP của bạn trong Network Access

### Không nhận được OTP quên mật khẩu
- Hệ thống **chưa gửi email thật** — `authService.js` chỉ `console.log` OTP ra terminal đang chạy `npm run dev` của `backend-node`, và chỉ khi `NODE_ENV !== 'production'`
- Nếu deploy với `NODE_ENV=production`, flow OTP hiện tại sẽ không có cách nào lấy được mã — cần tự tích hợp một dịch vụ gửi email trước khi dùng production

### Python AI báo lỗi 401/403 khi tải CV
- Vào Cloudinary Dashboard → Settings → Security
- Tick "Allow delivery of PDF and ZIP files" → Save
- Các CV cũ vẫn bị lỗi, chỉ CV nộp sau khi tick mới hoạt động

### Lỗi `Must supply api_key` khi nộp CV
- Kiểm tra `CLOUDINARY_*` trong `backend-node/.env`
- Đảm bảo `dotenv.config()` là dòng đầu tiên trong `server.js`

### Frontend reload liên tục / trắng trang sau khi đổi code
- Kiểm tra `useEffect` có dependency array đúng
- Clear Vite cache: `rm -rf node_modules/.vite` rồi `npm run dev`

### AI luôn trả 0/100 điểm
- Extractor (Python) từ chối PDF có text < 50 ký tự (nghi ngờ file scan ảnh, không có text layer) — lỗi 422
- `scorer.py` trả thẳng 0 điểm nếu sau khi tokenize và loại stop-word, CV còn dưới **10** từ khóa hoặc JD còn dưới **5** từ khóa — kiểm tra job có `description`/`requirements` đủ nội dung thực chất, không phải JD viết vài dòng ngắn

### CV cũ bị kẹt `aiStatus: 'error'`
- Mở MongoDB Compass, vào collection `applications`, sửa `aiStatus` về `'pending'`
- Hoặc gọi lại `POST /api/applications/:id/score` (cần đăng nhập với vai trò `recruiter` hoặc `admin`, và phải là chủ tin hoặc admin)

### Đăng nhập xong F5 bị về login
- Đảm bảo `AuthContext.jsx` có `useEffect` gọi `POST /auth/refresh` rồi `GET /auth/me` khi mount (đã có sẵn trong code)
- Kiểm tra cookie `refreshToken` được set với `httpOnly`, `sameSite: 'strict'`, và `secure` khớp với việc bạn có chạy HTTPS hay không (`secure` chỉ bật khi `NODE_ENV=production`)

---

## Công nghệ sử dụng

**Frontend:**
- React 19 + Vite
- React Router v7
- Tailwind CSS 3 + `@tailwindcss/forms` + `tailwindcss-animate`
- lucide-react (icon)
- Axios với interceptor tự refresh token (hàng đợi request khi đang refresh, rotate token khi 401)
- `clsx` + `tailwind-merge` (ghép class có điều kiện)
- `@tanstack/react-query` có trong `package.json` nhưng **không được dùng ở đâu trong code** — mọi trang tự quản lý fetch bằng `useState`/`useEffect` gọi thẳng axios

**Backend Node.js:**
- Express 5
- Mongoose 9 (MongoDB ODM)
- bcryptjs (hash password, cost 12)
- jsonwebtoken (access + refresh token)
- multer + cloudinary + streamifier (upload file qua RAM buffer, không lưu đĩa)
- helmet, cors, express-rate-limit, cookie-parser (bảo mật)

**Backend Python:**
- FastAPI + Uvicorn
- pdfminer.six (trích xuất text từ PDF)
- sentence-transformers + torch (semantic similarity, model `paraphrase-multilingual-MiniLM-L12-v2`)
- httpx (tải PDF async, streaming, giới hạn size)
- pydantic (validate request/response)

**Database & Storage:**
- MongoDB
- Cloudinary (CV PDF + avatar)
=======
- [ ] 🔐 Thêm xác thực giữa Node và Python (header `X-Internal-Key`) — hiện AI Service không kiểm tra nguồn gọi.
- [ ] 📧 Gửi OTP qua email thật thay vì log ra console.
- [ ] 🔁 Cơ chế retry có backoff cho `aiService` khi Python tạm thời không phản hồi.
- [ ] 📄 Trả về trích đoạn minh chứng từ CV cho mỗi kỹ năng khớp, không chỉ tên kỹ năng.
- [ ] 🔎 OCR cho CV dạng ảnh scan — hiện bị từ chối với mã 422.
- [ ] ⚡ Chuyển từ short-polling 30 giây sang WebSocket cho thông báo realtime.
- [ ] 🧪 Bổ sung unit test cho `scorer.py` và integration test cho luồng nộp CV.
- [ ] 📦 Đóng gói Docker Compose để chạy cả 3 phân hệ bằng một lệnh.
- [ ] 📊 Thêm observability: log tập trung, trace ID xuyên 3 phân hệ.
- [ ] 🌍 Tách chuỗi tiếng Việt sang resource bundle để hỗ trợ đa ngôn ngữ.
- [ ] 🔗 Signed URL cho CV thay vì để public trên Cloudinary.
>>>>>>> 6f5042456f694c423e9c3158f29cb94324249ffa

---

## Tác giả

<<<<<<< HEAD
**Hoàng Năng Minh** — Xây dựng hệ thống ATS tích hợp AI chấm điểm CV tự động
=======
**Hoàng Năng Minh** — Xây dựng hệ thống Web hỗ trợ quản lý quy trình tuyển dụng và sàng lọc ứng viên
>>>>>>> 6f5042456f694c423e9c3158f29cb94324249ffa

---

## License

Dự án phát triển cho mục đích học tập. Vui lòng không sử dụng cho mục đích thương mại nếu chưa có sự đồng ý của tác giả.
