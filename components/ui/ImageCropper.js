'use client';

import { useEffect, useRef, useState } from 'react';
import { convertToWebp, canvasToWebpBlob, ensureWebpFileName, fileToImageBitmap } from '@/src/utils/image';

export default function ImageCropper({ open, file, onClose, onCropped, layoutMode = 'auto' }) {
  const [bitmap, setBitmap] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropRect, setCropRect] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [ratio, setRatio] = useState({ rw: 1, rh: 1 });
  const [sizeScale, setSizeScale] = useState(0.8);
  const canvasRef = useRef(null);
  const previewRef = useRef(null);
  const controlsRef = useRef(null);
  const [hasOverflowX, setHasOverflowX] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!open || !file) return;
      try {
        const r = await fileToImageBitmap(file);
        setBitmap(r.bitmap);
        const rto = r.bitmap.width / r.bitmap.height || 1;
        const maxW = 680;
        const maxH = 420;
        let w = Math.min(r.bitmap.width, maxW);
        let h = Math.round(w / rto);
        if (h > maxH) {
          h = maxH;
          w = Math.round(h * rto);
        }
        setCanvasSize({ w, h });
        const base = Math.min(w, h);
        let rw = Math.round(base * sizeScale);
        let rh = Math.round(rw * (ratio.rh / ratio.rw));
        if (rh > h) {
          rh = h;
          rw = Math.round(rh * (ratio.rw / ratio.rh));
        }
        const x = Math.round((w - rw) / 2);
        const y = Math.round((h - rh) / 2);
        setCropRect({ x, y, w: rw, h: rh });
        setTimeout(redraw, 0);
      } catch (e) {
        try {
          const result = await convertToWebp(file);
          const meta = { width: result.width, height: result.height, sizeBytes: result.sizeBytes, originalSizeBytes: result.originalSizeBytes, format: result.format };
          onCropped && onCropped({ file: result.file, meta });
          onClose && onClose();
        } catch (err) {
          onClose && onClose();
        }
      }
    };
    init();
  }, [open, file]);

  useEffect(() => {
    const el = controlsRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setHasOverflowX(el.scrollWidth > el.clientWidth + 2);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    redraw();
  }, [bitmap, canvasSize, cropRect, zoom, offset]);

  const computeRectFromScale = (cs, scale, r) => {
    const base = Math.min(cs.w, cs.h);
    let rw = Math.round(base * scale);
    let rh = Math.round(rw * (r.rh / r.rw));
    if (rh > cs.h) {
      rh = cs.h;
      rw = Math.round(rh * (r.rw / r.rh));
    }
    const x = Math.round((cs.w - rw) / 2);
    const y = Math.round((cs.h - rh) / 2);
    return { x, y, w: rw, h: rh };
  };

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas || !bitmap) return;
    const { w, h } = canvasSize;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    const destW = Math.round(w * zoom);
    const destH = Math.round(h * zoom);
    const destX = Math.round((w - destW) / 2 + offset.x);
    const destY = Math.round((h - destH) / 2 + offset.y);
    ctx.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height, destX, destY, destW, destH);
    if (cropRect) {
      const cr = cropRect;
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      // top overlay
      ctx.fillRect(0, 0, w, Math.max(0, cr.y));
      // bottom overlay
      ctx.fillRect(0, cr.y + cr.h, w, Math.max(0, h - (cr.y + cr.h)));
      // left overlay
      ctx.fillRect(0, cr.y, Math.max(0, cr.x), cr.h);
      // right overlay
      ctx.fillRect(cr.x + cr.w, cr.y, Math.max(0, w - (cr.x + cr.w)), cr.h);

      ctx.strokeStyle = '#FF5B2C';
      ctx.lineWidth = 2;
      ctx.strokeRect(cr.x, cr.y, cr.w, cr.h);
    }
    const pv = previewRef.current;
    if (pv) {
      const pctx = pv.getContext('2d');
      const { sx, sy, sw, sh } = computeCropPixels();
      const tw = pv.width;
      const th = pv.height;
      pctx.clearRect(0, 0, tw, th);
      pctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, tw, th);
    }
  };

  const applyCrop = async () => {
    if (!bitmap || !cropRect || !file) {
      onClose && onClose();
      return;
    }
    const { sx, sy, sw, sh } = computeCropPixels();
    const outCanvas = document.createElement('canvas');
    outCanvas.width = sw;
    outCanvas.height = sh;
    const octx = outCanvas.getContext('2d');
    octx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, sw, sh);
    const webpBlob = await canvasToWebpBlob(outCanvas, 0.82);
    const webpFile = new File([webpBlob], ensureWebpFileName(file.name), { type: 'image/webp' });
    const meta = { width: sw, height: sh, sizeBytes: webpBlob.size, originalSizeBytes: file.size || 0, format: 'webp' };
    onCropped && onCropped({ file: webpFile, meta });
    onClose && onClose();
  };

  const computeCropPixels = () => {
    const { w, h } = canvasSize;
    const destW = w * zoom;
    const destH = h * zoom;
    const destX = (w - destW) / 2 + offset.x;
    const destY = (h - destH) / 2 + offset.y;
    const mapX = x => ((x - destX) / destW) * bitmap.width;
    const mapY = y => ((y - destY) / destH) * bitmap.height;
    const sxRaw = mapX(cropRect.x);
    const syRaw = mapY(cropRect.y);
    const exRaw = mapX(cropRect.x + cropRect.w);
    const eyRaw = mapY(cropRect.y + cropRect.h);
    const sx = Math.max(0, Math.round(sxRaw));
    const sy = Math.max(0, Math.round(syRaw));
    const sw = Math.min(bitmap.width - sx, Math.round(exRaw - sxRaw));
    const sh = Math.min(bitmap.height - sy, Math.round(eyRaw - syRaw));
    return { sx, sy, sw, sh };
  };


  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center">
      <div role="dialog" aria-modal="true" aria-labelledby="cropTitle" className="bg-white w-[88vw] max-w-[1200px] h-[80vh] max-h-[80vh] rounded-2xl shadow flex flex-col">
        <div className="flex items-center justify-between px-6 py-3 border-b">
          <h3 className="text-lg font-semibold text-slate-900">Crop Image</h3>
          <button onClick={onClose} className="rounded-md border border-[#E5E6EF] px-3 py-1 text-sm">Close</button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 px-6 py-5 grow">
          <div className="border border-[#E5E6EF] rounded-xl p-3 bg-[#F8F9FC] h-full min-h-[420px] overflow-hidden flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={canvasSize.w}
              height={canvasSize.h}
              onMouseDown={(ev) => {
                const rect = ev.currentTarget.getBoundingClientRect();
                const x = ev.clientX - rect.left;
                const y = ev.clientY - rect.top;
                if (!cropRect) return;
                const inside = x >= cropRect.x && x <= cropRect.x + cropRect.w && y >= cropRect.y && y <= cropRect.y + cropRect.h;
                if (inside) {
                  setIsDragging(true);
                  setDragStart({ x, y });
                } else {
                  setIsPanning(true);
                  setPanStart({ x, y });
                }
              }}
              onMouseMove={(ev) => {
                const rectEl = ev.currentTarget.getBoundingClientRect();
                const x = ev.clientX - rectEl.left;
                const y = ev.clientY - rectEl.top;
                if (isDragging && cropRect) {
                  const dx = x - dragStart.x;
                  const dy = y - dragStart.y;
                  const nx = Math.max(0, Math.min(canvasSize.w - cropRect.w, cropRect.x + dx));
                  const ny = Math.max(0, Math.min(canvasSize.h - cropRect.h, cropRect.y + dy));
                  setCropRect({ x: nx, y: ny, w: cropRect.w, h: cropRect.h });
                  setDragStart({ x, y });
                  setTimeout(redraw, 0);
                  return;
                }
                if (isPanning) {
                  const dx = x - panStart.x;
                  const dy = y - panStart.y;
                  setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
                  setPanStart({ x, y });
                  setTimeout(redraw, 0);
                }
              }}
              onMouseUp={() => { setIsDragging(false); setIsPanning(false); setTimeout(redraw, 0); }}
              onMouseLeave={() => { setIsDragging(false); setIsPanning(false); }}
              onWheel={(ev) => {
                ev.preventDefault();
                const delta = ev.deltaY > 0 ? -0.1 : 0.1;
                const next = Math.min(3, Math.max(0.3, zoom + delta));
                setZoom(next);
                setTimeout(redraw, 0);
              }}
              className="block max-w-full h-auto"
            />
          </div>
          <div
            ref={controlsRef}
            role="region"
            aria-label="Crop controls"
            className={(
              layoutMode === 'horizontal'
                ? 'grid grid-cols-[3fr_2fr] gap-4 items-start'
                : layoutMode === 'vertical'
                ? 'grid grid-cols-1 gap-4 items-start'
                : 'grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-4 items-start'
            )}
          >
            <div className={(layoutMode === 'horizontal'
                ? 'flex flex-row items-center gap-4'
                : layoutMode === 'vertical'
                ? 'flex flex-col items-center gap-4'
                : 'flex flex-col md:flex-row md:flex-wrap items-center gap-4')
              }>
              <select
                value={`${ratio.rw}:${ratio.rh}`}
                onChange={e => {
                  const [rw, rh] = e.target.value.split(':').map(Number);
                  setRatio({ rw, rh });
                  const cr = computeRectFromScale(canvasSize, sizeScale, { rw, rh });
                  setCropRect(cr);
                  setTimeout(redraw, 0);
                }}
                className="h-10 px-3 rounded-xl border border-[#E5E6EF] bg-white text-sm"
              >
                <option value="1:1">Square 1:1</option>
                <option value="4:5">Portrait 4:5</option>
                <option value="3:4">Portrait 3:4</option>
                <option value="16:9">Landscape 16:9</option>
                <option value="4:3">Landscape 4:3</option>
              </select>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#5E6582]">Size</span>
                <input
                  type="range"
                  min={0.3}
                  max={1}
                  step={0.02}
                  value={sizeScale}
                  onChange={e => {
                    const v = Number(e.target.value);
                    setSizeScale(v);
                    const cr = computeRectFromScale(canvasSize, v, ratio);
                    setCropRect(cr);
                    setTimeout(redraw, 0);
                  }}
                  className="w-40"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#5E6582]">Zoom</span>
                <input
                  type="range"
                  min={0.3}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={e => { setZoom(Number(e.target.value)); setTimeout(redraw, 0); }}
                  className="w-48"
                />
                <span className="text-sm text-[#5E6582]">{zoom.toFixed(2)}×</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-4">
              <canvas ref={previewRef} width={260} height={260} className="border border-[#E5E6EF] rounded-xl bg-white" />
              <div className="flex items-center justify-center gap-4">
                <button onClick={onClose} className="h-10 px-4 rounded-xl border border-[#E5E6EF] bg-white text-sm">Cancel</button>
                <button onClick={applyCrop} className="h-10 px-5 rounded-xl bg-[#FF5B2C] text-white text-sm font-semibold">Apply Crop</button>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}