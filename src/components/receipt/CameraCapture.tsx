import { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, SwitchCamera, X, Loader2 } from 'lucide-react';

/** Acquire a Screen Wake Lock so the display stays on while the camera is active. */
const requestWakeLock = async (): Promise<WakeLockSentinel | null> => {
  try {
    if ('wakeLock' in navigator) {
      return await navigator.wakeLock.request('screen');
    }
  } catch (err) {
    console.warn('[CameraCapture] Wake Lock request failed:', err);
  }
  return null;
};

interface CameraCaptureProps {
  /** Called with the captured image file */
  onCapture: (file: File) => void;
  /** Close the camera view */
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  // ---------- start / stop camera ----------
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    // Release wake lock when camera stops
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
  }, []);

  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    setStarting(true);
    setError(null);
    stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Keep the screen on while camera is active
      wakeLockRef.current = await requestWakeLock();
    } catch (err: any) {
      console.error('[CameraCapture]', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError(`Could not access camera: ${err.message ?? err}`);
      }
    } finally {
      setStarting(false);
    }
  }, [stopCamera]);

  // Start camera on mount, stop on unmount
  useEffect(() => {
    startCamera(facingMode);
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- flip camera ----------
  const flipCamera = async () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    await startCamera(next);
  };

  // ---------- capture frame ----------
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `receipt-${Date.now()}.jpg`, { type: 'image/jpeg' });
        stopCamera();
        onCapture(file);
      },
      'image/jpeg',
      0.92,
    );
  };

  // ---------- render ----------
  return (
    <div className="relative flex flex-col items-center gap-3">
      {/* Hidden canvas for frame grab */}
      <canvas ref={canvasRef} className="hidden" />

      {error ? (
        <div className="flex flex-col items-center justify-center gap-3 p-8 border rounded-md bg-muted/40 text-center">
          <Camera className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      ) : (
        <>
          <div className="relative w-full overflow-hidden rounded-md border bg-black">
            {starting && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto max-h-[350px] object-contain"
            />
          </div>

          <div className="flex items-center gap-3 w-full justify-center">
            {/* Close */}
            <Button variant="outline" size="icon" onClick={() => { stopCamera(); onClose(); }} title="Close camera">
              <X className="h-5 w-5" />
            </Button>

            {/* Shutter */}
            <Button
              size="lg"
              className="rounded-full h-14 w-14 p-0 shadow-lg"
              onClick={capturePhoto}
              disabled={starting}
              title="Take photo"
            >
              <Camera className="h-6 w-6" />
            </Button>

            {/* Flip */}
            <Button variant="outline" size="icon" onClick={flipCamera} disabled={starting} title="Switch camera">
              <SwitchCamera className="h-5 w-5" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
