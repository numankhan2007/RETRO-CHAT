import { useState, useCallback, useRef, useEffect } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "../utils/cropImage";

export default function ImageCropperModal({ imageSrc, onComplete, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const containerRef = useRef(null);
  const [cropSize, setCropSize] = useState({ width: 300, height: 300 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        const size = Math.min(width, height) * 0.9;
        setCropSize({ width: size, height: size });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      setIsProcessing(true);
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onComplete(croppedImageBlob);
    } catch (e) {
      console.error(e);
      alert("Failed to crop image.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="w-full max-w-md bg-paper-100 rounded-lg shadow-retro-lg border-2 border-line overflow-hidden flex flex-col h-[500px]">
        <div className="flex-1 relative bg-black/10" ref={containerRef}>
          <div className="absolute top-0 left-0 right-0 z-10 bg-black/40 backdrop-blur-md pointer-events-none" style={{ bottom: `calc(50% + ${cropSize.height / 2}px)` }} />
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/40 backdrop-blur-md pointer-events-none" style={{ top: `calc(50% + ${cropSize.height / 2}px)` }} />
          <div className="absolute left-0 z-10 bg-black/40 backdrop-blur-md pointer-events-none" style={{ top: `calc(50% - ${cropSize.height / 2}px)`, bottom: `calc(50% - ${cropSize.height / 2}px)`, right: `calc(50% + ${cropSize.width / 2}px)` }} />
          <div className="absolute right-0 z-10 bg-black/40 backdrop-blur-md pointer-events-none" style={{ top: `calc(50% - ${cropSize.height / 2}px)`, bottom: `calc(50% - ${cropSize.height / 2}px)`, left: `calc(50% + ${cropSize.width / 2}px)` }} />
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropSize={cropSize}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            cropShape="rect"
            showGrid={true}
            style={{
              cropAreaStyle: { boxShadow: 'none', border: '2px solid rgba(255, 255, 255, 0.5)' }
            }}
          />
        </div>
        <div className="p-4 border-t-2 border-line bg-paper-200">
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onCancel}
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-bold border-2 border-line text-ink-500 hover:bg-paper-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-bold border-2 border-line bg-accent-400 text-white hover:bg-accent-500 disabled:opacity-50 flex items-center gap-2"
            >
              {isProcessing ? "Processing..." : "Save Photo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
