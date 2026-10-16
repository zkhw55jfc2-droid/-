"""AI image detector adapter using an actual Hugging Face image classifier.

This is a baseline integration, not a forensic guarantee. The model is loaded lazily
so the API can start before model weights are downloaded.
"""
from functools import lru_cache
from typing import Any
import os

MODEL_ID = os.getenv("AI_DETECTOR_MODEL", "capcheck/ai-image-detection")


@lru_cache(maxsize=1)
def _load_pipeline():
    from transformers import pipeline
    # CPU-safe default. First request may take longer while weights download.
    return pipeline("image-classification", model=MODEL_ID, device=-1)


def detect_image(image: Any) -> dict:
    try:
        classifier = _load_pipeline()
        predictions = classifier(image.convert("RGB"), top_k=None)
        normalized = []
        for item in predictions:
            label = str(item.get("label", "")).strip()
            score = float(item.get("score", 0.0))
            normalized.append({"label": label, "score": max(0.0, min(1.0, score))})

        def is_ai_label(label: str) -> bool:
            value = label.lower().replace("_", " ").replace("-", " ")
            return any(token in value for token in ("fake", "artificial", "ai generated", "ai generated", "synthetic"))

        def is_real_label(label: str) -> bool:
            value = label.lower().replace("_", " ").replace("-", " ")
            return any(token in value for token in ("real", "human", "natural", "authentic"))

        ai = next((x for x in normalized if is_ai_label(x["label"])), None)
        real = next((x for x in normalized if is_real_label(x["label"])), None)
        if ai is None and real is None:
            return {
                "status": "label_mapping_unknown", "model_name": MODEL_ID, "score": None,
                "label": "模型标签无法自动识别",
                "message": "模型已运行，但返回的类别标签无法安全映射为 AI/真实图片。请检查模型标签配置。",
                "raw_predictions": normalized,
                "limitations": ["模型输出不是经过校准的真实性概率。", "请勿仅凭单一模型结果作出高风险判断。"],
            }

        chosen = ai if ai and (not real or ai["score"] >= real["score"]) else real
        predicted_ai = chosen is ai
        score = round(chosen["score"] * 100, 1) if chosen else None
        return {
            "status": "completed", "model_name": MODEL_ID, "score": score,
            "label": "模型倾向：AI 生成" if predicted_ai else "模型倾向：真实图像",
            "predicted_class": "ai_generated" if predicted_ai else "real_image",
            "message": "这是模型分类分数，不等同于经校准的真实概率；结果需要结合来源、元数据与人工复核。",
            "raw_predictions": normalized,
            "limitations": [
                "模型在特定训练数据上的表现不代表对所有新型生成器都可靠。",
                "压缩、截图、裁剪、修图和混合生成可能改变判断。",
                "不要将单次检测结果作为指控或法律/纪律决定的唯一依据。",
            ],
        }
    except Exception as exc:
        return {
            "status": "model_error", "model_name": MODEL_ID, "score": None,
            "label": "检测模型暂不可用",
            "message": "模型加载或推理失败。请检查网络、模型仓库可用性和后端依赖后重试。",
            "error_type": type(exc).__name__,
            "limitations": ["未成功运行模型，因此本次没有 AI 来源判断。"],
        }
