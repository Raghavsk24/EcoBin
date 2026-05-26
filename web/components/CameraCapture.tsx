'use client';

import { useCallback, useRef, useState } from 'react';
import Webcam from 'react-webcam';

interface Props {
  onCapture: (base64: string) => void;
}

export default function CameraCapture({ onCapture }: Props) {
  const webcamRef = useRef<Webcam>(null);
  const [facing, setFacing] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const snap = useCallback(() => {
    const img = webcamRef.current?.getScreenshot();
    if (img) onCapture(img);
  }, [onCapture]);

  const onUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onCapture(reader.result as string);
    reader.readAsDataURL(file);
  }, [onCapture]);

  return (
    <div className="space-y-3">
      {cameraError ? (
        <div className="card-pop text-sm">
          <p className="font-medium mb-2">Camera unavailable</p>
          <p className="text-slate-500 mb-3">
            We could not open your camera. Upload an image instead.
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={onUpload}
            className="block w-full text-sm"
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl aspect-square bg-slate-900">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: facing }}
            onUserMediaError={() => setCameraError('camera_denied')}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="flex gap-2 items-center">
        <button
          onClick={snap}
          disabled={!!cameraError}
          className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-medium"
        >
          Take Photo
        </button>
        <button
          onClick={() => setFacing(f => (f === 'user' ? 'environment' : 'user'))}
          disabled={!!cameraError}
          className="px-4 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Flip camera"
        >
          ⇄
        </button>
      </div>

      <label className="block text-center text-xs text-slate-500 cursor-pointer hover:underline">
        or upload an image from your device
        <input type="file" accept="image/*" onChange={onUpload} className="sr-only" />
      </label>
    </div>
  );
}
