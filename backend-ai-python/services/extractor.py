import tempfile
import re
import os
import httpx
import asyncio
from urllib.parse import urlparse
from pdfminer.high_level import extract_text


# Vấn đề: CV được lưu trên Cloudinary, không thể đọc trực tiếp; download sai cách dễ block event loop hoặc OOM với file lớn.
# Giải pháp: Stream PDF qua httpx async với giới hạn size & timeout, lưu temp rồi extract text trên thread pool.
async def extract_text_from_url(url: str) -> str:
    """Tải PDF từ URL (async) và trích xuất text (chạy trên thread riêng)"""
    temp_path = None
    MAX_SIZE = 10 * 1024 * 1024  # 10MB

    try:
        # Vấn đề: Cloudinary và các CDN thường trả về 302 redirect tới URL cuối, httpx mặc định không follow.
        # Giải pháp: Bật follow_redirects=True và đặt timeout 15s để tránh treo vô hạn.
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            async with client.stream('GET', url) as response:
                # Vấn đề: response.raise_for_status() chỉ ném HTTPStatusError chung chung, khó debug.
                # Giải pháp: Bắt riêng 404/403 thành ValueError có message rõ ràng cho client.
                if response.status_code == 404:
                    raise ValueError(f'File không tồn tại (404): {url}')
                if response.status_code == 403:
                    raise ValueError(f'Không có quyền truy cập file (403): {url}')
                response.raise_for_status()

                # Vấn đề: Cloudinary URL có nhiều query params (?v=...&fl=...) khiến endswith('.pdf') sai; có URL không có đuôi .pdf.
                # Giải pháp: Vừa check content-type vừa parse URL path bằng urlparse để loại query params.
                content_type = response.headers.get('content-type', '')
                url_path = urlparse(url).path.lower()
                if 'pdf' not in content_type and not url_path.endswith('.pdf'):
                    raise ValueError(
                        f'URL không trả về file PDF (Content-Type: {content_type}). '
                        'Chỉ hỗ trợ file PDF.'
                    )

                # Vấn đề: Đọc nguyên file vào RAM có thể OOM khi user gửi PDF khổng lồ hoặc URL trỏ tới file khác.
                # Giải pháp: Stream theo chunk 8KB, ghi vào temp file và cộng dồn size để cắt sớm khi vượt MAX_SIZE.
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
        # Vấn đề: Temp file nằm trên đĩa, nếu không xóa sẽ tích tụ và làm đầy ổ.
        # Giải pháp: Luôn xóa temp file trong finally, kể cả khi có exception.
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
