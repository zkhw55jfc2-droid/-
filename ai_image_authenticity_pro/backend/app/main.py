from io import BytesIO
from pathlib import Path
from typing import Any
import os

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError

from .detector import detect_image

app = FastAPI(
    title="影鉴 Pro · AI 图像真实性分析 API",
    description="图像元数据分析与实验性 AI 图像分类 API。模型结果仅供参考。",
    version="0.3.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[x.strip() for x in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if x.strip()],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

MAX_BYTES = 12 * 1024 * 1024
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP", "GIF"}


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "detector": "model_configured_on_first_request", "model": os.getenv("AI_DETECTOR_MODEL", "capcheck/ai-image-detection"), "version": "0.3.0"}


@app.post("/api/analyze")
async def analyze(file: UploadFile = File(...)) -> dict[str, Any]:
    filename = Path(file.filename or "uploaded-image").name
    content_type = (file.content_type or "").lower()
    raw = await file.read(MAX_BYTES + 1)

    if not raw:
        raise HTTPException(status_code=400, detail="上传文件为空。")
    if len(raw) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="图片不能超过 12 MB。")

    try:
        image = Image.open(BytesIO(raw))
        image.verify()
        image = Image.open(BytesIO(raw))
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError):
        raise HTTPException(status_code=400, detail="无法识别图片文件，请上传有效的 JPG、PNG、WebP 或 GIF。")

    if image.format not in ALLOWED_FORMATS:
        raise HTTPException(status_code=415, detail="暂不支持该图片格式。")
    if image.width * image.height > 40_000_000:
        raise HTTPException(status_code=413, detail="图片像素总量过大（上限 4000 万像素）。")

    exif = image.getexif()
    metadata = {
        "format": image.format,
        "width": image.width,
        "height": image.height,
        "mode": image.mode,
        "has_exif": bool(exif),
        "exif_field_count": len(exif),
        "metadata_note": (
            "发现部分 EXIF 元数据。元数据可被修改，不能单独证明来源真实。"
            if exif else
            "未读取到 EXIF 元数据。社交平台压缩或导出也可能移除元数据，不能据此认定为 AI 图片。"
        ),
    }

    return {
        "filename": filename,
        "content_type": content_type,
        "size_bytes": len(raw),
        "metadata": metadata,
        "detection": detect_image(image),
        "disclaimer": "AI 分类器仅提供实验性参考分数，并非真实性证明。模型可能误判；请结合来源、元数据及人工复核。",
    }
