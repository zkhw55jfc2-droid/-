# 影鉴 Pro · AI 图像真实性分析工作台

React + FastAPI 全栈应用，提供图片上传、尺寸/格式/EXIF 检查，以及真实 Hugging Face 图像分类器的实验性 AI/真实图片分类。

## 重要边界

- 已接入 `capcheck/ai-image-detection` 分类模型，首次检测需要联网下载模型权重，首次运行会较慢。
- 这是基线分类器，不是取证级证明。它的训练数据与新型生成器可能存在分布差异；压缩、裁剪、截图和编辑都可能影响结果。模型分数不是校准后的真实性概率。
- 如果模型标签映射不匹配、模型加载失败或网络不可用，API 会明确返回不可用状态，不会伪造结果。
- 模型及其上游权重遵循各自模型卡的许可和限制；正式商用前请再次核实许可、依赖和部署成本。

## 本地运行

### 后端（Python 3.11 建议）
```bash
cd backend
python -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
首次调用 `/api/analyze` 时模型权重会下载到缓存。CPU 可以运行，但推理可能较慢。

### 前端（新开终端）
```bash
cd frontend
npm install
npm run dev
```
打开 Vite 输出的本地地址。默认 API 地址为 `http://127.0.0.1:8000`。部署时设置前端环境变量 `VITE_API_BASE_URL` 指向已部署的后端 URL，并在后端设置 `CORS_ORIGINS` 为前端完整域名（多个域名用逗号分隔）。

## API
- `GET /api/health`：健康检查
- `POST /api/analyze`：以 multipart/form-data 上传字段 `file`
- `GET /docs`：交互式 API 文档

## 生产部署前检查
1. 选择可运行 PyTorch/Transformers 的后端实例，确认内存与冷启动时间。
2. 先在目标图片类型上建立独立测试集，统计误报/漏报并校准阈值。
3. 配置 HTTPS、上传频率限制、文件清理策略、CORS 域名及隐私告知。
4. 不要仅凭一个模型的输出对个人、新闻或证据作出高风险判断。
