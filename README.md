# Mini ATS — Hệ thống tuyển dụng tích hợp AI chấm điểm CV

Hệ thống Applicant Tracking System (ATS) thu nhỏ, được thiết kế theo mô hình phân tán với 3 phân hệ độc lập: **Frontend React**, **Node.js API Gateway**, và **Python AI Microservice**. Hệ thống cho phép ứng viên nộp CV PDF, sau đó AI tự động chấm điểm độ phù hợp với JD bằng thuật toán TF-IDF kết hợp Sentence-Transformer (đa ngôn ngữ Việt-Anh).

---

## Mục lục

1. [Kiến trúc tổng thể](#kiến-trúc-tổng-thể)
2. [Tính năng chính](#tính-năng-chính)
3. [Yêu cầu môi trường](#yêu-cầu-môi-trường)
4. [Cài đặt từng phân hệ](#cài-đặt-từng-phân-hệ)
5. [Cấu hình biến môi trường](#cấu-hình-biến-môi-trường)
6. [Cấu hình Cloudinary](#cấu-hình-cloudinary)
7. [Khởi chạy hệ thống](#khởi-chạy-hệ-thống)
8. [Tạo tài khoản admin](#tạo-tài-khoản-admin)
9. [Cấu trúc thư mục](#cấu-trúc-thư-mục)
10. [API Endpoints chính](#api-endpoints-chính)
11. [Luồng nghiệp vụ chính](#luồng-nghiệp-vụ-chính)
12. [Troubleshooting](#troubleshooting)

---

## Kiến trúc tổng thể

```
┌──────────────────────┐
│   Frontend (React)   │  Port 5173
│   Vite + Tailwind    │
└──────────┬───────────┘
           │ HTTPS / JSON / FormData
           ▼
┌──────────────────────┐         ┌──────────────┐
│  Node.js API Gateway │ ◄─────► │   MongoDB    │
│  Express + JWT       │         │   (Mongoose) │
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

**Tại sao tách 3 phân hệ:**
- **Frontend** chạy trên CDN, không cần biết backend logic
- **Node.js Gateway** xử lý nghiệp vụ chính, kết nối DB và file storage
- **Python AI** tách riêng vì tác vụ ML cần thư viện nặng (PyTorch, sentence-transformers ~500MB), không nên đặt trên server xử lý request thường

---

## Tính năng chính

### Cho Ứng viên (Candidate)
- Đăng ký, đăng nhập, quên mật khẩu qua OTP email
- Tìm kiếm việc làm với bộ lọc đa chiều (từ khóa, địa điểm, lương, kinh nghiệm)
- Nộp CV PDF, AI tự động chấm điểm độ phù hợp
- Theo dõi trạng thái hồ sơ ứng tuyển
- Nhận thông báo khi HR duyệt/từ chối hồ sơ

### Cho Nhà tuyển dụng (Recruiter)
- Đăng tin tuyển dụng (cần admin duyệt trước khi hiển thị công khai)
- Quản lý danh sách ứng viên với bộ lọc theo điểm AI
- Xem CV và phân tích AI chi tiết
- Duyệt/từ chối/đánh dấu nổi bật ứng viên
- Dashboard thống kê

### Cho Quản trị viên (Admin)
- Duyệt/từ chối tin tuyển dụng mới
- Quản lý người dùng (khóa, xóa tài khoản)
- Thống kê toàn hệ thống
- Quản lý tất cả tin tuyển dụng

---

## Yêu cầu môi trường

| Phân hệ | Yêu cầu |
|---|---|
| Node.js | >= 18.0 |
| Python | >= 3.10 |
| MongoDB | >= 6.0 (local hoặc MongoDB Atlas) |
| RAM | Tối thiểu 4GB (Python AI service load model ~500MB) |
| Cloudinary | Tài khoản free đủ dùng |

---

## Cài đặt từng phân hệ

### Bước 1 — Clone dự án

```bash
git clone https://github.com/minhhir/ATS_Project.git
cd ATS_Project
```

### Bước 2 — Cài đặt Backend Node.js

```bash
cd backend-node
npm install
```

### Bước 3 — Cài đặt Backend Python AI

```bash
cd ../backend-ai-python

# Tạo virtual environment
python -m venv .venv

# Kích hoạt virtual environment
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# macOS / Linux:
source .venv/bin/activate

# Cài dependencies
pip install -r requirements.txt
```

**Lưu ý:** Lần đầu chạy AI service, model `paraphrase-multilingual-MiniLM-L12-v2` (~117MB) sẽ tự động được tải về. Cần kết nối internet trong lần chạy đầu tiên.

### Bước 4 — Cài đặt Frontend

```bash
cd ../frontend-ats
npm install
```

---

## Cấu hình biến môi trường

### `backend-node/.env`

Tạo file `.env` trong thư mục `backend-node/` với nội dung:

```env
# Server
PORT=5000
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://127.0.0.1:27017/ats_project_db

# JWT secrets — tự sinh bằng: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_ACCESS_SECRET=<secret_chuỗi_dài_64_ký_tự>
JWT_REFRESH_SECRET=<secret_khác_dài_64_ký_tự>
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Cloudinary — lấy ở dashboard Cloudinary
CLOUDINARY_CLOUD_NAME=<your_cloud_name>
CLOUDINARY_API_KEY=<your_api_key>
CLOUDINARY_API_SECRET=<your_api_secret>

# AI Service URL
AI_SERVICE_URL=http://localhost:8000
```

### `frontend-ats/.env`

Tạo file `.env` trong thư mục `frontend-ats/`:

```env
VITE_API_URL=http://localhost:5000/api
```

### `backend-ai-python/.env` (tùy chọn)

Python AI service không bắt buộc cần `.env`, nhưng nếu muốn override default:

```env
HOST=0.0.0.0
PORT=8000
MAX_CONCURRENT_TASKS=5
```

---

## Cấu hình Cloudinary

Cloudinary dùng để lưu trữ file CV PDF và ảnh đại diện. **Có 2 setting bắt buộc** để hệ thống chạy được:

### Bước 1 — Đăng ký tài khoản

Truy cập [cloudinary.com](https://cloudinary.com) → đăng ký free → vào Dashboard.

### Bước 2 — Lấy credentials

Tại Dashboard, copy 3 giá trị:
- `Cloud name`
- `API Key`
- `API Secret`

Dán vào `backend-node/.env` ở các biến `CLOUDINARY_*`.

### Bước 3 — Bật quyền delivery cho PDF

**Đây là bước quan trọng nhất** — không có bước này thì Python sẽ bị 401 khi tải CV về để chấm điểm.

1. Vào **Settings** (icon bánh răng góc trái)
2. Chọn tab **Security**
3. Cuộn xuống mục **PDF and ZIP files delivery**
4. **Tick vào ô "Allow delivery of PDF and ZIP files"**
5. Bấm **Save**

---

## Khởi chạy hệ thống

Mở **3 terminal riêng biệt**, chạy từng phân hệ:

### Terminal 1 — MongoDB (nếu dùng local)

```bash
mongod
```

Bỏ qua bước này nếu dùng MongoDB Atlas (cloud).

### Terminal 2 — Python AI Service

```bash
cd backend-ai-python

# Kích hoạt venv (nếu chưa)
.\.venv\Scripts\Activate.ps1   # Windows
# source .venv/bin/activate     # macOS/Linux

# Khởi chạy
python app.py
```

Server chạy tại `http://localhost:8000`. Kiểm tra healthcheck: `http://localhost:8000/health`.

### Terminal 3 — Node.js API

```bash
cd backend-node
npm run dev
```

Server chạy tại `http://localhost:5000`. Healthcheck: truy cập `http://localhost:5000/` sẽ thấy "Backend Mini ATS đang chạy!".

### Terminal 4 — Frontend

```bash
cd frontend-ats
npm run dev
```

Truy cập `http://localhost:5173` để vào ứng dụng.

---

## Tạo tài khoản admin

Vì phía API đã chặn việc đăng ký role `admin` (security), cần tạo admin thủ công qua MongoDB:

**Cách 1 — Qua MongoDB Compass:**
1. Đăng ký tài khoản thường (role mặc định là `candidate`) qua trang `/register`
2. Mở MongoDB Compass, kết nối tới database `ats_project_db`
3. Vào collection `users`, tìm document của tài khoản vừa đăng ký
4. Sửa field `role` từ `"candidate"` thành `"admin"`
5. Save

**Cách 2 — Qua mongosh:**
```bash
mongosh ats_project_db
db.users.updateOne(
    { email: "your-email@example.com" },
    { $set: { role: "admin" } }
)
```

Đăng nhập lại để nhận quyền admin mới.

---

## Cấu trúc thư mục

```
ATS_Project/
├── backend-node/                # API Gateway (Node.js)
│   └── src/
│       ├── config/              # Cấu hình DB, Cloudinary
│       ├── controllers/         # Xử lý nghiệp vụ
│       ├── middlewares/         # auth, role, upload, errorHandler
│       ├── models/              # Mongoose schemas
│       ├── routes/              # API routes
│       ├── services/            # Business logic (auth, ai, ...)
│       ├── utils/               # AppError, helpers
│       └── server.js            # Entry point
│
├── backend-ai-python/           # AI Microservice (Python)
│   ├── services/
│   │   ├── extractor.py         # Tải PDF + extract text
│   │   └── scorer.py            # TF-IDF + Sentence-Transformer scoring
│   ├── app.py                   # FastAPI entry point
│   └── requirements.txt
│
└── frontend-ats/                # Web UI (React)
    └── src/
        ├── api/                 # axios instance + endpoints
        ├── assets/              # CSS, images
        ├── components/          # Reusable components
        ├── context/             # AuthContext
        ├── hooks/               # Custom hooks (useDebounce, ...)
        ├── layout/              # AuthLayout, CandidateLayout, RecruiterLayout, AdminLayout
        ├── pages/               # Pages theo role
        │   ├── auth/
        │   ├── candidate/
        │   ├── recruiter/
        │   └── admin/
        ├── ui/                  # Button, Input, Logo, ...
        ├── App.jsx              # Routes
        └── main.jsx             # Entry point
```

---

## API Endpoints chính

### Auth (`/api/auth`)
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/register` | Đăng ký tài khoản (chỉ candidate/recruiter) |
| POST | `/login` | Đăng nhập, trả accessToken + cookie refreshToken |
| POST | `/refresh` | Cấp accessToken mới từ cookie |
| POST | `/logout` | Xóa refresh cookie |
| GET | `/me` | Lấy thông tin user hiện tại |
| POST | `/forgot-password` | Gửi OTP qua email |
| POST | `/verify-otp` | Xác nhận OTP |
| POST | `/reset-password` | Đặt mật khẩu mới |
| PUT | `/profile` | Cập nhật profile (kèm upload avatar/CV) |

### Jobs (`/api/jobs`)
| Method | Endpoint | Quyền |
|---|---|---|
| GET | `/` | Public — list jobs đã duyệt |
| GET | `/featured` | Public — jobs nổi bật |
| GET | `/my-jobs` | Recruiter — jobs của chính mình |
| GET | `/:id` | Login — chi tiết job |
| POST | `/` | Recruiter — tạo job (status: pending) |
| PUT | `/:id` | Recruiter — sửa (reset về pending) |
| DELETE | `/:id` | Recruiter — soft delete |
| PATCH | `/:id/feature` | Recruiter — đánh dấu nổi bật |
| PATCH | `/:id/approval` | Admin — duyệt/từ chối |

### Applications (`/api/applications`)
| Method | Endpoint | Quyền |
|---|---|---|
| POST | `/:jobId/apply` | Candidate — nộp CV |
| GET | `/job/:jobId` | Recruiter — danh sách ứng viên |
| GET | `/my-apps` | Candidate — đơn ứng tuyển của mình |
| PATCH | `/:id/status` | Recruiter — đổi trạng thái |
| PATCH | `/:id/feature` | Recruiter — đánh dấu nổi bật |
| POST | `/:id/score` | Recruiter — chấm lại AI |

### Admin (`/api/admin`)
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/stats` | Dashboard stats |
| GET | `/users` | Danh sách users |
| PATCH | `/users/:id/status` | Khóa/mở khóa user |
| DELETE | `/users/:id` | Xóa user |
| GET | `/jobs` | Tất cả jobs (kể cả pending/inactive) |

### Notifications (`/api/notifications`)
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/` | Lấy 20 thông báo mới nhất |
| PUT | `/read-all` | Đánh dấu tất cả đã đọc |

---

## Luồng nghiệp vụ chính

### Luồng 1 — Nộp CV và chấm AI tự động (Fire-and-Forget)

1. Candidate gửi PDF qua form upload
2. Node.js validate file (chỉ PDF, max 5MB), lưu vào RAM dạng Buffer
3. Node.js stream Buffer lên Cloudinary, nhận `secure_url`
4. Node.js tạo bản ghi `Application` với `aiStatus: 'pending'`
5. **Trả 201 cho candidate ngay** (không chờ AI)
6. Node.js gửi request **ngầm** sang Python AI: `POST /score`
7. Python:
    - Đi qua Semaphore (max 5 task đồng thời)
    - Tải PDF từ Cloudinary, extract text bằng `pdfminer`
    - Encode CV và JD bằng Sentence-Transformer
    - Tính composite score: `0.55*semantic + 0.25*skill_match + 0.20*keyword_overlap`
    - Trả về `{ score, matched_keywords, summary }`
8. Node.js cập nhật `aiScore` và `aiStatus: 'done'` vào DB

### Luồng 2 — Duyệt tin tuyển dụng

1. Recruiter tạo job → backend force `approvalStatus: 'pending'`
2. Job không hiển thị trên trang tìm việc của candidate (filter `approvalStatus: 'approved'`)
3. Admin truy cập `/admin/jobs`, xem tất cả jobs
4. Admin gửi `PATCH /api/jobs/:id/approval` với `approvalStatus: 'approved'`
5. Tin chính thức hiển thị công khai

---

## Troubleshooting

### Backend Node.js không kết nối được MongoDB
- Kiểm tra `MONGODB_URI` trong `.env`
- Nếu dùng local, đảm bảo MongoDB đang chạy: `mongod`
- Nếu dùng Atlas, whitelist IP của bạn trong Network Access

### Python AI báo lỗi 401 khi tải CV
- Vào Cloudinary Dashboard → Settings → Security
- Tick "Allow delivery of PDF and ZIP files" → Save
- Các CV cũ vẫn bị 401, chỉ CV nộp sau khi tick mới hoạt động

### Lỗi `Must supply api_key` khi nộp CV
- Kiểm tra `CLOUDINARY_*` trong `backend-node/.env`
- Đảm bảo `dotenv.config()` là dòng đầu tiên trong `server.js`

### Lỗi `Cannot find module '@tailwindcss/forms'`
- Cài thêm: `npm install -D @tailwindcss/forms`
- Hoặc xóa dòng `require('@tailwindcss/forms')` trong `tailwind.config.js`

### Frontend reload liên tục
- Kiểm tra `useEffect` có dependency array `[]`
- Clear Vite cache: `rm -rf node_modules/.vite` rồi `npm run dev`

### AI luôn trả 0/100 điểm
- Kiểm tra job có `description` và `requirements` đủ dài (mỗi field >= 50 ký tự)
- AI cần JD đủ chi tiết để chấm, JD quá ngắn sẽ bị từ chối ở guard `len(jd_words) < 5`

### CV cũ bị kẹt `aiStatus: 'error'`
- Mở MongoDB Compass, vào collection `applications`
- Sửa `aiStatus` về `'pending'`, xóa `aiScore` và `aiSummary`
- Hoặc gọi API retrigger: `POST /api/applications/:id/score` (cần đăng nhập HR)

### Đăng nhập xong F5 bị về login
- Đảm bảo `AuthContext.jsx` có `useEffect` gọi `/auth/refresh` khi mount
- Kiểm tra cookie `refreshToken` được set với `httpOnly` và đúng `sameSite`

---

## Công nghệ sử dụng

**Frontend:**
- React 18 + Vite
- Tailwind CSS + lucide-react
- React Router v6
- Axios với interceptor refresh token tự động
- @tanstack/react-query

**Backend Node.js:**
- Express.js
- Mongoose (MongoDB ODM)
- bcryptjs (password hashing)
- jsonwebtoken (JWT)
- multer + cloudinary + streamifier (file upload)
- helmet, cors, express-rate-limit (security)

**Backend Python:**
- FastAPI + Uvicorn
- pdfminer.six (PDF text extraction)
- sentence-transformers + torch (semantic similarity)
- httpx (async HTTP client)
- pydantic (validation)

**Database & Storage:**
- MongoDB
- Cloudinary

---

## Tác giả

**Hoàng Năng Minh** Xây dựng hệ thống ATS tích hợp AI chấm điểm CV tự động

---

## License

Dự án này được phát triển cho mục đích học tập. Vui lòng không sử dụng cho mục đích thương mại nếu chưa có sự đồng ý của tác giả.
