'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import Webcam from 'react-webcam';
import { classifyImage, type InferResponse } from '@/lib/hf-client';
import { PATHWAY_LABEL, prettifyClassName, type Pathway } from '@/lib/disposal-info';

type DetectModel = {
  detect: (img: HTMLVideoElement) => Promise<Array<{ class: string; score: number; bbox: [number, number, number, number] }>>;
};

const PATHWAY_COLOR: Record<string, string> = {
  curbside_recycling: '#1973e6',
  dropoff_recycling:  '#9549b6',
  garbage:            '#47b868',
  compost:            '#d97706',
};

export default function ClassifyMode() {
  const webcamRef   = useRef<Webcam>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const modelRef    = useRef<DetectModel | null>(null);
  const rafRef      = useRef<number>(0);

  const [cameraError,    setCameraError]    = useState(false);
  const [facing,         setFacing]         = useState<'user' | 'environment'>('environment');
  const [capturedImage,  setCapturedImage]  = useState<string | null>(null);
  const [busy,           setBusy]           = useState(false);
  const [result,         setResult]         = useState<InferResponse | null>(null);
  const [inferError,     setInferError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await import('@tensorflow/tfjs');
        const cocoSsd = await import('@tensorflow-models/coco-ssd');
        const model   = await (cocoSsd as any).load({ base: 'lite_mobilenet_v2' });
        if (!cancelled) modelRef.current = model;
      } catch { /* works without detector */ }
    })();
    return () => { cancelled = true; cancelAnimationFrame(rafRef.current); };
  }, []);

  const detect = useCallback(async () => {
    const video  = webcamRef.current?.video;
    const canvas = canvasRef.current;
    if (!video || !canvas || !modelRef.current || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(detect);
      return;
    }
    try {
      const preds = await modelRef.current.detect(video);
      const ctx   = canvas.getContext('2d');
      if (!ctx) { rafRef.current = requestAnimationFrame(detect); return; }
      const dw = video.clientWidth;
      const dh = video.clientHeight;
      canvas.width  = dw;
      canvas.height = dh;
      const sx = dw / video.videoWidth;
      const sy = dh / video.videoHeight;
      ctx.clearRect(0, 0, dw, dh);
      for (const p of preds) {
        const [x, y, w, h] = p.bbox;
        ctx.strokeStyle = '#000';
        ctx.lineWidth   = 2;
        ctx.strokeRect(x * sx, y * sy, w * sx, h * sy);
        const label = `${p.class} ${Math.round(p.score * 100)}%`;
        ctx.font = 'bold 11px "Courier New"';
        const tw = ctx.measureText(label).width;
        ctx.fillStyle = '#000';
        ctx.fillRect(x * sx, y * sy - 20, tw + 8, 20);
        ctx.fillStyle = '#fff';
        ctx.fillText(label, x * sx + 4, y * sy - 5);
      }
    } catch { /* ignore frame errors */ }
    rafRef.current = requestAnimationFrame(detect);
  }, []);

  useEffect(() => {
    if (modelRef.current && !capturedImage) {
      rafRef.current = requestAnimationFrame(detect);
      return () => cancelAnimationFrame(rafRef.current);
    }
  }, [capturedImage, detect]);

  async function capture(base64: string) {
    cancelAnimationFrame(rafRef.current);
    canvasRef.current?.getContext('2d')?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setCapturedImage(base64);
    setBusy(true);
    setResult(null);
    setInferError(null);
    try {
      setResult(await classifyImage(base64));
    } catch (e) {
      setInferError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const snap = useCallback(() => {
    const img = webcamRef.current?.getScreenshot();
    if (img) capture(img);
  }, []);

  const onUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => capture(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  function reset() {
    setCapturedImage(null);
    setResult(null);
    setInferError(null);
    setTimeout(() => {
      if (modelRef.current) rafRef.current = requestAnimationFrame(detect);
    }, 100);
  }

  const pathway      = (result?.final_pathway ?? null) as Pathway | null;
  const stageOverrode = result?.stage_b_ran && result?.stage_a_pathway !== result?.final_pathway;

  return (
    <div className="flex" style={{ minHeight: '520px' }}>

      {/* ── Left: camera / captured image ── */}
      <div className="relative flex-1 bg-black" style={{ borderRight: '1px solid #000' }}>
        {capturedImage ? (
          <img
            src={capturedImage}
            alt="captured"
            style={{ width: '100%', height: '100%', objectFit: 'cover', maxHeight: '560px', display: 'block' }}
          />
        ) : cameraError ? (
          <div className="flex flex-col items-center justify-center h-full p-8 gap-4 bg-white">
            <p className="text-sm">Camera unavailable.</p>
            <label
              className="cursor-pointer text-sm underline"
              style={{ fontFamily: "'Courier New', Courier, monospace" }}
            >
              Upload an image instead
              <input type="file" accept="image/*" onChange={onUpload} className="sr-only" />
            </label>
          </div>
        ) : (
          <>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: facing }}
              onUserMediaError={() => setCameraError(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: '420px', maxHeight: '560px', display: 'block' }}
            />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

            {/* Flip camera — top-left */}
            <button
              onClick={() => setFacing(f => f === 'user' ? 'environment' : 'user')}
              title="Flip camera"
              style={{
                position: 'absolute', top: 10, left: 10,
                width: 32, height: 32,
                background: '#000', color: '#fff',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16,
                fontFamily: "'Courier New', Courier, monospace",
              }}
            >
              ⇄
            </button>

            {/* Capture — bottom-right (small black circle) */}
            <button
              onClick={snap}
              title="Capture"
              style={{
                position: 'absolute', bottom: 14, right: 14,
                width: 44, height: 44, borderRadius: '50%',
                background: '#000', border: '3px solid #fff',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', display: 'block' }} />
            </button>
          </>
        )}
      </div>

      {/* ── Right: instructions / results panel ── */}
      <div
        className="flex flex-col"
        style={{ width: 280, minWidth: 280, padding: 20, fontSize: '0.8125rem', lineHeight: 1.7 }}
      >
        {!capturedImage ? (
          /* Instructions */
          <>
            <p style={{ fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
              Instructions
            </p>
            <ol style={{ paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li><strong>1.</strong> Make sure your face is out of view of the camera.</li>
              <li><strong>2.</strong> Put the waste item you are planning to dispose of in frame and click the capture button.</li>
              <li><strong>3.</strong> Read EcoBin&apos;s determination on how your item should be disposed of.</li>
            </ol>
            <p style={{ marginTop: 16, fontSize: '0.75rem', color: '#555' }}>
              <strong style={{ color: '#000' }}>Note:</strong> We can be wrong! EcoBin&apos;s accuracy rate is estimated to be up to ~90%.
            </p>
            <label
              style={{ marginTop: 'auto', fontSize: '0.75rem', color: '#777', cursor: 'pointer', textDecoration: 'underline' }}
            >
              or upload a photo
              <input type="file" accept="image/*" onChange={onUpload} className="sr-only" />
            </label>
          </>
        ) : (
          /* Results */
          <>
            <p style={{ fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
              Determination
            </p>

            {busy && (
              <div>
                <div style={{ height: 12, background: '#e5e7eb', borderRadius: 2, width: '75%', marginBottom: 8 }} className="animate-pulse" />
                <div style={{ height: 12, background: '#e5e7eb', borderRadius: 2, width: '50%' }} className="animate-pulse" />
                <p style={{ marginTop: 10, fontSize: '0.75rem', color: '#777' }}>
                  Analysing... first request after idle takes a few extra seconds.
                </p>
              </div>
            )}

            {inferError && (
              <div style={{ border: '1px solid #000', padding: 10, fontSize: '0.75rem' }}>
                <p style={{ fontWeight: 700 }}>Error</p>
                <p style={{ color: '#555', marginTop: 4 }}>{inferError}</p>
              </div>
            )}

            {result?.status === 'rejected' && (
              <div style={{ border: '1px solid #000', padding: 10, fontSize: '0.75rem' }}>
                <p style={{ fontWeight: 700 }}>No classification</p>
                <p style={{ marginTop: 4 }}>
                  We detected a face in this photo. Take another picture of just the item.
                </p>
              </div>
            )}

            {result?.status === 'ok' && pathway && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Pathway badge */}
                <div
                  style={{
                    padding: '10px 12px',
                    backgroundColor: PATHWAY_COLOR[pathway] ?? '#000',
                    color: '#fff',
                  }}
                >
                  <p style={{ fontSize: '0.65rem', opacity: 0.85, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Dispose in
                  </p>
                  <p style={{ fontWeight: 700, fontSize: '1rem' }}>
                    {PATHWAY_LABEL[pathway] ?? pathway}
                  </p>
                </div>

                {/* Item details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.75rem' }}>
                  <div>
                    <p style={{ color: '#777', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.65rem', marginBottom: 2 }}>
                      Item identified
                    </p>
                    <p style={{ fontWeight: 600 }}>
                      {result.predicted_class ? prettifyClassName(result.predicted_class) : '—'}
                    </p>
                    {typeof result.stage_a_confidence === 'number' && (
                      <p style={{ color: '#777' }}>{Math.round(result.stage_a_confidence * 100)}% confidence</p>
                    )}
                  </div>

                  {result.stage_b_ran && result.stage_b_result && (
                    <div>
                      <p style={{ color: '#777', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.65rem', marginBottom: 2 }}>
                        Contamination check
                      </p>
                      {stageOverrode ? (
                        <p>
                          Found <strong>{prettifyClassName(result.stage_b_result.predicted_subgroup)}</strong>{' '}
                          ({Math.round(result.stage_b_result.prob_contaminated * 100)}% probability).
                          Redirected to garbage.
                        </p>
                      ) : (
                        <p>Looks clean. No contamination detected.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={reset}
              style={{
                marginTop: 'auto',
                width: '100%',
                border: '1px solid #000',
                padding: '8px 16px',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                background: '#fff',
                fontFamily: "'Courier New', Courier, monospace",
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = '#000'; (e.target as HTMLButtonElement).style.color = '#fff'; }}
              onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = '#fff'; (e.target as HTMLButtonElement).style.color = '#000'; }}
            >
              Scan another item
            </button>
          </>
        )}
      </div>
    </div>
  );
}
