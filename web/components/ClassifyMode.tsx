'use client';

import { useRef, useState, useCallback } from 'react';
import { classifyImage, type InferResponse } from '@/lib/hf-client';
import { PATHWAY_LABEL, prettifyClassName, type Pathway } from '@/lib/disposal-info';

const PATHWAY_COLOR: Record<string, string> = {
  curbside_recycling: '#1973e6',
  dropoff_recycling:  '#9549b6',
  garbage:            '#47b868',
  compost:            '#d97706',
};

export default function ClassifyMode() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview,    setPreview]    = useState<string | null>(null);
  const [busy,       setBusy]       = useState(false);
  const [result,     setResult]     = useState<InferResponse | null>(null);
  const [inferError, setInferError] = useState<string | null>(null);
  const [dragging,   setDragging]   = useState(false);

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

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => classify(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => classify(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  function reset() {
    setPreview(null);
    setResult(null);
    setInferError(null);
  }

  const pathway       = (result?.final_pathway ?? null) as Pathway | null;
  const stageOverrode = result?.stage_b_ran && result?.stage_a_pathway !== result?.final_pathway;

  return (
    <div className="flex" style={{ minHeight: '520px' }}>

      {/* ── Left: upload / preview ── */}
      <div className="relative flex-1" style={{ borderRight: '1px solid #000' }}>
        {preview ? (
          <img
            src={preview}
            alt="uploaded item"
            style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '560px', display: 'block', background: '#f9f9f9' }}
          />
        ) : (
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            style={{
              width: '100%', height: '100%', minHeight: '520px',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', gap: 12,
              background: dragging ? '#f0f0f0' : '#fff',
              border: dragging ? '2px dashed #000' : '2px dashed #ccc',
              transition: 'background 0.15s, border-color 0.15s',
            }}
          >
            <span style={{ fontSize: '2rem' }}>+</span>
            <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Upload a photo</p>
            <p style={{ fontSize: '0.75rem', color: '#777' }}>or drag and drop an image here</p>
            <input ref={inputRef} type="file" accept="image/*" onChange={onFileChange} className="sr-only" />
          </div>
        )}
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
              <li><strong>1.</strong> Take a clear photo of the waste item you want to dispose of.</li>
              <li><strong>2.</strong> Upload the photo using the panel on the left.</li>
              <li><strong>3.</strong> Read EcoBin&apos;s determination on how your item should be disposed of.</li>
            </ol>
            <p style={{ marginTop: 16, fontSize: '0.75rem', color: '#555' }}>
              <strong style={{ color: '#000' }}>Note:</strong> EcoBin was trained on studio-style images and may not perform well on real-world photos. If you think it made a mistake, try again with a photo taken from a different angle or in better lighting.
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
                  Analysing... first request after idle takes about 20-30 seconds.
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
                <p style={{ marginTop: 4 }}>We detected a face in this photo. Upload a photo of just the item.</p>
              </div>
            )}

            {result?.status === 'ok' && pathway && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: '10px 12px', backgroundColor: PATHWAY_COLOR[pathway] ?? '#000', color: '#fff' }}>
                  <p style={{ fontSize: '0.65rem', opacity: 0.85, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Dispose in
                  </p>
                  <p style={{ fontWeight: 700, fontSize: '1rem' }}>
                    {PATHWAY_LABEL[pathway] ?? pathway}
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
                          ({Math.round(result.stage_b_result.prob_contaminated * 100)}% probability). Redirected to garbage.
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
