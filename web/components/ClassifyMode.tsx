'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { predict, feedback } from '@/lib/hf-client';
import { pretty, resolveItem, searchClasses } from '@/lib/labels';
import type { PredictResult, Pathway } from '@/lib/types';

const PATHWAY_COLOR: Record<Pathway, string> = {
  Recycling: '#1973e6',
  Compost:   '#47b868',
  Garbage:   '#4b5563',
};

const MONO = "'Courier New', Courier, monospace";

export default function ClassifyMode() {
  const videoRef     = useRef<HTMLVideoElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const streamRef    = useRef<MediaStream | null>(null);
  const cancelledRef = useRef(false);

  const [preview,    setPreview]    = useState<string | null>(null);
  const [busy,       setBusy]       = useState(false);
  const [result,     setResult]     = useState<PredictResult | null>(null);
  const [inferError, setInferError] = useState<string | null>(null);
  const [camActive,  setCamActive]  = useState(false);
  const [camError,   setCamError]   = useState<string | null>(null);

  // The camera opens automatically as soon as the Scan tab (this component) mounts.
  useEffect(() => {
    cancelledRef.current = false;
    openCamera();
    return () => {
      cancelledRef.current = true;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (cancelledRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      streamRef.current = stream;
      setCamActive(true);
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
      setResult(await predict(dataUrl));
    } catch (e) {
      setInferError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Clearing the result re-opens the camera so the user can scan another item.
  function reset() {
    stopCamera();
    setPreview(null);
    setResult(null);
    setInferError(null);
    setCamError(null);
    openCamera();
  }

  const pathway = result?.pathway ?? null;
  const heatmap = result?.gradcam ? `data:image/png;base64,${result.gradcam}` : null;

  return (
    <div className="flex" style={{ minHeight: '520px' }}>

      {/* ── Left: camera / preview / Grad-CAM ── */}
      <div className="relative flex-1" style={{ borderRight: '1px solid #000' }}>
        {heatmap ? (
          <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
            <img
              src={heatmap}
              alt="Grad-CAM heatmap"
              style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '560px', display: 'block', background: '#000' }}
            />
            <span
              style={{
                position: 'absolute', bottom: 10, left: 10,
                background: 'rgba(0,0,0,0.65)', color: '#fff',
                padding: '3px 8px', fontSize: '0.65rem', letterSpacing: '0.06em',
                textTransform: 'uppercase', fontFamily: MONO,
              }}
            >
              AI heatmap (Grad-CAM)
            </span>
          </div>
        ) : preview ? (
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
            {camError ? (
              <>
                <p style={{ fontSize: '0.75rem', color: '#c00', textAlign: 'center', maxWidth: 260, padding: '0 16px' }}>
                  {camError}
                </p>
                <button
                  onClick={openCamera}
                  style={{
                    border: '1px solid #000', padding: '8px 20px',
                    fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
                    background: '#000', color: '#fff', fontFamily: MONO,
                  }}
                >
                  Retry camera
                </button>
              </>
            ) : (
              <p style={{ fontSize: '0.8125rem', color: '#777', fontFamily: MONO }}>Starting camera…</p>
            )}
          </div>
        )}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      {/* ── Right: instructions / results ── */}
      <div
        className="flex flex-col"
        style={{ width: 300, minWidth: 300, padding: 20, fontSize: '0.8125rem', lineHeight: 1.7 }}
      >
        {!preview ? (
          <>
            <p style={{ fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
              Instructions
            </p>
            <ol style={{ paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li><strong>1.</strong> The camera opens automatically. Point it at the waste item you want to dispose of.</li>
              <li><strong>2.</strong> Press the capture button to take a photo.</li>
              <li><strong>3.</strong> Read EcoBin&apos;s determination on how your item should be disposed of, and see the Grad-CAM heatmap.</li>
            </ol>
            <p style={{ marginTop: 'auto', paddingTop: 16, fontSize: '0.75rem', color: '#555' }}>
              <strong style={{ color: '#000' }}>Note:</strong> EcoBin was trained on studio-style images and may not perform well on real-world photos. If it makes a mistake, you can correct it by typing what the waste item actually is.
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

            {result && pathway && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: '10px 12px', backgroundColor: PATHWAY_COLOR[pathway], color: '#fff' }}>
                  <p style={{ fontSize: '0.65rem', opacity: 0.85, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Dispose in
                  </p>
                  <p style={{ fontWeight: 700, fontSize: '1rem' }}>
                    {pathway}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.75rem' }}>
                  <div>
                    <p style={{ color: '#777', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.65rem', marginBottom: 2 }}>
                      Item identified
                    </p>
                    <p style={{ fontWeight: 600 }}>{result.item_label}</p>
                  </div>

                  {/* confidence */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: '#777', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.65rem' }}>
                        Confidence
                      </span>
                      <span style={{ fontWeight: 700 }}>{Math.round(result.confidence * 100)}%</span>
                    </div>
                    <div style={{ height: 8, background: '#e5e7eb', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.round(result.confidence * 100)}%`, background: '#000' }} />
                    </div>
                  </div>

                  {result.low_confidence && (
                    <div style={{ border: '1px solid #b45309', background: '#fffbeb', color: '#92400e', padding: '6px 8px', fontSize: '0.7rem' }}>
                      ⚠ Low confidence — EcoBin isn&apos;t sure about this one. Double-check the result or re-scan.
                    </div>
                  )}

                  {result.corrected_by_memory && (
                    <div style={{ border: '1px solid #1973e6', background: '#eff6ff', color: '#1e40af', padding: '6px 8px', fontSize: '0.7rem' }}>
                      ✎ Overridden from memory — a previous correction taught EcoBin this is{' '}
                      <strong>{result.item_label}</strong> (model guessed {result.model_item_label}).
                    </div>
                  )}
                </div>

                <CorrectionBox result={result} />
              </div>
            )}

            <button
              onClick={reset}
              style={{
                marginTop: 'auto', width: '100%',
                border: '1px solid #000', padding: '8px 16px',
                fontSize: '0.8125rem', cursor: 'pointer',
                background: '#fff', fontFamily: MONO,
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

/* ── Correction box: a user can teach EcoBin the right item, which drives the
   backend's correction memory via /api/feedback. ── */
function CorrectionBox({ result }: { result: PredictResult }) {
  const [open,    setOpen]    = useState(false);
  const [query,   setQuery]   = useState('');
  const [status,  setStatus]  = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error,   setError]   = useState<string | null>(null);

  const suggestions = useMemo(() => searchClasses(query, 6), [query]);

  async function submit() {
    const resolved = resolveItem(query);
    if (!resolved) {
      setError('Enter one of the known item names (pick a suggestion below).');
      return;
    }
    setStatus('sending');
    setError(null);
    try {
      await feedback(result.prediction_id, resolved);
      setStatus('sent');
    } catch (e) {
      setError((e as Error).message);
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div style={{ border: '1px solid #47b868', background: '#f0fdf4', color: '#166534', padding: '8px 10px', fontSize: '0.72rem' }}>
        ✓ Thanks — EcoBin learned this and won&apos;t make the same mistake again.
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          width: '100%', border: '1px solid #000', padding: '7px 12px',
          fontSize: '0.72rem', cursor: 'pointer', background: '#fff',
          fontFamily: MONO,
        }}
      >
        👎 Wrong? Correct EcoBin
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <p style={{ fontSize: '0.72rem', color: '#444' }}>
        What was it actually? Your correction teaches EcoBin&apos;s memory.
      </p>
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); setError(null); }}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
        placeholder="e.g. Steel Food Cans"
        disabled={status === 'sending'}
        style={{
          border: '1px solid #000', padding: '7px 9px',
          fontSize: '0.75rem', fontFamily: MONO, width: '100%',
        }}
      />
      {query.trim().length > 0 && !resolveItem(query) && suggestions.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {suggestions.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setQuery(pretty(c))}
              style={{
                border: '1px solid #ccc', padding: '3px 7px',
                fontSize: '0.68rem', cursor: 'pointer', background: '#fff',
                fontFamily: MONO,
              }}
            >
              {pretty(c)}
            </button>
          ))}
        </div>
      )}
      {resolveItem(query) && (
        <p style={{ fontSize: '0.7rem', color: '#166534' }}>✓ {pretty(resolveItem(query)!)}</p>
      )}
      {error && <p style={{ fontSize: '0.68rem', color: '#c00' }}>{error}</p>}
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={submit}
          disabled={status === 'sending' || !resolveItem(query)}
          style={{
            flex: 1, border: '1px solid #000', padding: '6px 10px',
            fontSize: '0.72rem', cursor: 'pointer',
            background: resolveItem(query) ? '#000' : '#999', color: '#fff',
            fontFamily: MONO,
          }}
        >
          {status === 'sending' ? 'Teaching…' : 'Teach EcoBin'}
        </button>
        <button
          onClick={() => { setOpen(false); setQuery(''); setError(null); }}
          disabled={status === 'sending'}
          style={{
            border: '1px solid #000', padding: '6px 10px',
            fontSize: '0.72rem', cursor: 'pointer', background: '#fff',
            fontFamily: MONO,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
