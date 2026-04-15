import tempfile
import re
import os
import httpx
import asyncio
from urllib.parse import urlparse
from pdfminer.high_level import extract_text


async def extract_text_from_url(url: str) -> str:
    """Tải PDF từ URL (async) và trích xuất text (chạy trên thread riêng)"""
    temp_path = None
    MAX_SIZE = 10 * 1024 * 1024  # 10MB

    try:
        # follow_redirects=True cần thiết cho Cloudinary và các CDN dùng redirect
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            async with client.stream('GET', url) as response:
                # Báo lỗi rõ ràng nếu URL không tồn tại hoặc bị từ chối
                if response.status_code == 404:
                    raise ValueError(f'File không tồn tại (404): {url}')
                if response.status_code == 403:
                    raise ValueError(f'Không có quyền truy cập file (403): {url}')
                response.raise_for_status()

                # Kiểm tra Content-Type để đảm bảo đây là file PDF
                # Dùng urlparse để lấy path, tránh bị query params đánh lừa (vd: Cloudinary URL)
                content_type = response.headers.get('content-type', '')
                url_path = urlparse(url).path.lower()
                if 'pdf' not in content_type and not url_path.endswith('.pdf'):
                    raise ValueError(
                        f'URL không trả về file PDF (Content-Type: {content_type}). '
                        'Chỉ hỗ trợ file PDF.'
                    )

                total_size = 0
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

    except ValueError:
        raise
    except httpx.TimeoutException:
        raise ValueError('Tải file PDF bị timeout (quá 15 giây). Thử lại sau.')
    except httpx.HTTPStatusError as e:
        raise ValueError(f'Lỗi HTTP khi tải file: {e.response.status_code}')
    except httpx.RequestError as e:
        raise ValueError(f'Không thể kết nối tới URL: {str(e)}')
    except Exception as e:
        raise ValueError(f'Lỗi khi xử lý PDF: {str(e)}')

    finally:
        # Dọn dẹp file tạm
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
