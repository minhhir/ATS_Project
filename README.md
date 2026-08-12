# Mini ATS — Hệ thống quản lý tuyển dụng tích hợp AI sàng lọc hồ sơ

Mini ATS là một hệ thống Applicant Tracking System thu nhỏ, thiết kế theo mô hình phân tán với 3 phân hệ chạy độc lập: **Frontend React**, **Node.js API Gateway**, và **Python AI Microservice**. Ứng viên nộp CV dạng PDF, hệ thống tự động chấm điểm độ phù hợp với JD bằng công thức tổ hợp giữa **semantic similarity** (Sentence-Transformer đa ngôn ngữ Việt-Anh), **skill matching** (đối chiếu từng kỹ năng JD yêu cầu) và **keyword overlap** (độ phủ từ khóa) — không dùng TF-IDF cổ điển.

---

## Mục lục

1. [Giới thiệu dự án](#1-giới-thiệu-dự-án)
2. [Kiến trúc tổng thể](#2-kiến-trúc-tổng-thể)
3. [Công nghệ sử dụng](#3-công-nghệ-sử-dụng)
4. [Cấu trúc thư mục](#4-cấu-trúc-thư-mục)
5. [Module Backend (Node.js)](#5-module-backend-nodejs)
6. [Module AI Service (FastAPI)](#6-module-ai-service-fastapi)
7. [Module Frontend (React + Vite)](#7-module-frontend-react--vite)
8. [Các luồng nghiệp vụ chính](#8-các-luồng-nghiệp-vụ-chính)
9. [Mô hình dữ liệu](#9-mô-hình-dữ-liệu)
10. [Hệ thống thiết kế frontend](#10-hệ-thống-thiết-kế-frontend)
11. [Bảo mật và xác thực](#11-bảo-mật-và-xác-thực)
12. [Cấu hình và khởi chạy](#12-cấu-hình-và-khởi-chạy)
13. [Kiểm thử nhanh](#13-kiểm-thử-nhanh)
14. [Vấn đề đã biết và hạn chế](#14-vấn-đề-đã-biết-và-hạn-chế)
15. [Hướng phát triển tiếp theo](#15-hướng-phát-triển-tiếp-theo)

---

## 1. Giới thiệu dự án

Mini ATS tự động hoá khâu tốn thời gian nhất của quy trình tuyển dụng: đọc và sàng lọc hồ sơ ứng viên. Hệ thống có 3 vai trò người dùng.

### Ứng viên (Candidate)
- Đăng ký, đăng nhập (JWT access token 15 phút + refresh token trong cookie httpOnly, tự rotate khi hết hạn)
- Quên mật khẩu qua OTP 6 số
- Tìm việc với bộ lọc đa chiều: từ khoá, địa điểm, cấp bậc, loại hình, mức lương
- Nộp CV PDF, hệ thống tự động chấm điểm độ phù hợp với JD
- Theo dõi trạng thái đơn ứng tuyển: `applied → reviewing → shortlisted → interviewed → offered / rejected`
- Nhận thông báo (polling 30 giây) khi trạng thái đơn thay đổi
- Cập nhật hồ sơ cá nhân (avatar, CV, kỹ năng), đổi mật khẩu

### Nhà tuyển dụng (Recruiter)
- Đăng tin tuyển dụng — mọi tin mới luôn ở trạng thái `approvalStatus: 'pending'`, cần admin duyệt mới hiển thị công khai
- Sửa, xoá mềm (`isActive: false`) tin của chính mình
- Xem danh sách ứng viên theo từng tin hoặc gộp tất cả tin của mình
- Đổi trạng thái đơn ứng tuyển, đánh dấu ứng viên nổi bật, yêu cầu chấm lại điểm AI
- Báo cáo đơn ứng tuyển nghi ngờ gian lận cho admin xử lý
- Dashboard: KPI tổng quan + biểu đồ xu hướng đơn, phễu trạng thái, top tin nhiều ứng viên nhất

### Quản trị viên (Admin)
- Duyệt hoặc từ chối tin tuyển dụng mới đăng
- Đánh dấu tin nổi bật (`isFeatured`) — đặc quyền riêng của admin, recruiter kể cả chủ tin cũng không gọi được endpoint này
- Quản lý người dùng: xem danh sách, xem chi tiết, xoá tài khoản vĩnh viễn kèm cascade xoá job/application liên quan
- Quản lý toàn bộ tin tuyển dụng (kể cả pending/rejected), xoá tin vi phạm
- Xem và xử lý báo cáo vi phạm do recruiter gửi lên, xoá đơn vi phạm
- Dashboard thống kê toàn hệ thống

Dự án gồm 3 phân hệ giao tiếp qua REST:

| Phân hệ | Thư mục | Cổng mặc định |
| --- | --- | --- |
| Frontend — React + Vite | `frontend-ats/` | 5173 |
| API Gateway — Node.js + Express | `backend-node/` | 5000 (đọc từ `PORT`, mặc định 5000 nếu không set) |
| AI Microservice — Python + FastAPI | `backend-ai-python/` | 8000 (hard-code trong `app.py`) |

---

## 2. Kiến trúc tổng thể

### 2.1. Sơ đồ kiến trúc

![Kiến trúc tổng thể](docs/images/01-kien-truc-tong-the.png)

![Sơ đồ triển khai](docs/images/02-trien-khai.png)

**Tại sao tách 3 phân hệ:**
- AI Service viết riêng bằng Python vì cần PyTorch + sentence-transformers (thư viện nặng), không nên nằm cùng server xử lý request thông thường.
- Node.js Gateway xử lý toàn bộ nghiệp vụ, kết nối DB và file storage.
- Frontend là SPA thuần, không biết gì về logic backend.

**Giao tiếp Node.js ↔ Python:** một chiều, fire-and-forget. Node gọi `POST {AI_SERVICE_URL}/score` **sau khi đã trả response 201 cho candidate**, với timeout 60 giây (đủ dài để chịu được lần load model đầu tiên của SBERT, có thể mất 1–2 phút). Python không bao giờ gọi ngược lại Node. Đây cũng là gọi server-to-server thuần tuý — trình duyệt không bao giờ gọi trực tiếp Python.

**Giao tiếp Python ↔ Cloudinary:** Python không nhận file CV trực tiếp từ Node, mà tự tải PDF về bằng `cv_url` (một URL Cloudinary public) qua `httpx`, streaming theo từng chunk 8KB, giới hạn 10MB.

### 2.2. Nguyên tắc thiết kế

| Nguyên tắc | Áp dụng |
| --- | --- |
| Fire and forget | Node trả `201 Created` cho candidate ngay sau khi lưu DB; việc chấm điểm chạy ngầm, người dùng không phải chờ |
| Kiểm soát tài nguyên | AI Service dùng `asyncio.Semaphore(5)` giới hạn số tác vụ chấm điểm đồng thời |
| Tách I/O và CPU | Tải PDF là I/O-bound, chạy async; trích xuất text (pdfminer) và chấm điểm là CPU-bound, đẩy sang `asyncio.to_thread` để không khoá event loop |
| Stateless JWT | Access token 15 phút giữ trong bộ nhớ trình duyệt (không localStorage), refresh token 7 ngày trong cookie `httpOnly` |
| Không ghi file tạm ở Node | Multer dùng `memoryStorage`, buffer stream thẳng lên Cloudinary |
| Graceful fallback | Nếu model SBERT không tải được, `scorer.py` vẫn chấm bằng skill + keyword overlap thay vì lỗi toàn bộ |

---

## 3. Công nghệ sử dụng

### 3.1. Frontend (`frontend-ats/`)

| Thư viện | Phiên bản | Vai trò |
| --- | --- | --- |
| React | ^19.2.4 | UI framework |
| Vite | ^8.0.4 | Bundler / dev server |
| React Router DOM | ^7.14.0 | Định tuyến, `ProtectedRoute` theo vai trò |
| Tailwind CSS | ^3.4.19 | Utility-first CSS |
| @tailwindcss/forms | ^0.5.11 | Reset style cho form |
| tailwindcss-animate | ^1.0.7 | Animation utility cho trang auth |
| Axios | 1.14.0 | HTTP client + interceptor refresh token |
| lucide-react | ^1.7.0 | Bộ icon dạng đường |
| clsx + tailwind-merge | ^2.1.1 / ^3.5.0 | Gộp class có điều kiện, chống xung đột |

> `@tanstack/react-query` (^5.96.2) có trong `package.json` nhưng **không được import ở bất kỳ đâu trong `src/`** — toàn bộ trang tự quản lý fetch bằng `useState`/`useEffect` gọi thẳng axios. Xem [mục 14](#14-vấn-đề-đã-biết-và-hạn-chế).

Không có thư viện chart nào (Recharts, Chart.js...) trong dependencies — toàn bộ biểu đồ ở `src/components/shared/charts/` là SVG viết tay.

### 3.2. Backend Node.js (`backend-node/`)

| Thư viện | Phiên bản | Vai trò |
| --- | --- | --- |
| Express | ^5.2.1 | REST framework |
| Mongoose | ^9.2.4 | ODM cho MongoDB |
| jsonwebtoken | ^9.0.3 | Ký và xác thực JWT |
| bcryptjs | ^3.0.3 | Băm mật khẩu (cost 12) |
| multer | ^2.1.1 | Nhận multipart/form-data vào RAM |
| cloudinary | ^2.9.0 | SDK upload CV/avatar |
| streamifier | ^0.1.1 | Chuyển buffer thành stream để pipe lên Cloudinary |
| helmet | ^8.1.0 | HTTP security headers |
| cors | ^2.8.6 | Cấu hình cross-origin có credentials |
| express-rate-limit | ^8.3.0 | Giới hạn request |
| cookie-parser | ^1.4.7 | Đọc refresh token từ cookie |
| axios | ^1.13.6 | Gọi sang AI Service |
| dotenv | ^17.3.1 | Nạp biến môi trường |
| nodemon (dev) | ^3.1.14 | Auto-restart khi phát triển |

### 3.3. AI Service (`backend-ai-python/`)

| Thư viện | Phiên bản | Vai trò |
| --- | --- | --- |
| fastapi | 0.115.0 | Web framework bất đồng bộ |
| uvicorn[standard] | 0.24.0 | ASGI server |
| pdfminer.six | 20221105 | Trích xuất văn bản thuần từ PDF |
| sentence-transformers | 2.7.0 | Mô hình nhúng ngữ nghĩa đa ngôn ngữ |
| torch | 2.2.2 | Backend tính toán cho SBERT |
| numpy | 1.26.4 | Tính cosine similarity |
| httpx | 0.25.2 | HTTP client async, hỗ trợ streaming |
| pydantic | 2.7.0 | Kiểm soát schema request/response |
| python-multipart | 0.0.6 | Khai báo trong requirements nhưng không dùng — service nhận CV qua `cv_url`, không qua multipart upload |

Model dùng: `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` — hỗ trợ cả tiếng Việt và tiếng Anh, tải tự động từ HuggingFace Hub ở lần gọi `/score` đầu tiên (không preload lúc khởi động).

---

## 4. Cấu trúc thư mục

```
ATS_Project/
├── ats-diagrams.drawio               # Nguồn 10 sơ đồ trong docs/images/
├── docs/images/                      # 10 hình PNG xuất từ file drawio trên
│
├── backend-node/                     # API Gateway
│   ├── createAdmin.js                # Script tạo/ép tài khoản admin — chạy tay, không nằm trong npm scripts
│   └── src/
│       ├── server.js                 # Entry point
│       ├── config/
│       │   ├── db.js                 # Kết nối MongoDB
│       │   └── cloudinary.js         # Cấu hình Cloudinary SDK
│       ├── models/
│       │   ├── User.js
│       │   ├── Job.js
│       │   ├── Application.js
│       │   └── Notification.js
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── jobController.js
│       │   ├── applicationController.js
│       │   ├── adminController.js
│       │   └── notificationController.js
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── jobRoutes.js
│       │   ├── applicationRoutes.js
│       │   ├── notificationRoutes.js
│       │   └── adminRoutes.js
│       ├── middlewares/
│       │   ├── auth.js               # protect — verify JWT, nạp req.user
│       │   ├── role.js               # role(), isAdmin, isRecruiter, isCandidate
│       │   └── upload.js             # multer memoryStorage + uploadToCloudinary
│       ├── services/
│       │   ├── authService.js        # Đăng ký/đăng nhập/OTP/refresh token
│       │   └── aiService.js          # Gọi Python (fire-and-forget) + batch scoring
│       └── utils/
│           └── AppError.js
│
├── backend-ai-python/                # AI Microservice
│   ├── app.py                        # FastAPI entry — /health, /score, Semaphore
│   ├── requirements.txt
│   └── services/
│       ├── extractor.py              # Tải PDF (httpx) + trích xuất text (pdfminer)
│       └── scorer.py                 # Composite scoring
│
└── frontend-ats/                     # Web UI
    ├── vite.config.js
    ├── tailwind.config.js            # Design tokens — nguồn chân lý duy nhất, có ghi chú tỉ lệ tương phản WCAG
    └── src/
        ├── App.jsx                   # Toàn bộ route
        ├── main.jsx                  # Entry point
        ├── App.css                   # CSS mặc định của Vite scaffold — không được import ở đâu, cần dọn
        ├── index.css                 # Style thật của app
        ├── api/
        │   ├── axios.js              # Instance + interceptor refresh token
        │   └── endpoints.js          # authAPI/jobsAPI/applicationsAPI — khai báo sẵn nhưng không nơi nào import
        ├── context/
        │   └── AuthContext.jsx       # checkSession, login, logout, updateUser
        ├── hooks/
        │   ├── useChartWidth.js      # ResizeObserver cho SVG chart
        │   └── useFocusTrap.js       # Dùng chung ConfirmDialog
        ├── layout/                   # AuthLayout, DashboardShell, CandidateLayout, RecruiterLayout, AdminLayout
        ├── ui/                       # Badge, Button, Card, ConfirmDialog, Input, Logo, Skeleton, Textarea
        ├── components/
        │   ├── candidate/JobCard.jsx
        │   ├── layout/ProtectedRoute.jsx
        │   └── shared/
        │       ├── NotificationBell.jsx     # Polling 30s
        │       ├── ChangePasswordForm.jsx
        │       └── charts/                  # BarChart, LineChart, DonutChart, FunnelChart, StatCard, ChartCard — SVG viết tay
        ├── pages/
        │   ├── LandingPage.jsx
        │   ├── auth/          # LoginPage, RegisterPage, ForgotPassword, OTPVerify, ResetPassword
        │   ├── candidate/     # JobSearchPage, JobDetailPage, ApplicationsPage, SettingsPage
        │   ├── recruiter/     # DashboardPage, JobsManagePage, JobCreatePage, CandidatesManagePage, SettingsPage
        │   ├── admin/         # AdminDashboardPage, AdminUsersPage, AdminJobsPage, AdminSettingsPage, AdminApplicationDetailPage
        │   └── shared/NotificationsPage.jsx
        ├── utils/
        │   └── chartColors.js         # Bảng màu chart dùng chung, tra ngược về tokens Tailwind
        ├── assets/            # rỗng
        ├── data/locales/      # rỗng — chưa có i18n dù đã đặt sẵn thư mục
        ├── redux/             # rỗng — state thực tế chỉ dùng Context API + useState
        └── services/          # rỗng — mọi gọi API nằm ở src/api/
```

---

## 5. Module Backend (Node.js)

### 5.1. Sơ đồ luồng request

![Phân lớp backend](docs/images/03-phan-lop-backend.png)

Thứ tự middleware thật trong `server.js`: `helmet` → `cors` (origin lấy từ `CLIENT_URL`, `credentials: true`) → rate limiter toàn cục (300 request / 15 phút trên `/api`) → `express.json({ limit: '1mb' })` → `express.urlencoded` → `cookieParser` → routes → 404 handler → error handler tập trung (map `ValidationError`, lỗi trùng khoá Mongo `code 11000`, `MulterError` vượt dung lượng → 400; còn lại dùng `err.statusCode || 500`; `stack` chỉ trả về khi `NODE_ENV === 'development'`).

`GET /` trả plain text `"Backend Mini ATS đang chạy!"` — không có endpoint `/health` dạng JSON ở Node (chỉ AI Service có).

### 5.2. Danh sách route (đúng thứ tự khai báo thật)

`isRecruiter` (từ `middlewares/role.js`) cho phép cả `recruiter` **và** `admin` — tên middleware dễ gây hiểu nhầm là chỉ dành riêng cho recruiter.

#### Auth — `/api/auth`

| Method | Endpoint | Middleware |
| --- | --- | --- |
| POST | `/register` | `authLimiter` (20 req/15 phút/IP) |
| POST | `/login` | `authLimiter` |
| POST | `/refresh` | — (đọc cookie `refreshToken`) |
| POST | `/logout` | — |
| GET | `/me` | `protect` |
| POST | `/forgot-password` | — |
| POST | `/verify-otp` | — |
| POST | `/reset-password` | — |
| PUT | `/profile` | `protect`, `upload.fields([{avatar},{cv}])` |
| PUT | `/change-password` | `protect` |

#### Jobs — `/api/jobs`

| Method | Endpoint | Middleware |
| --- | --- | --- |
| GET | `/` | Public — chỉ tin `isActive: true` và `approvalStatus: 'approved'` |
| GET | `/featured` | Public — tối đa 6 tin nổi bật đã duyệt |
| GET | `/my-jobs` | `protect`, `isRecruiter` |
| GET | `/recruiter` | `protect`, `isRecruiter` — dropdown chọn job, chỉ trả `_id title isActive` |
| GET | `/stats/summary` | `protect`, `isRecruiter` |
| GET | `/stats/analytics` | `protect`, `isRecruiter` |
| GET | `/:id` | Public có điều kiện — tin `approved` ai xem cũng được, tin `pending`/`rejected` chỉ chủ tin hoặc admin |
| PATCH | `/:id/feature` | `protect`, `isAdmin` — **chỉ admin**, không phải chủ tin |
| POST | `/` | `protect`, `isRecruiter` |
| PUT | `/:id` | `protect`, `isRecruiter` (controller check thêm quyền sở hữu) |
| DELETE | `/:id` | `protect`, `isRecruiter` (controller check thêm quyền sở hữu) — soft delete |

> Các route tĩnh (`/featured`, `/my-jobs`, `/recruiter`, `/stats/summary`, `/stats/analytics`) được khai báo **trước** `/:id` — đúng thứ tự cần thiết để Express không hiểu nhầm chúng là một `id`.

#### Applications — `/api/applications`

| Method | Endpoint | Middleware |
| --- | --- | --- |
| POST | `/:jobId/apply` | `protect`, `isCandidate`, `upload.single('cv')` |
| GET | `/me` | `protect`, `isCandidate` |
| GET | `/job/:jobId` | `protect`, `isRecruiter` — `jobId = 'all'` gộp mọi tin của recruiter đang đăng nhập |
| PATCH | `/:id/feature` | `protect`, `isRecruiter` |
| POST | `/:id/score` | `protect`, `isRecruiter` — chấm lại điểm AI |
| PATCH | `/:id/status` | `protect`, `isRecruiter` |
| POST | `/:id/report` | `protect`, `isRecruiter` — controller check thêm `job.recruiter` khớp người gọi |

#### Admin — `/api/admin`

Dùng middleware `checkAdmin` khai báo cục bộ ngay trong `adminRoutes.js` (không tái dùng `isAdmin` từ `role.js`) — chức năng tương đương nhưng trả message 403 riêng.

| Method | Endpoint | Middleware |
| --- | --- | --- |
| GET | `/dashboard` | `protect`, `checkAdmin` |
| GET | `/analytics` | `protect`, `checkAdmin` |
| GET | `/reports` | `protect`, `checkAdmin` — danh sách đơn bị báo cáo |
| GET | `/users` | `protect`, `checkAdmin` |
| GET | `/users/:id` | `protect`, `checkAdmin` |
| DELETE | `/users/:id` | `protect`, `checkAdmin` — cascade xoá job/application liên quan |
| GET | `/jobs` | `protect`, `checkAdmin` — mọi trạng thái duyệt |
| PATCH | `/jobs/:id/approve` | `protect`, `checkAdmin` |
| DELETE | `/jobs/:id` | `protect`, `checkAdmin` — cascade xoá application + gửi thông báo |
| GET | `/applications/:id` | `protect`, `checkAdmin` |
| DELETE | `/applications/:id` | `protect`, `checkAdmin` |

#### Notifications — `/api/notifications`

| Method | Endpoint | Middleware |
| --- | --- | --- |
| GET | `/` | `protect` |
| PUT | `/read-all` | `protect` |
| PATCH | `/:id/read` | `protect` — chỉ đánh dấu đọc thông báo của chính user |

### 5.3. Middleware upload

```
req.file (multipart)
   │
   ▼
multer.memoryStorage()        ← không ghi xuống đĩa
   │  fileFilter: chỉ PDF hoặc image/*
   │  limits: 5MB
   ▼
Buffer trong RAM
   │
   ▼
streamifier.createReadStream(buffer)
   │
   ▼
cloudinary.uploader.upload_stream({
    folder: "mini_ats_cvs" | "mini_ats_avatars",
    resource_type: "auto" | "image"
})
   │
   ▼
secure_url  ──►  lưu vào Application.cvUrl / User.avatar
```

### 5.4. `aiService.js` — gọi AI Service

`triggerAIScoring(applicationId, data)` được gọi mà **không await** trong controller — response cho client đã trả trước đó.

1. Set `aiStatus: 'processing'` bằng `updateOne` (không load cả document).
2. Gọi `axios.post('{AI_SERVICE_URL}/score', { cv_url, jd_text, jd_skills }, { timeout: 60000 })`.
3. Thành công: `updateOne` ghi `aiScore`, `aiSummary`, `aiStatus: 'done'`.
4. Lỗi (timeout/4xx/5xx): `updateOne` ghi `aiStatus: 'error'`, log lỗi. Không có retry/backoff tự động — muốn thử lại phải gọi thủ công `POST /api/applications/:id/score`.

`batchScoreByJob(jobId)` xử lý theo lô 5 đơn một lúc (`Promise.all` theo chunk, các chunk chạy tuần tự) để tránh làm quá tải AI Service.

### 5.5. `authService.js` — luồng xác thực

- Access token: `jwt.sign({ id, role }, JWT_ACCESS_SECRET, { expiresIn: JWT_ACCESS_EXPIRES })`.
- Refresh token: `jwt.sign({ id }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES })`, set vào cookie `httpOnly`, `sameSite: 'strict'`, `secure` chỉ bật khi `NODE_ENV === 'production'`.
- Đăng ký whitelist `role` chỉ nhận `candidate`/`recruiter` — gửi `role: 'admin'` từ client sẽ bị bỏ qua.
- OTP quên mật khẩu: sinh bằng `crypto.randomInt(100000, 999999)` (không dùng `Math.random`), hash bcrypt lưu DB, hạn 10 phút. `forgotPassword` luôn trả `{ success: true }` dù email không tồn tại, tránh lộ danh sách người dùng.
- **OTP không được gửi email thật** — chỉ `console.log` ra terminal của `backend-node`, và chỉ khi `NODE_ENV !== 'production'`. Xem chi tiết ở [mục 14](#14-vấn-đề-đã-biết-và-hạn-chế).

---

## 6. Module AI Service (FastAPI)

### 6.1. Sơ đồ pipeline

![Thành phần AI Service](docs/images/04-ai-service.png)

![Pipeline AI chi tiết](docs/images/08-pipeline-ai-chi-tiet.png)

`asyncio.Semaphore(5)` được khởi tạo trong `lifespan` (bắt buộc vì Semaphore phải gắn với event loop đang chạy, không thể tạo lúc import module). Model SBERT **không preload lúc khởi động** — chỉ load ở lần gọi `/score` đầu tiên.

### 6.2. Endpoint

#### `GET /health`

```json
{ "status": "ok", "service": "ai-python" }
```

Không phụ thuộc DB hay model, luôn phản hồi nhanh cho việc theo dõi uptime.

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
| 400 | Mọi lỗi tải/đọc PDF: 404, 403, HTTP status lỗi khác, không phải file PDF, file vượt 10MB, timeout tải file (15 giây), lỗi kết nối |
| 422 | Tải PDF thành công nhưng văn bản trích xuất được rỗng hoặc dưới 50 ký tự — thường là PDF dạng ảnh scan, không có lớp text |
| 500 | Lỗi không xác định (ví dụ bug thật sự trong `score_cv`) — trong điều kiện bình thường hiếm khi xảy ra vì lỗi model đã được xử lý bằng fallback, không raise exception |

### 6.3. Tải và trích xuất PDF (`extractor.py`)

- `httpx.AsyncClient(timeout=15.0, follow_redirects=True)`, tải theo `stream()` để kiểm soát dung lượng khi đang tải, không đợi tải xong toàn bộ mới kiểm tra.
- Content-Type phải chứa `pdf` hoặc URL path kết thúc bằng `.pdf`.
- Giới hạn 10MB — cắt ngay khi vượt trong lúc stream (chunk 8KB), không phải sau khi tải xong.
- Ghi vào file tạm (`NamedTemporaryFile`), trích xuất bằng `pdfminer.extract_text` chạy trong `asyncio.to_thread` (CPU nặng), sau đó luôn xoá file tạm trong khối `finally` — kể cả khi có lỗi.

### 6.4. Thuật toán Composite Scoring (`scorer.py`)

Ba tín hiệu độc lập, trộn theo trọng số ưu tiên semantic > skill > keyword:

| Tình huống | Công thức |
| --- | --- |
| Đủ cả 3 tín hiệu | `0.55·semantic + 0.25·skill + 0.20·keyword` |
| Không có `jd_skills` | `0.65·semantic + 0.35·keyword` |
| Model SBERT tải lỗi, có `jd_skills` | `0.55·skill + 0.45·keyword` |
| Model lỗi và không có `jd_skills` | `= keyword` |

```
score = min(1.0, composite × 1.1)   nếu có semantic
score = composite                    nếu không có semantic (model lỗi)
score_pct = round(score × 100, 1)
```

Hệ số `×1.1` chỉ áp dụng khi có semantic — cosine similarity của model multilingual hiếm khi vượt 0.85 với văn bản thật, nên hệ số bù giúp CV rất phù hợp đạt mức điểm 80+ như kỳ vọng của recruiter. Ở chế độ fallback (model lỗi) không có hệ số bù này, nên điểm ở hai chế độ không hoàn toàn tương đương nhau với cùng một mức độ phù hợp thật.

**Điều kiện đầu vào tối thiểu:** sau khi tokenize và loại stop-word (bộ gộp tiếng Anh + tiếng Việt, ~110 + ~90 từ), CV cần ≥ 10 từ khoá có nghĩa, JD cần ≥ 5 từ khoá — không đạt trả thẳng `score: 0` kèm lý do trong `summary`.

**Skill match:** so khớp cụm từ nguyên văn theo word-boundary regex trước; nếu không khớp và skill là cụm nhiều từ, fallback sang yêu cầu từng từ đơn lẻ đều xuất hiện độc lập trong CV.

**Keyword coverage:** mẫu số là số từ khoá **duy nhất** trong JD (không phải tổng số lần xuất hiện), tránh một từ lặp nhiều lần trong JD làm phồng tỉ lệ phủ.

**Singleton model:** `_get_model()` dùng double-checked locking với `threading.Lock`. Nếu load lỗi một lần, `_MODEL_TRIED = True` được set vĩnh viễn cho vòng đời process — service không tự thử lại, chỉ khôi phục sau khi restart.

---

## 7. Module Frontend (React + Vite)

### 7.1. Cây định tuyến

![Route map theo vai trò](docs/images/10-route-map-vai-tro.png)

| Nhóm | Đường dẫn | Component | Quyền |
| --- | --- | --- | --- |
| Public | `/`, `/login`, `/register`, `/forgot-password`, `/verify-otp`, `/reset-password` | LandingPage, LoginPage, RegisterPage, ForgotPassword, OTPVerify, ResetPassword | Không cần đăng nhập |
| Dùng chung | `/notifications` | NotificationsPage | Mọi vai trò đã đăng nhập |
| Dùng chung | `/jobs/:id` | JobDetailPage | candidate, recruiter, admin |
| Candidate | `/candidate/jobs`, `/candidate/applications`, `/candidate/settings` | JobSearchPage, ApplicationsPage, SettingsPage | candidate |
| Recruiter | `/recruiter/dashboard`, `/recruiter/jobs`, `/recruiter/jobs/create`, `/recruiter/jobs/:id/edit`, `/recruiter/candidates`, `/recruiter/jobs/:jobId/applicants`, `/recruiter/settings` | DashboardPage, JobsManagePage, JobCreatePage (dual-mode), CandidatesManagePage (dual-mode), SettingsPage | recruiter, admin |
| Admin | `/admin/dashboard`, `/admin/users`, `/admin/jobs`, `/admin/settings`, `/admin/applications/:id` | AdminDashboardPage, AdminUsersPage, AdminJobsPage, AdminSettingsPage, AdminApplicationDetailPage | admin |
| Catch-all | `*` | `<Navigate to="/" replace />` | — không có trang 404 riêng |

`JobCreatePage` phục vụ cả tạo mới và sửa (phân biệt qua `useParams`). `CandidatesManagePage` phục vụ cả xem tất cả ứng viên lẫn ứng viên theo một job cụ thể.

### 7.2. AuthContext — quản lý phiên

```
App mount
   │
   ▼
POST /auth/refresh  ── đọc cookie refreshToken httpOnly ──► accessToken mới
   │                                                              │
   │                                                              ▼
   │                                                    GET /auth/me ──► setUser()
   │
   └─ thất bại ──► user = null, window.__accessToken = null
   │
   ▼
setLoading(false)  ──►  ProtectedRoute mới được phép quyết định redirect
```

Access token chỉ giữ trong bộ nhớ (`window.__accessToken`), **không** lưu `localStorage` — script chèn qua lỗ hổng XSS chỉ lấy được token sống 15 phút, không lấy được refresh token vì cookie `httpOnly` nằm ngoài tầm với JavaScript. Đánh đổi: mỗi lần F5 trang đều phải gọi lại `/auth/refresh` + `/auth/me`, đó là lý do `loading` khởi tạo `true` — nếu không, `ProtectedRoute` sẽ thấy `user === null` trong vài mili-giây đầu và đá người dùng về `/login` dù cookie còn hạn.

`logout` gọi `POST /auth/logout` theo kiểu best-effort (lỗi bị nuốt — server không phản hồi vẫn phải xoá state phía client), sau đó **hard redirect** bằng `window.location.href = '/'` (không dùng điều hướng React Router).

### 7.3. Axios interceptor

| Giai đoạn | Xử lý |
| --- | --- |
| Request | Gắn `Authorization: Bearer ${window.__accessToken}` nếu có |
| Response 401 lần đầu | Bỏ qua với `/login`, `/register`, `/refresh` (tránh vòng lặp vô hạn); gọi `/auth/refresh` bằng **axios gốc** (không qua instance có interceptor) để tránh đệ quy |
| 401 khi đang refresh | Xếp vào `failedQueue`, chờ token mới rồi phát lại — tránh nhiều request 401 cùng lúc gọi refresh trùng nhau |
| Refresh thất bại | Xoá token; chỉ redirect `/login` nếu path hiện tại **không** nằm trong danh sách trang công khai — tránh đá người dùng ẩn danh đang xem trang public chỉ vì có một request lẻ bị 401 |

> Với `FormData`, **không** set cứng `Content-Type` — Axios tự sinh `multipart/form-data` kèm `boundary`. Ghi đè sẽ khiến file bị serialize sai và Multer không nhận được.

### 7.4. Hook và tiện ích dùng chung

| Hook / tiện ích | Vai trò |
| --- | --- |
| `useFocusTrap` | Trap Tab, đóng bằng Esc, khoá cuộn, trả focus khi đóng — dùng cho `ConfirmDialog` (mặc định focus vào nút Huỷ để tránh xác nhận nhầm) |
| `useChartWidth` | Đo bề rộng thật bằng `ResizeObserver` trước khi paint (`useLayoutEffect`), đặt `viewBox` đúng bằng số đó để 1 đơn vị SVG = 1 pixel CSS ở mọi kích thước màn hình |
| `chartColors.js` | Nguồn hex màu duy nhất cho SVG chart (class Tailwind không áp được lên `fill`/`stroke`), mọi giá trị đều kèm chú thích tỉ lệ tương phản WCAG |

Toàn bộ biểu đồ trong `components/shared/charts/` (BarChart, LineChart, DonutChart, FunnelChart, StatCard, ChartCard) là SVG viết tay, không dùng thư viện chart — lý do `useChartWidth` và `chartColors.js` tồn tại.

Ba layout theo vai trò (`AdminLayout`, `CandidateLayout`, `RecruiterLayout`) đều dựng trên một `DashboardShell` dùng chung, mỗi layout chỉ khai báo `navItems`, nhãn khu vực và nội dung khối user.

---

## 8. Các luồng nghiệp vụ chính

### 8.1. Nộp CV và chấm điểm ngầm (Fire and Forget)

![Luồng nộp CV](docs/images/05-luong-nop-cv.png)

1. Candidate gửi PDF qua `POST /api/applications/:jobId/apply`.
2. Node validate file (PDF/ảnh theo mimetype, tối đa 5MB), giữ trong RAM dạng Buffer.
3. Node stream buffer lên Cloudinary, nhận `secure_url`.
4. Node tạo `Application` (`aiStatus: 'pending'`), tăng `applicantCount` của job.
5. **Trả 201 cho candidate ngay** — không chờ AI.
6. Node gọi ngầm `POST {AI_SERVICE_URL}/score` (timeout 60 giây).
7. Python: qua Semaphore(5) → tải PDF (Cloudinary) → trích xuất text → nếu < 50 ký tự trả 422 → tokenize, loại stop-word → tính 3 tín hiệu → tổ hợp điểm.
8. Node cập nhật `aiScore`, `aiSummary`, `aiStatus: 'done'`. Nếu bước nào ở Python lỗi/timeout, Node set `aiStatus: 'error'` (recruiter có thể bấm "chấm lại AI" để retry).

### 8.2. Trạng thái tin tuyển dụng

![Trạng thái Job](docs/images/09-trang-thai-job.png)

Một job có 3 chiều trạng thái độc lập, cắt ngang lẫn nhau:

- **`approvalStatus`** (`pending` → `approved`/`rejected`, chỉ admin đổi qua `PATCH /api/admin/jobs/:id/approve`). API hiện **không guard theo trạng thái hiện tại** — có thể chuyển `approved` → `rejected` hoặc ngược lại bất kỳ lúc nào, dù UI không có nút để làm việc đó.
- **`isActive`** — cờ soft-delete, `deleteJob()` chỉ chủ tin hoặc admin gọi được. Không có endpoint khôi phục lại `true` trong code hiện tại.
- **`isFeatured`** — chỉ admin bật/tắt qua `toggleFeatured()`. Lưu ý: hàm này chỉ kiểm tra role admin và `isActive: true`, **không kiểm tra `approvalStatus`** — về lý thuyết admin có thể đánh dấu nổi bật một tin đang `pending` hoặc `rejected`, đây là một khoảng hở nghiệp vụ nhỏ.

### 8.3. Trạng thái đơn ứng tuyển

![Trạng thái đơn ứng tuyển](docs/images/06-trang-thai-don.png)

`applied → reviewing → shortlisted → interviewed → offered`, và `rejected` có thể xảy ra từ bất kỳ trạng thái nào trong chuỗi trên. Mỗi lần recruiter đổi trạng thái, hệ thống tạo `Notification` cho candidate tương ứng.

### 8.4. Khôi phục mật khẩu qua OTP

| Bước | Endpoint | Xử lý |
| --- | --- | --- |
| 1 | `POST /forgot-password` | Sinh OTP 6 số bằng `crypto.randomInt`, hash bcrypt lưu DB, hạn 10 phút. Luôn trả `{ success: true }` dù email không tồn tại |
| 2 | `POST /verify-otp` | So khớp hash, kiểm tra hạn, đặt `resetOTPVerified: true` |
| 3 | `POST /reset-password` | Yêu cầu đã verified, đổi mật khẩu (kích hoạt lại `pre('save')` hash), xoá toàn bộ field OTP |

Ở môi trường hiện tại, OTP chỉ hiện trên console server (xem [mục 14](#14-vấn-đề-đã-biết-và-hạn-chế)), không có bước gửi email/SMS thật.

---

## 9. Mô hình dữ liệu

### 9.1. ERD

![ERD](docs/images/07-erd.png)

### 9.2. Bảng enum

| Trường | Giá trị hợp lệ |
| --- | --- |
| `User.role` | `admin` · `recruiter` · `candidate` |
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
| `applications` | `{ job, aiScore: -1 }` | Sắp xếp ứng viên theo điểm AI trong một job |
| `applications` | `{ candidate, createdAt: -1 }` | Lịch sử ứng tuyển của candidate |

### 9.4. Ghi chú riêng theo model

- `Job.salaryMax` có validator yêu cầu `>= salaryMin`, nhưng validator chỉ chạy khi thao tác qua `.save()` (tức là bị bỏ qua khi controller dùng `findOneAndUpdate`/`updateOne`) — có thể lách được nếu code cập nhật theo đường này.
- `User.isVerified` (mặc định `false`) được khai báo trong schema nhưng không route/controller nào đọc hoặc ghi trường này — nhiều khả năng dự trữ cho một tính năng xác minh email chưa triển khai.

---

## 10. Hệ thống thiết kế frontend

### 10.1. Nguyên tắc

| Nguyên tắc | Lý do |
| --- | --- |
| Một màu accent duy nhất | Màu ngữ nghĩa (success/warning/danger) chỉ dành cho trạng thái thật — điểm AI, kết quả duyệt. Dùng màu để trang trí sẽ làm chúng mất khả năng truyền tin |
| Viền thay shadow | Card tĩnh dùng viền 1px. Shadow chỉ dành cho phần tử thật sự nổi lên khỏi mặt phẳng: modal, dropdown, tooltip |
| Hierarchy bằng cân nặng | Phân cấp bằng font-weight và màu, không bằng cỡ chữ khổng lồ |
| Mọi màu ngữ nghĩa lấy bước 700 | Hover/active chuyển sang bước 800/900 để đảm bảo tương phản WCAG AA khi tương tác |

### 10.2. Thang giá trị

| Thang | Các bậc |
| --- | --- |
| Cỡ chữ | 5 bước, từ `text-xs` (12) đến `text-2xl` (28) |
| Bo góc | 3 mức: nhỏ cho badge/input, vừa cho card/button, lớn chỉ dành cho lớp nổi (modal, dropdown) |
| Shadow | Phần lớn bị ghim về `none`; chỉ dropdown và modal có shadow thật |

### 10.3. Màu biểu đồ (`src/utils/chartColors.js`)

SVG `fill`/`stroke` không nhận class Tailwind nên bắt buộc dùng hex — toàn bộ được gom về một file để tránh bảng màu tồn tại độc lập ở hai nơi.

| Export | Mục đích | Ràng buộc |
| --- | --- | --- |
| `CHART_RAMP` | Thang có thứ tự (funnel, phân bố điểm) | 4 bậc cùng họ màu, mọi bậc đạt ≥ 3:1 so với nền trắng (WCAG 1.4.11) |
| `CHART_SEMANTIC` | Trạng thái tốt/xấu thật (hired, pending, rejected) | success · warning · danger · muted |
| `CHART_CATEGORICAL` | Phân loại không thứ tự (vai trò user, nhiều series line chart) | Cùng họ xanh-xám, không mang hàm ý tốt/xấu |
| `CHART_AXIS` | Lưới, rãnh, nhãn, tooltip | Không mang dữ liệu nên không bắt buộc theo WCAG 1.4.11 |

---

## 11. Bảo mật và xác thực

### 11.1. Luồng JWT hai token

```
Login ──► accessToken  (15 phút, giữ trong bộ nhớ trình duyệt — không localStorage)
      └─► refreshToken (7 ngày, cookie httpOnly + sameSite: strict)

Request ──► Bearer accessToken
   │
   ├─ 200 ──► xong
   │
   └─ 401 ──► POST /auth/refresh (cookie tự gửi)
                  │
                  ├─ ok ──► accessToken mới ──► phát lại request gốc
                  └─ fail ──► xoá token ──► /login
```

### 11.2. Phân quyền RBAC

| Middleware | Kiểm tra |
| --- | --- |
| `protect` | Verify JWT, **nạp lại user từ DB** theo `id` trong token (không chỉ tin token), chặn nếu `isActive === false` |
| `isAdmin` | `role === 'admin'` |
| `isRecruiter` | `role ∈ { admin, recruiter }` — admin cũng đi qua được mọi route "chỉ dành cho recruiter" |
| `isCandidate` | `role === 'candidate'` |
| `checkAdmin` (chỉ trong `adminRoutes.js`) | Tương đương `isAdmin`, khai báo riêng thay vì tái dùng |

Kiểm tra quyền sở hữu (chỉ chủ tin/chủ đơn mới sửa được) thực hiện thêm ở tầng controller, không chỉ dựa vào middleware.

### 11.3. Các biện pháp khác

| Biện pháp | Chi tiết |
| --- | --- |
| Whitelist role khi đăng ký | Chỉ nhận `candidate`/`recruiter` — gửi `role: 'admin'` từ client sẽ bị bỏ qua |
| Chống mass assignment | Controller destructure từng field, không gán thẳng `req.body` vào document |
| Băm mật khẩu | bcrypt cost 12, field `select: false` |
| Hash OTP | OTP cũng được hash bcrypt, không lưu plaintext |
| Rate limit | 300 request/15 phút cho toàn bộ `/api`; riêng `/auth/register` và `/auth/login` giới hạn 20 request/15 phút/IP |
| Không lộ thông tin | `forgot-password` và `login` đều dùng thông báo lỗi chung chung, không phân biệt được email tồn tại hay sai mật khẩu |

---

## 12. Cấu hình và khởi chạy

### 12.1. Yêu cầu môi trường

| Thành phần | Yêu cầu |
| --- | --- |
| Node.js | 18+ |
| Python | 3.10+ (dùng cú pháp `list[str] \| None`) |
| MongoDB | Local hoặc MongoDB Atlas |
| RAM | Khuyến nghị tối thiểu 4GB — `torch` + `sentence-transformers` khá nặng |
| Cloudinary | Tài khoản free là đủ |

### 12.2. Cài dependencies

```bash
# Backend Node.js
cd backend-node && npm install

# AI Service
cd ../backend-ai-python
python -m venv .venv
.\.venv\Scripts\Activate.ps1      # Windows PowerShell
# source .venv/bin/activate       # macOS / Linux
pip install -r requirements.txt

# Frontend
cd ../frontend-ats && npm install
```

### 12.3. Biến môi trường

**`backend-node/.env`** — đây là toàn bộ biến mà code thực sự đọc:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/ats_project_db

JWT_ACCESS_SECRET=<chuỗi ngẫu nhiên dài>
JWT_REFRESH_SECRET=<chuỗi ngẫu nhiên khác>
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

CLOUDINARY_CLOUD_NAME=<cloud_name>
CLOUDINARY_API_KEY=<api_key>
CLOUDINARY_API_SECRET=<api_secret>

AI_SERVICE_URL=http://localhost:8000

# Không bắt buộc nhưng ảnh hưởng 3 chỗ trong code — xem ghi chú bên dưới
NODE_ENV=development
```

Sinh secret ngẫu nhiên:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`NODE_ENV` ảnh hưởng: cookie `refreshToken` chỉ set `secure: true` khi `production`; OTP quên mật khẩu chỉ `console.log` khi **khác** `production`; error middleware chỉ trả `stack` trace khi **đúng bằng** `'development'`. Nếu không set biến này, hệ thống mặc định rơi vào các nhánh "không phải production" — xem [mục 14](#14-vấn-đề-đã-biết-và-hạn-chế).

**`frontend-ats/.env`** — biến duy nhất frontend đọc (`import.meta.env.VITE_API_URL`):

```env
VITE_API_URL=http://localhost:5000/api
```

**`backend-ai-python`** — không đọc file `.env` nào. Host, port, danh sách CORS origin, `MAX_CONCURRENT_TASKS`, giới hạn dung lượng PDF (10MB), timeout tải file (15 giây) đều hard-code trong `app.py`/`extractor.py`/`scorer.py`.

**Cấu hình Cloudinary (bắt buộc):**

1. Đăng ký tại cloudinary.com, lấy 3 giá trị credentials từ Dashboard.
2. Vào **Settings → Security**, cuộn tới **PDF and ZIP files delivery**.
3. Tick **"Allow delivery of PDF and ZIP files"** rồi Save.

> Thiếu bước 3, Cloudinary sẽ trả 401/403 khi Python tải CV về và mọi hồ sơ mắc kẹt ở `aiStatus: 'error'`.

### 12.4. Thứ tự khởi chạy

```
MongoDB  ──►  AI Service  ──►  Node.js API  ──►  Frontend
```

| Terminal | Lệnh |
| --- | --- |
| 1 — MongoDB | `mongod` (bỏ qua nếu dùng Atlas) |
| 2 — AI Service | `cd backend-ai-python && python app.py` — chạy tại `http://0.0.0.0:8000` |
| 3 — Backend | `cd backend-node && npm run dev` |
| 4 — Frontend | `cd frontend-ats && npm run dev` — mở `http://localhost:5173` |

AI Service nên chạy trước để lần nộp CV đầu tiên không rơi vào lúc model đang tải (1–2 phút).

### 12.5. Tạo tài khoản admin

API chặn đăng ký role `admin` qua `/api/auth/register`, nên phải tạo thủ công.

**Cách 1 — dùng script có sẵn:**

```bash
cd backend-node
node createAdmin.js
```

Script kết nối `MONGODB_URI`, hash mật khẩu bằng bcrypt rồi upsert tài khoản:
- Email: `admin@neu.edu.vn`
- Mật khẩu: `admin123`
- Role: `admin`

Email/mật khẩu này hard-code sẵn trong source đã commit — **đổi mật khẩu ngay sau khi đăng nhập lần đầu**, không dùng nguyên trạng script này để tạo admin trên môi trường production.

**Cách 2 — sửa tay qua mongosh** (yêu cầu tài khoản đã đăng ký trước qua `/register`):

```bash
mongosh ats_project_db

db.users.updateOne(
    { email: "your-email@example.com" },
    { $set: { role: "admin" } }
)
```

Đăng xuất và đăng nhập lại để nhận quyền admin mới.

---

## 13. Kiểm thử nhanh

### 13.1. Health check từng phân hệ

```bash
curl http://localhost:8000/health
# { "status": "ok", "service": "ai-python" }

curl http://localhost:5000/
# Backend Mini ATS đang chạy!
```

### 13.2. Test AI Service độc lập

```bash
curl -X POST http://localhost:8000/score \
  -H "Content-Type: application/json" \
  -d '{
    "cv_url": "https://res.cloudinary.com/.../cv.pdf",
    "jd_text": "Tuyển Frontend Developer có kinh nghiệm React, TypeScript, Tailwind CSS.",
    "jd_skills": ["React", "TypeScript", "Tailwind CSS"]
  }'
```

Hoặc dùng Swagger UI tự sinh tại `http://localhost:8000/docs`.

### 13.3. Luồng end-to-end

| Bước | Thao tác | Kết quả mong đợi |
| --- | --- | --- |
| 1 | Đăng ký tài khoản recruiter | Chuyển tới `/recruiter/dashboard` |
| 2 | Đăng tin tuyển dụng | Tin ở trạng thái chờ duyệt |
| 3 | Đăng nhập admin, duyệt tin | Tin chuyển sang `approved` |
| 4 | Đăng ký candidate, tìm việc | Tin vừa duyệt xuất hiện trong danh sách |
| 5 | Nộp CV PDF | Nhận 201 ngay, không phải chờ |
| 6 | Đợi vài giây, recruiter xem ứng viên | `aiScore` hiện ra, `aiStatus: done` |
| 7 | Recruiter đổi trạng thái sang shortlisted | Candidate nhận thông báo |
| 8 | F5 trang bất kỳ | Vẫn giữ đăng nhập |

---

## 14. Vấn đề đã biết và hạn chế

Danh sách dưới đây liệt kê thẳng thắn các khoảng trống và quirk thật trong code hiện tại — hữu ích khi quyết định phạm vi làm việc tiếp theo.

| Vấn đề | Chi tiết |
| --- | --- |
| OTP không gửi email thật | `authService.js` chỉ `console.log` OTP, và chỉ khi `NODE_ENV !== 'production'`. Nếu deploy với `NODE_ENV=production` mà chưa tích hợp dịch vụ email, luồng quên mật khẩu sẽ hoàn toàn không dùng được |
| `NODE_ENV` không được set mặc định | `.env` mẫu không có `NODE_ENV`, khiến cookie refresh token không bật `secure`, và stack trace lỗi có thể lộ ra nếu vô tình set `NODE_ENV` khác `'development'` một cách không chủ ý — cần set rõ ràng trước khi deploy |
| Chưa có xác thực giữa Node và Python | AI Service không kiểm tra nguồn gọi — bất kỳ ai biết `AI_SERVICE_URL` (nếu lộ ra ngoài mạng nội bộ) đều gọi được `/score` trực tiếp |
| CORS của AI Service chỉ hard-code cho localhost | `app.py` chỉ allow `http://localhost:5173` và `http://localhost:5000`, không đọc từ biến môi trường — nhưng lưu ý CORS chỉ chặn trình duyệt, còn lời gọi thật (Node → Python) là server-to-server nên không bị ảnh hưởng bởi giới hạn này |
| `endpoints.js` ở frontend là dead code | `authAPI`/`jobsAPI`/`applicationsAPI` được định nghĩa sẵn nhưng không trang nào import — toàn bộ trang gọi thẳng `api.get/post(...)` với path string |
| `@tanstack/react-query` không được dùng | Có trong `package.json` nhưng không import ở đâu trong `src/` — fetch data hoàn toàn thủ công bằng `useState`/`useEffect` |
| `src/App.css` mồ côi | Là CSS mặc định của Vite scaffold, không được import ở đâu (style thật nằm ở `index.css`) |
| 4 thư mục rỗng ở frontend | `src/assets/`, `src/data/locales/` (chưa có i18n dù có sẵn thư mục), `src/redux/` (state thực tế dùng Context API), `src/services/` (API call nằm ở `src/api/`) |
| `isFeatured` không kiểm tra `approvalStatus` | Về lý thuyết admin có thể đánh dấu nổi bật một tin đang `pending`/`rejected` |
| Không có endpoint khôi phục job đã xoá mềm | `isActive: false` là một chiều, không có API set lại `true` |
| `Job.salaryMax` validator có thể bị bỏ qua | Validator `>= salaryMin` chỉ chạy trên `.save()`, không chạy trên `findOneAndUpdate`/`updateOne` |
| `createAdmin.js` hard-code thông tin đăng nhập | Email/mật khẩu mặc định nằm trong source đã commit, cần đổi ngay sau lần chạy đầu |
| Model SBERT không tự retry sau lỗi load | Một lần load lỗi sẽ khiến service chạy fallback (keyword/skill) vĩnh viễn cho tới khi restart process |
| Không có Docker, không có test suite | Cả 3 phân hệ hiện chạy thủ công từng terminal, chưa có CI/CD hay bộ test tự động |

---

## 15. Hướng phát triển tiếp theo

- Thêm xác thực giữa Node và Python (ví dụ header nội bộ dùng chung secret).
- Gửi OTP qua email thật thay vì log ra console.
- Cơ chế retry có backoff cho `aiService` khi Python tạm thời không phản hồi.
- OCR cho CV dạng ảnh scan — hiện bị từ chối thẳng với mã 422.
- Chuyển từ short-polling 30 giây sang WebSocket cho thông báo realtime.
- Bổ sung unit test cho `scorer.py` và integration test cho luồng nộp CV.
- Đóng gói Docker Compose để chạy cả 3 phân hệ bằng một lệnh.
- Dọn dead code: `endpoints.js`, `@tanstack/react-query`, `App.css`, các thư mục rỗng ở frontend.
- Chuyển CV sang chế độ truy cập có ký (signed URL) thay vì để public trên Cloudinary.
- Đưa `MAX_CONCURRENT_TASKS`, CORS origin, các ngưỡng ở AI Service ra biến môi trường thay vì hard-code.

---

## Tác giả

**Hoàng Năng Minh** — Xây dựng hệ thống ATS tích hợp AI chấm điểm CV tự động.

## License

Dự án phát triển cho mục đích học tập. Vui lòng không sử dụng cho mục đích thương mại nếu chưa có sự đồng ý của tác giả.
