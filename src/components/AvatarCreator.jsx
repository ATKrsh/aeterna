import React, { useState, useRef, useCallback } from 'react';
import './AvatarCreator.css';

const API_URL = 'http://localhost:8000';

const STAGES = {
  IDLE: 'idle',
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  DONE: 'done',
  ERROR: 'error',
};

const AvatarCreator = ({ onAvatarExported }) => {
  const [stage, setStage] = useState(STAGES.IDLE);
  const [photos, setPhotos] = useState([]); // [{file, previewUrl}]
  const [dragOver, setDragOver] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  // ── File handling ──────────────────────────────────────────────────────────
  const addFiles = useCallback((files) => {
    const imageFiles = Array.from(files).filter((f) =>
      f.type.startsWith('image/')
    );
    if (!imageFiles.length) return;

    const newPhotos = imageFiles.slice(0, 10 - photos.length).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      id: Math.random().toString(36).slice(2),
    }));
    setPhotos((prev) => [...prev, ...newPhotos].slice(0, 10));
    setErrorMsg('');
  }, [photos.length]);

  const removePhoto = (id) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo) URL.revokeObjectURL(photo.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  // ── Avatar generation ──────────────────────────────────────────────────────
  const generateAvatar = async () => {
    if (!photos.length) {
      setErrorMsg('Please upload at least one photo of your face.');
      return;
    }

    setStage(STAGES.UPLOADING);
    setProgressMsg('Uploading photos…');
    setErrorMsg('');

    try {
      // Check backend is alive
      try {
        await fetch(`${API_URL}/health`, { mode: 'cors' });
      } catch {
        throw new Error(
          'Cannot reach the Avatar backend. Please start it:\n\n  cd aeterna-backend && start.bat'
        );
      }

      const formData = new FormData();
      for (const p of photos) {
        formData.append('photos', p.file);
      }

      setStage(STAGES.PROCESSING);
      setProgressMsg('Analysing facial structure…');

      // Simulate step messages while waiting
      const msgs = [
        'Detecting facial landmarks…',
        'Building 3D face mesh…',
        'Applying photo texture…',
        'Finalising avatar…',
      ];
      let msgIdx = 0;
      const ticker = setInterval(() => {
        msgIdx = (msgIdx + 1) % msgs.length;
        setProgressMsg(msgs[msgIdx]);
      }, 1800);

      let data;
      try {
        const resp = await fetch(`${API_URL}/generate-avatar`, {
          method: 'POST',
          body: formData,
          mode: 'cors',
        });
        clearInterval(ticker);
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.detail || `Server error: ${resp.status}`);
        }
        data = await resp.json();
      } catch (fetchErr) {
        clearInterval(ticker);
        throw fetchErr;
      }

      setStage(STAGES.DONE);
      setProgressMsg('Avatar ready!');

      // Small delay so the "done" state is visible
      await new Promise((r) => setTimeout(r, 800));
      onAvatarExported(data.avatarUrl);
    } catch (err) {
      setStage(STAGES.ERROR);
      setErrorMsg(err.message || 'Unknown error');
    }
  };

  const reset = () => {
    photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPhotos([]);
    setStage(STAGES.IDLE);
    setProgressMsg('');
    setErrorMsg('');
  };

  // ── Render helpers ─────────────────────────────────────────────────────────
  const isProcessing = stage === STAGES.UPLOADING || stage === STAGES.PROCESSING;
  const isDone = stage === STAGES.DONE;

  return (
    <div className="ac-root">
      {/* ── Header ── */}
      <div className="ac-header">
        <div className="ac-logo-ring">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="13" stroke="url(#gr)" strokeWidth="2" />
            <circle cx="14" cy="11" r="5" fill="url(#gr)" />
            <ellipse cx="14" cy="22" rx="8" ry="5" fill="url(#gr)" />
            <defs>
              <linearGradient id="gr" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                <stop stopColor="#a855f7" />
                <stop offset="1" stopColor="#7dd3fc" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div>
          <h2 className="ac-title gradient-text">Create Your Avatar</h2>
          <p className="ac-subtitle">
            Upload face photos — Aeterna generates a hyper-realistic 3D persona from your images.
          </p>
        </div>
      </div>

      {/* ── Tips ── */}
      {stage === STAGES.IDLE && (
        <div className="ac-tips">
          <span className="ac-tip">📸 Front-facing photo</span>
          <span className="ac-tip">💡 Good lighting</span>
          <span className="ac-tip">🔍 Clear &amp; sharp</span>
          <span className="ac-tip">👤 No glasses / hat</span>
        </div>
      )}

      {/* ── Drop zone ── */}
      {!isProcessing && !isDone && (
        <div
          className={`ac-dropzone ${dragOver ? 'ac-dropzone--active' : ''} ${photos.length ? 'ac-dropzone--compact' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          aria-label="Upload face photos"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => addFiles(e.target.files)}
          />
          {photos.length === 0 ? (
            <div className="ac-dropzone-inner">
              <div className="ac-upload-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="23" stroke="url(#ugr)" strokeWidth="1.5" strokeDasharray="4 3" />
                  <path d="M24 32V20M24 20l-5 5M24 20l5 5" stroke="url(#ugr)" strokeWidth="2" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="ugr" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#a855f7" />
                      <stop offset="1" stopColor="#7dd3fc" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <p className="ac-dropzone-label">
                Drag &amp; drop photos here, or <span className="ac-link">browse</span>
              </p>
              <p className="ac-dropzone-hint">JPG / PNG / WEBP — up to 10 photos</p>
            </div>
          ) : (
            <div className="ac-add-more">
              <span>+ Add more photos ({photos.length}/10)</span>
            </div>
          )}
        </div>
      )}

      {/* ── Photo grid ── */}
      {photos.length > 0 && !isProcessing && !isDone && (
        <div className="ac-photo-grid">
          {photos.map((p) => (
            <div key={p.id} className="ac-photo-card">
              <img src={p.previewUrl} alt="Face photo preview" className="ac-photo-img" />
              <button
                className="ac-photo-remove"
                onClick={(e) => { e.stopPropagation(); removePhoto(p.id); }}
                aria-label="Remove photo"
              >
                ✕
              </button>
              <div className="ac-photo-overlay" />
            </div>
          ))}
        </div>
      )}

      {/* ── Processing overlay ── */}
      {isProcessing && (
        <div className="ac-processing">
          <div className="ac-processing-orb">
            <div className="ac-orb-ring" />
            <div className="ac-orb-ring ac-orb-ring--2" />
            <div className="ac-orb-ring ac-orb-ring--3" />
            <div className="ac-orb-core" />
          </div>
          <p className="ac-processing-msg gradient-text">{progressMsg}</p>
          <p className="ac-processing-sub">This may take 10–30 seconds</p>
        </div>
      )}

      {/* ── Done ── */}
      {isDone && (
        <div className="ac-done">
          <div className="ac-done-icon">✓</div>
          <p className="gradient-text" style={{ fontWeight: 700 }}>Avatar Ready!</p>
        </div>
      )}

      {/* ── Error ── */}
      {stage === STAGES.ERROR && (
        <div className="ac-error">
          <p className="ac-error-title">⚠️ Generation Failed</p>
          <pre className="ac-error-detail">{errorMsg}</pre>
        </div>
      )}

      {/* ── Action buttons ── */}
      {!isProcessing && !isDone && (
        <div className="ac-actions">
          {photos.length > 0 && (
            <button
              id="generate-avatar-btn"
              className="ac-btn-primary"
              onClick={generateAvatar}
            >
              <span className="ac-btn-shine" />
              Generate My Avatar
            </button>
          )}
          {photos.length > 0 && (
            <button className="ac-btn-secondary" onClick={reset}>
              Clear Photos
            </button>
          )}
        </div>
      )}

      {stage === STAGES.ERROR && (
        <div className="ac-actions">
          <button className="ac-btn-secondary" onClick={reset}>Try Again</button>
        </div>
      )}

      {/* ── Backend note ── */}
      {stage === STAGES.IDLE && (
        <p className="ac-backend-note">
          Requires <code>aeterna-backend</code> server running on port 8000.
          Run <code>start.bat</code> in the <code>aeterna-backend</code> folder.
        </p>
      )}
    </div>
  );
};

export default AvatarCreator;
