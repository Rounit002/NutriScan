import { useRef, useState, useEffect } from 'react';
import { Camera, Upload, Barcode, ArrowLeft, Mic, Zap, Search, History, Image as ImageIcon, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Home({ onImageSelected, onBack, onNavigateBarcode }) {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const [hasCameraAccess, setHasCameraAccess] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);
  const [note, setNote] = useState("");
  const [toast, setToast] = useState(null);

  // Initialize Camera Preview
  useEffect(() => {
    let activeStream = null;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        activeStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasCameraAccess(true);
        }
      } catch (err) {
        console.error("Camera access denied or not available:", err);
        setHasCameraAccess(false);
      }
    }
    startCamera();

    return () => {
      activeStream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width, height = img.height;
        const maxDim = 1200;
        if (width > height) { if (width > maxDim) { height *= maxDim / width; width = maxDim; } }
        else { if (height > maxDim) { width *= maxDim / height; height = maxDim; } }
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        onImageSelected(canvas.toDataURL('image/jpeg', 0.85));
        showToast(t('image_processed'), "success");
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const capturePhoto = () => {
    if (hasCameraAccess && videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
      onImageSelected(canvas.toDataURL('image/jpeg', 0.85));
      showToast(t('photo_captured'), "success");
    } else {
      // Fallback to native camera
      if (fileInputRef.current) {
        fileInputRef.current.setAttribute('capture', 'environment');
        fileInputRef.current.click();
      }
    }
  };

  const openGallery = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="scan-screen-wrapper">
      {/* Toast Notification */}
      {toast && (
        <div className="scan-toast" style={{ background: toast.type === 'error' ? 'var(--ns-error)' : 'var(--ns-success)' }}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="scan-header">
        <button onClick={onBack} className="scan-header-btn">
          <ArrowLeft size={22} />
        </button>
        <h1>{t('scanner')}</h1>
        <button onClick={() => window.location.hash = '#/history'} className="scan-header-btn">
          <History size={22} />
        </button>
      </header>

      <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />

      {/* Main Viewfinder Section */}
      <main className="scan-viewfinder-container">
        <div className={`scan-frame ${hasCameraAccess ? 'is-active' : ''}`}>
          {/* Live Video or Placeholder */}
          <div className="scan-live-preview">
            {hasCameraAccess ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: `scale(${zoom})` }}
              />
            ) : (
              <>
                <Camera size={48} className="scan-preview-muted" />
                <p className="scan-preview-message">{t('camera_unavailable')}</p>
              </>
            )}

            {/* Laser Line */}
            <div className="scan-laser" />

            {/* Brackets */}
            <div className="scan-brackets">
              <div className="scan-bracket bracket-tl" />
              <div className="scan-bracket bracket-tr" />
              <div className="scan-bracket bracket-bl" />
              <div className="scan-bracket bracket-br" />
            </div>

            {/* Torch Toggle */}
            <button
              onClick={() => setTorchOn(!torchOn)}
              className="scan-torch-button"
            >
              <Zap size={20} className={torchOn ? "scan-torch-on" : ""} />
            </button>
          </div>

          <div className="scan-helper-text">
            {t('point_camera')}
          </div>
        </div>

        {/* Zoom Slider */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 flex flex-col gap-2">
          <input
            type="range"
            min="1"
            max="3"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="scan-zoom-slider"
          />
          <div className="scan-zoom-labels">
            <span>1X</span>
            <span>{t('zoom')}</span>
            <span>3X</span>
          </div>
        </div>
      </main>

      {/* Bottom Interface */}
      <footer className="scan-bottom-bar">
        {/* Note Field (Expandable) */}
        <div
          className={`scan-note-field ${isNoteExpanded ? 'is-expanded' : ''}`}
          onClick={() => setIsNoteExpanded(!isNoteExpanded)}
        >
          <Mic size={20} className={note ? "scan-note-active" : "scan-note-muted"} />
          {isNoteExpanded ? (
            <input
              autoFocus
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('add_nutritional_note')}
              className="scan-note-input"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="scan-note-placeholder">
              {note || t('add_note')}
            </span>
          )}
          {note && !isNoteExpanded && <CheckCircle2 size={16} className="scan-note-active" />}
        </div>

        {/* Capture Control Row */}
        <div className="scan-capture-row">
          <button onClick={() => window.location.reload()} className="scan-control-icon">
            <RotateCcw size={22} />
          </button>

          <button onClick={capturePhoto} className="scan-capture-btn">
            <div className="scan-capture-btn-inner" />
          </button>

          <button className="scan-control-icon">
            <Search size={22} />
          </button>
        </div>

        {/* Secondary Actions Grid */}
        <div className="scan-actions-grid">
          <button onClick={onNavigateBarcode} className="scan-action-btn">
            <Barcode size={24} />
            <span className="text-[10px] font-black tracking-widest uppercase">{t('barcode')}</span>
          </button>

          <button onClick={openGallery} className="scan-action-btn">
            <ImageIcon size={24} />
            <span className="text-[10px] font-black tracking-widest uppercase">{t('gallery')}</span>
          </button>

          <button onClick={openGallery} className="scan-action-btn">
            <Upload size={24} />
            <span className="text-[10px] font-black tracking-widest uppercase">{t('upload')}</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
