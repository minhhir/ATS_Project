import tempfile
import re
import os
import httpx
import asyncio  # Thêm thư viện asyncio
from pdfminer.high_level import extract_text


async def extract_text_from_url(url: str) -> str:
    """Tải PDF từ URL (async) và trích xuất text (chạy trên thread riêng)"""
    temp_path = None
    MAX_SIZE = 10 * 1024 * 1024  # 10MB
    total_size = 0

    try:
        # Tải file bất đồng bộ (I/O-bound) - Không chặn Event Loop
        async with httpx.AsyncClient(timeout=15.0) as client:
            async with client.stream('GET', url) as response:
                response.raise_for_status()

                with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
                    temp_path = temp_file.name

                    async for chunk in response.aiter_bytes(chunk_size=8192):
                        total_size += len(chunk)
                        if total_size > MAX_SIZE:
                            raise ValueError('File PDF quá lớn (tối đa 10MB)')
                        temp_file.write(chunk)

        # extract_text là hàm sync nặng, phải dùng asyncio.to_thread để không chặn Event Loop
        text = await asyncio.to_thread(extract_text, temp_path)

        # Làm sạch text
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    except Exception as e:
        raise ValueError(f'Lỗi khi xử lý PDF: {str(e)}')

    finally:
        # Dọn dẹp file rác
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)