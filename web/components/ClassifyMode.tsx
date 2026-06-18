'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { classifyImage, type InferResponse } from '@/lib/hf-client';
import { prettifyClassName } from '@/lib/disposal-info';

const PATHWAY_COLOR: Record<string, string> = {
  Recycling: '#1973e6',
  Compost:   '#d97706',
  Garbage:   '#47b868',
};

export default function ClassifyMode() {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [preview,    setPreview]    = useState<string | null>(null);
  const [busy,       setBusy]       = useState(false);
  const [result,     setResult]     = useState<InferResponse | null>(null);
  const [inferError, setInferError] = useState<string | null>(null);
  const [camActive,  setCamActive]  = useState(false);
  const [camError,   setCamError]   = useState<string | null>(null);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCamActive(false);
  }

  async function openCamera() {
    setCamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      });
      streamRef.current = stream;
      setCamActive(true);
      // Attach stream after the video element renders
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
    } catch {
      setCamError('Camera access denied. Please allow camera permissions and try again.');
    }
  }

  function capture() {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg');
    stopCamera();
    classify(dataUrl);
  }

  async function classify(dataUrl: string) {
    setPreview(dataUrl);
    setBusy(true);
    setResult(null);
    setInferError(null);
    try {
      setResult(await classifyImage(dataUrl));
    } catch (e) {
      setInferError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    stopCamera();
    setPreview(null);
    setResult(null);
    setInferError(null);
    setCamError(null);
  }

  const pathway = result?.pathway ?? null;

  return (
    <div className="flex" style={{ minHeight: '520px' }}>

      {/* ── Left: camera / preview ── */}
      <div className="relative flex-1" style={{ borderRight: '1px solid #000' }}>
        {preview ? (
          <img
            src={preview}
            alt="captured item"
            style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '560px', display: 'block', background: '#f9f9f9' }}
          />
        ) : camActive ? (
          <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '520px', background: '#000' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', maxHeight: '560px', display: 'block' }}
            />
            <button
              onClick={capture}
              style={{
                position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
                width: 64, height: 64, borderRadius: '50%',
                border: '4px solid #fff', background: 'rgba(255,255,255,0.9)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              }}
              aria-label="Capture photo"
            >
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#000' }} />
            </button>
            <button
              onClick={reset}
              style={{
                position: 'absolute', top: 12, right: 12,
                background: 'rgba(0,0,0,0.5)', color: '#fff',
                border: 'none', borderRadius: 4, padding: '4px 10px',
                fontSize: '0.75rem', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div
            style={{
              width: '100%', height: '100%', minHeight: '520px',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 16, background: '#fff',
            }}
          >
            <span style={{ fontSize: '3rem' }}>📷</span>
            <button
              onClick={openCamera}
              style={{
                border: '1px solid #000', padding: '10px 24px',
                fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                background: '#000', color: '#fff',
                fontFamily: "'Courier New', Courier, monospace",
              }}
            >
              Open Camera
            </button>
            {camError && (
              <p style={{ fontSize: '0.75rem', color: '#c00', textAlign: 'center', maxWidth: 240, padding: '0 16px' }}>
                {camError}
              </p>
            )}
          </div>
        )}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      {/* ── Right: instructions / results ── */}
      <div
        className="flex flex-col"
        style={{ width: 280, minWidth: 280, padding: 20, fontSize: '0.8125rem', lineHeight: 1.7 }}
      >
        {!preview ? (
          <>
            <p style={{ fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
              Instructions
            </p>
            <ol style={{ paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li><strong>1.</strong> Click &ldquo;Open Camera&rdquo; and point it at the waste item you want to dispose of.</li>
              <li><strong>2.</strong> Press the capture button to take a photo.</li>
              <li><strong>3.</strong> Read EcoBin&apos;s determination on how your item should be disposed of.</li>
            </ol>
            <p style={{ marginTop: 16, fontSize: '0.75rem', color: '#555' }}>
              <strong style={{ color: '#000' }}>Note:</strong> EcoBin was trained on studio-style images and may not perform well on real-world photos. If you think it made a mistake, try again from a different angle or in better lighting.
            </p>
          </>
        ) : (
          <>
            <p style={{ fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
              Determination
            </p>

            {busy && (
              <div>
                <div style={{ height: 12, background: '#e5e7eb', borderRadius: 2, width: '75%', marginBottom: 8 }} className="animate-pulse" />
                <div style={{ height: 12, background: '#e5e7eb', borderRadius: 2, width: '50%' }} className="animate-pulse" />
                <p style={{ marginTop: 10, fontSize: '0.75rem', color: '#777' }}>
                  Analysing… first request after idle takes about 20–30 seconds.
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
                <p style={{ marginTop: 4 }}>We detected a face in this photo. Capture a photo of just the item.</p>
              </div>
            )}

            {result?.status === 'ok' && pathway && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: '10px 12px', backgroundColor: PATHWAY_COLOR[pathway] ?? '#000', color: '#fff' }}>
                  <p style={{ fontSize: '0.65rem', opacity: 0.85, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Dispose in
                  </p>
                  <p style={{ fontWeight: 700, fontSize: '1rem' }}>
                    {pathway}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.75rem' }}>
                  <div>
                    <p style={{ color: '#777', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.65rem', marginBottom: 2 }}>
                      Item identified
                    </p>
                    <p style={{ fontWeight: 600 }}>
                      {result.predicted_class ? prettifyClassName(result.predicted_class) : '—'}
                    </p>
                    {typeof result.confidence === 'number' && (
                      <p style={{ color: '#777' }}>{Math.round(result.confidence * 100)}% confidence</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={reset}
              style={{
                marginTop: 'auto', width: '100%',
                border: '1px solid #000', padding: '8px 16px',
                fontSize: '0.8125rem', cursor: 'pointer',
                background: '#fff', fontFamily: "'Courier New', Courier, monospace",
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = '#000'; (e.target as HTMLButtonElement).style.color = '#fff'; }}
              onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = '#fff'; (e.target as HTMLButtonElement).style.color = '#000'; }}
            >
              Classify another item
            </button>
          </>
        )}
      </div>
    </div>
  );
}
