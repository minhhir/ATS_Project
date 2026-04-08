import asyncio
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from services.extractor import extract_text_from_url
from services.scorer import score_cv

app = FastAPI(title='Mini ATS AI Service', version='1.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5000"], # Cho phép React và Node gọi
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
) 

class ScoreRequest(BaseModel):
    cv_url: str
    jd_text: str


class ScoreResponse(BaseModel):
    score: float
    matched_keywords: list[str]
    summary: str


@app.get('/health')
def health_check():
    return {'status': 'ok', 'service': 'ai-python'}


@app.post('/score', response_model=ScoreResponse)
async def score_application(req: ScoreRequest):
    try:
        # I/O-bound: tải PDF từ Cloudinary
        cv_text = await extract_text_from_url(req.cv_url)

        if not cv_text or len(cv_text) < 50:
            raise HTTPException(
                status_code=422,
                detail='PDF quá ngắn hoặc không có text thuần (có thể là ảnh scan).'
            )

        result = await asyncio.to_thread(score_cv, cv_text, req.jd_text)
        return result

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    # Exception không xác định → trả 500 (lỗi phía server)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)