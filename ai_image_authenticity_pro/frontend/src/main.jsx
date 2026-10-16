import React, { useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ShieldCheck, ScanSearch, UploadCloud, Image as ImageIcon, FileCheck2,
  CircleAlert, CheckCircle2, LoaderCircle, RotateCcw, ArrowUpRight,
  Fingerprint, Microscope, LockKeyhole, Info, ChevronRight, Activity,
  FileSearch, CircleHelp, ShieldAlert, Sparkles, Database, Clock3,
  SlidersHorizontal, ExternalLink, Check, X
} from 'lucide-react'
import './styles.css'

const API = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')
const fmtBytes = n => n < 1024 ? `${n} B` : n < 1048576 ? `${(n/1024).toFixed(1)} KB` : `${(n/1048576).toFixed(2)} MB`

function App() {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  function chooseFile(next) {
    if (!next) return
    setError(''); setResult(null)
    if (!next.type.startsWith('image/')) { setError('文件格式不正确，请选择图片。'); return }
    if (next.size > 12 * 1024 * 1024) { setError('文件超过 12 MB，请选择更小的图片。'); return }
    if (preview) URL.revokeObjectURL(preview)
    setFile(next); setPreview(URL.createObjectURL(next))
  }

  async function analyze() {
    if (!file || busy) return
    setBusy(true); setError(''); setResult(null)
    const body = new FormData(); body.append('file', file)
    try {
      const response = await fetch(`${API}/api/analyze`, { method: 'POST', body })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || '分析失败，请重试。')
      setResult(data); setActiveTab('overview')
    } catch (e) {
      setError(e.message || '无法连接本地后端。请确认 FastAPI 服务已启动。')
    } finally { setBusy(false) }
  }

  function reset() {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null); setPreview(''); setResult(null); setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const m = result?.metadata
  const d = result?.detection

  return <div className="app">
    <aside className="sidebar">
      <a className="logo" href="#"><span className="logo-mark"><Fingerprint size={21}/></span><span>影鉴 <small>PRO</small><em>IMAGE FORENSICS</em></span></a>
      <div className="side-label">工作空间</div>
      <button className="nav-item active"><ScanSearch size={17}/> 图像检测 <span className="nav-pill">01</span></button>
      <button className="nav-item" onClick={() => setError('历史记录功能将在后续版本接入。')}><Activity size={17}/> 检测记录</button>
      <button className="nav-item" onClick={() => setError('来源验证模块将在后续版本接入。')}><Fingerprint size={17}/> 来源凭证</button>
      <div className="side-label tools-label">系统</div>
      <button className="nav-item" onClick={() => setError('当前模型状态：尚未接入检测模型。')}><SlidersHorizontal size={17}/> 检测配置</button>
      <div className="sidebar-bottom">
        <div className="privacy-card"><div className="privacy-icon"><LockKeyhole size={16}/></div><strong>本地隐私保护</strong><p>图片通过本机后端处理，当前不会发送至第三方检测服务。</p><span><i/> LOCAL MODE</span></div>
        <div className="side-version"><span>影鉴 Pro</span><span>v0.2.0</span></div>
      </div>
    </aside>

    <main className="main">
      <header className="topbar">
        <div className="breadcrumbs"><span>工作空间</span><ChevronRight size={14}/><strong>图像真实性分析</strong></div>
        <div className="top-status"><span className="live-dot"/> 本地服务 <span className="top-divider"/> <span className="version">MVP · 0.2</span></div>
      </header>

      <div className="content">
        <section className="page-intro">
          <div><div className="eyebrow"><span/> DIGITAL TRUST & FORENSICS</div><h1>图像真实性分析</h1><p>从文件信息、来源线索到视觉特征，构建更透明的图像核验流程。</p></div>
          <div className="intro-stamp"><ShieldCheck size={18}/><span><strong>证据优先</strong><small>EVIDENCE FIRST</small></span></div>
        </section>

        <section className="metrics">
          <div className="metric-card"><div className="metric-top"><span>分析流程</span><span className="metric-icon teal"><ScanSearch size={17}/></span></div><div className="metric-value">03 <small>STEPS</small></div><div className="metric-foot">上传 · 解析 · 生成报告</div></div>
          <div className="metric-card"><div className="metric-top"><span>文件隐私</span><span className="metric-icon blue"><LockKeyhole size={17}/></span></div><div className="metric-value">本地 <small>LOCAL</small></div><div className="metric-foot"><span className="tiny-green"/> 图片不发送至第三方 API</div></div>
          <div className="metric-card"><div className="metric-top"><span>检测模型</span><span className="metric-icon amber"><Microscope size={17}/></span></div><div className="metric-value model-value">待配置</div><div className="metric-foot">真实模型接入后启用 AI 判定</div></div>
          <div className="metric-card"><div className="metric-top"><span>报告状态</span><span className="metric-icon purple"><FileCheck2 size={17}/></span></div><div className="metric-value report-value">{result ? '已生成' : '待分析'}</div><div className="metric-foot">{result ? '文件信息分析已完成' : '等待上传待检测图片'}</div></div>
        </section>

        <div className="work-grid">
          <section className="card upload-card">
            <div className="card-heading"><div><span className="section-index">01</span><div><h2>上传图片</h2><p>选择需要核验的图像文件</p></div></div>{file && <button className="icon-button" title="重置" onClick={reset}><RotateCcw size={15}/></button>}</div>
            {!file ? <div className={`dropzone ${dragging ? 'dragging' : ''}`} onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);chooseFile(e.dataTransfer.files?.[0])}} onClick={()=>inputRef.current?.click()} role="button" tabIndex="0" onKeyDown={e=>e.key==='Enter'&&inputRef.current?.click()}>
              <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={e=>chooseFile(e.target.files?.[0])}/>
              <div className="upload-illustration"><div className="image-outline"><ImageIcon size={27}/><span>+</span></div><div className="upload-arrow"><UploadCloud size={18}/></div></div>
              <strong>将图片拖拽至此处</strong><span className="drop-sub">或 <b>浏览本地文件</b></span><div className="file-types"><span>JPG</span><span>PNG</span><span>WEBP</span><span>GIF</span></div>
            </div> : <div className="selected-file"><div className="selected-preview"><img src={preview} alt="待检测图片预览"/></div><div className="selected-meta"><span className="file-badge"><ImageIcon size={16}/></span><div><strong title={file.name}>{file.name}</strong><small>{fmtBytes(file.size)} · 已准备就绪</small></div><CheckCircle2 size={17} className="ok-icon"/></div></div>}
            {error && <div className="error-box"><CircleAlert size={16}/><span>{error}</span><button onClick={()=>setError('')}><X size={14}/></button></div>}
            <div className="upload-specs"><span><Check size={13}/> 文件完整性校验</span><span><Check size={13}/> 最大 12 MB</span></div>
            <button className="analyze-button" disabled={!file||busy} onClick={analyze}>{busy?<><LoaderCircle size={17} className="spin"/> 正在解析文件…</>:<><ScanSearch size={17}/> 开始分析 <ArrowUpRight size={16}/></>}</button>
            <div className="privacy-note"><LockKeyhole size={13}/> 文件发送至本机后端处理，暂不调用外部服务</div>
          </section>

          <section className="card report-card">
            <div className="card-heading"><div><span className="section-index">02</span><div><h2>检测报告</h2><p>分析结果与证据摘要</p></div></div><span className={`report-status ${result?'complete':''}`}><i/>{result?'ANALYSIS READY':'AWAITING INPUT'}</span></div>
            {!result ? <div className="report-empty"><div className="radar"><div className="radar-circle c1"/><div className="radar-circle c2"/><div className="radar-circle c3"/><div className="radar-sweep"/><ScanSearch size={28}/></div><h3>等待开始分析</h3><p>上传图片后，系统将解析文件属性并展示当前可用的来源证据。</p><div className="empty-steps"><span><i>01</i> 文件解析</span><span><i>02</i> 元数据读取</span><span className="muted"><i>03</i> 模型推理待接入</span></div><div className="model-notice"><Info size={15}/><span><strong>AI 检测模型尚未配置</strong><small>为避免误导，当前不会显示虚构的 AI 概率。</small></span></div></div> :
              <div className="report-body">
                <div className="result-banner"><div className="result-symbol"><Info size={21}/></div><div className="result-text"><span>综合判定</span><h3>{d?.label || '暂无法判断'}</h3><p>{d?.message || '当前仅完成文件信息分析。'}</p></div><span className="result-chip">MODEL N/A</span></div>
                <div className="score-panel"><div><span className="field-label">AI 生成可能性</span><div className="score-number">N/A <small>未评估</small></div></div><div className="score-right"><span className="score-tag">模型未接入</span><div className="score-track"><i/></div><small>暂不生成概率分数</small></div></div>
                <div className="result-tabs"><button className={activeTab==='overview'?'selected':''} onClick={()=>setActiveTab('overview')}>文件概览</button><button className={activeTab==='evidence'?'selected':''} onClick={()=>setActiveTab('evidence')}>证据与限制</button></div>
                {activeTab==='overview' ? <div className="details-grid">
                  <div><span>文件名称</span><strong title={result.filename}>{result.filename}</strong></div><div><span>文件大小</span><strong>{fmtBytes(result.size_bytes)}</strong></div><div><span>图像尺寸</span><strong>{m.width} × {m.height} px</strong></div><div><span>文件格式</span><strong>{m.format}</strong></div><div><span>色彩模式</span><strong>{m.mode}</strong></div><div><span>EXIF 元数据</span><strong>{m.has_exif?'已发现':'未发现'}</strong></div>
                </div> : <div className="evidence-list"><div><Info size={15}/><span><strong>元数据不能证明来源</strong><small>{m.metadata_note}</small></span></div><div><Microscope size={15}/><span><strong>模型分析尚不可用</strong><small>需要接入经过验证的检测模型并评估误报、漏报和概率校准。</small></span></div><div><Fingerprint size={15}/><span><strong>来源凭证未核验</strong><small>当前版本尚未解析 C2PA 内容凭证或专用生成水印。</small></span></div></div>}
                <div className="report-footer-note"><ShieldAlert size={15}/><span>{result.disclaimer}</span></div>
              </div>}
          </section>
        </div>

        <section className="method-card"><div className="method-heading"><div><span className="section-index">03</span><div><h2>分析维度</h2><p>以多种证据相互印证，降低单一线索造成的误判</p></div></div><span className="method-caption">ANALYSIS FRAMEWORK</span></div><div className="method-grid">
          <div className="method-item"><div className="method-icon cyan"><Fingerprint size={19}/></div><div><strong>来源与凭证</strong><p>核查可用的内容凭证、数字签名与生成水印。</p><span>PROVENANCE</span></div></div>
          <div className="method-item"><div className="method-icon violet"><Microscope size={19}/></div><div><strong>视觉特征检测</strong><p>通过经评估的模型分析图像统计与视觉模式。</p><span>MODEL INFERENCE</span></div></div>
          <div className="method-item"><div className="method-icon gold"><FileSearch size={19}/></div><div><strong>文件元数据</strong><p>检查尺寸、格式与 EXIF 等可用文件信息。</p><span>METADATA</span></div></div>
          <div className="method-item"><div className="method-icon green"><ShieldCheck size={19}/></div><div><strong>不确定性管理</strong><p>展示证据边界，避免把模型分数当作绝对事实。</p><span>CALIBRATION</span></div></div>
        </div></section>
        <footer><div className="footer-brand"><Fingerprint size={16}/> 影鉴 <b>PRO</b></div><span>图像真实性分析工作台 · 研究与辅助核验用途</span><span className="footer-right">BUILT AROUND EVIDENCE <Sparkles size={13}/></span></footer>
      </div>
    </main>
  </div>
}
createRoot(document.getElementById('root')).render(<App/>)
