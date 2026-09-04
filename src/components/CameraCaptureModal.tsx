import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { StudyAttachment } from '../types';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (attachment: StudyAttachment) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Start camera stream when modal opens
  useEffect(() => {
    if (!isOpen) {
      cleanupStream();
      setCapturedDataUrl(null);
      setCameraError(null);
      return;
    }

    startCamera();

    return () => {
      cleanupStream();
    };
  }, [isOpen, facingMode]);

  const cleanupStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const startCamera = async () => {
    cleanupStream();
    setCameraError(null);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: unknown) {
      console.error('Camera access error:', err);
      // Try fallback to any video device
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        setStream(fallbackStream);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
        }
      } catch (fallbackErr) {
        setCameraError(
          'Could not access camera. Please check browser permissions or upload an image file instead.'
        );
      }
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleTakeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedDataUrl(dataUrl);
    cleanupStream();
  };

  const handleRetake = () => {
    setCapturedDataUrl(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (!capturedDataUrl) return;

    // Approximate size calculation
    const approxBytes = Math.round((capturedDataUrl.length * 3) / 4);

    const attachment: StudyAttachment = {
      id: `snap_${Date.now()}`,
      name: `Photo_${new Date().toLocaleTimeString().replace(/:/g, '-')}.jpg`,
      size: approxBytes,
      mimeType: 'image/jpeg',
      data: capturedDataUrl,
      previewUrl: capturedDataUrl
    };

    onCapture(attachment);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="camera-capture-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4"
    >
      <div
        id="camera-capture-modal-container"
        className="relative w-full max-w-lg bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-semibold">Snap Study Material</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport */}
        <div className="relative aspect-4/3 w-full bg-black flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center text-slate-400 max-w-sm">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
              <p className="text-sm text-slate-300 font-medium mb-1">Camera Unavailable</p>
              <p className="text-xs text-slate-400">{cameraError}</p>
            </div>
          ) : capturedDataUrl ? (
            <img
              src={capturedDataUrl}
              alt="Captured preview"
              className="w-full h-full object-contain"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Document scan corner overlay guides */}
              <div className="pointer-events-none absolute inset-6 border-2 border-indigo-400/40 rounded-xl flex flex-col justify-between p-2">
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-indigo-400"></div>
                  <div className="w-4 h-4 border-t-2 border-r-2 border-indigo-400"></div>
                </div>
                <div className="text-center text-[11px] font-medium text-indigo-200/80 bg-slate-950/60 py-1 px-3 rounded-full mx-auto backdrop-blur-xs">
                  Position problem, diagram, or page within frame
                </div>
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-b-2 border-l-2 border-indigo-400"></div>
                  <div className="w-4 h-4 border-b-2 border-r-2 border-indigo-400"></div>
                </div>
              </div>
            </>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          {!capturedDataUrl ? (
            <>
              <button
                type="button"
                onClick={toggleFacingMode}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Switch Camera"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Flip</span>
              </button>

              <button
                type="button"
                id="capture-shutter-btn"
                onClick={handleTakeSnapshot}
                disabled={!!cameraError}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm px-6 py-2.5 rounded-full shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Capture</span>
              </button>

              <div className="w-16"></div>
            </>
          ) : (
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                id="retake-photo-btn"
                onClick={handleRetake}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retake</span>
              </button>

              <button
                type="button"
                id="use-photo-btn"
                onClick={handleConfirm}
                className="flex items-center gap-1.5 text-xs font-medium text-white px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-md shadow-emerald-900/30 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Use Photo</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
