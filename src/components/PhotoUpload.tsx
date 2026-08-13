import { useRef, useState } from 'react';
import { fileToScaledDataUrl, ImageError } from '../lib/image';

interface Props {
  photo: string | null;
  onChange: (photo: string | null) => void;
}

export function PhotoUpload({ photo, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      onChange(await fileToScaledDataUrl(file));
    } catch (e) {
      setError(e instanceof ImageError ? e.message : 'Could not load that image.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="photo-upload">
      <div className="photo-preview" aria-live="polite">
        {photo ? (
          <img src={photo} alt="Your progress photo" />
        ) : (
          <span className="photo-placeholder">No photo</span>
        )}
      </div>

      <div className="photo-actions">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="visually-hidden"
          onChange={(e) => {
            void handleFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        <button type="button" className="btn btn-small" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? 'Loading…' : photo ? 'Change photo' : 'Upload photo'}
        </button>
        {photo && (
          <button type="button" className="btn btn-small btn-quiet" onClick={() => onChange(null)}>
            Remove
          </button>
        )}
        <p className="hint">Stored only in this browser. JPG, PNG or WebP up to 8 MB.</p>
        {error && <p className="field-error">{error}</p>}
      </div>
    </div>
  );
}
