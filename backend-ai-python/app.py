import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from services.extractor import extract_text_from_url
from services.scorer import score_cv

# Vấn đề: Quá nhiều request scoring chạy song song sẽ ngốn RAM/CPU và làm sập service.
# Giải pháp: Dùng asyncio.Semaphore giới hạn số tác vụ chạy đồng thời ở MAX_CONCURRENT_TASKS.
MAX_CONCURRENT_TASKS = 5
semaphore = None

# Vấn đề: Semaphore phải được khởi tạo trong event loop hiện tại, không thể tạo ở module-level.
# Giải pháp: Dùng FastAPI lifespan để init semaphore khi app start và cleanup khi shutdown.
@asynccontextmanager
async def lifespan(app: FastAPI):
    global semaphore
    semaphore = asyncio.Semaphore(MAX_CONCURRENT_TASKS)
    yield
    # Dọn dẹp tài nguyên (nếu có) khi app tắt

app = FastAPI(title='Mini ATS AI Service', version='1.0', lifespan=lifespan)

# Vấn đề: Frontend (5173) và backend Node (5000) chạy ở origin khác nên trình duyệt sẽ chặn request.
# Giải pháp: Bật CORS cho phép đúng 2 origin tin cậy thay vì mở rộng "*".
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScoreRequest(BaseModel):
    cv_url: str
    jd_text: str
    jd_skills: list[str] | None = None

class ScoreResponse(BaseModel):
    score: float
    matched_keywords: list[str]
    summary: str


# Vấn đề: Cần endpoint nhẹ để load balancer / monitor biết service còn sống.
# Giải pháp: Trả về JSON cố định, không phụ thuộc DB hay model để luôn trả lời nhanh.
@app.get('/health')
def health_check():
    return {'status': 'ok', 'service': 'ai-python'}


# Vấn đề: Scoring vừa tải file (I/O) vừa chạy embedding (CPU nặng), nếu xử lý sai sẽ block event loop và crash service.
# Giải pháp: Bọc bằng semaphore, tách I/O async + CPU sang thread pool, và map các loại lỗi về HTTPException tương ứng.
@app.post('/score', response_model=ScoreResponse)
async def score_application(req: ScoreRequest):
    # Dùng Semaphore bọc luồng nặng
    async with semaphore:
        try:
            # I/O-bound: tải PDF từ Cloudinary
            cv_text = await extract_text_from_url(req.cv_url)

            # Vấn đề: PDF scan ảnh (không có text layer) sẽ trả về chuỗi rỗng → score sẽ vô nghĩa.
            # Giải pháp: Reject sớm với 422 để client biết cần upload PDF có text thật.
            if not cv_text or len(cv_text) < 50:
                raise HTTPException(
                    status_code=422,
                    detail='PDF quá ngắn hoặc không có text thuần (có thể là ảnh scan).'
                )

            # CPU-bound: Chạy embedding + scoring trên Thread pool để không chặn event loop
            result = await asyncio.to_thread(score_cv, cv_text, req.jd_text, req.jd_skills)
            return result

        except HTTPException:
            raise
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)