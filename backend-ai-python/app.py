import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from services.extractor import extract_text_from_url
from services.scorer import score_cv

MAX_CONCURRENT_TASKS = 5
semaphore = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global semaphore
    semaphore = asyncio.Semaphore(MAX_CONCURRENT_TASKS)
    yield
    # Dọn dẹp tài nguyên (nếu có) khi app tắt

app = FastAPI(title='Mini ATS AI Service', version='1.0', lifespan=lifespan)

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


@app.get('/health')
def health_check():
    return {'status': 'ok', 'service': 'ai-python'}


@app.post('/score', response_model=ScoreResponse)
async def score_application(req: ScoreRequest):
    # Dùng Semaphore bọc luồng nặng
    async with semaphore:
        try:
            # I/O-bound: tải PDF từ Cloudinary
            cv_text = await extract_text_from_url(req.cv_url)

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