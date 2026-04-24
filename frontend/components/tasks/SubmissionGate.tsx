'use client';

import { useState, useRef } from 'react';
import { Task, SubmissionType } from '@/types';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface SubmissionGateProps {
  task: Task;
  onClose: () => void;
  onSuccess: () => void;
}

type Tab = 'file' | 'url' | 'text';

const ALLOWED_TYPES = [
  'application/pdf',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp'
];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export function SubmissionGate({ task, onClose, onSuccess }: SubmissionGateProps) {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('file');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const urlValid = /^https?:\/\/.+/.test(url);
  const textValid = text.trim().length >= 20;
  const canSubmit = (tab === 'file' && !!file) || (tab === 'url' && urlValid) || (tab === 'text' && textValid);

  function handleFile(f: File) {
    if (!ALLOWED_TYPES.includes(f.type)) {
      toast('Only PDF, CSV, XLSX, DOCX allowed', 'error'); return;
    }
    if (f.size > MAX_SIZE) {
      toast('File must be under 10 MB', 'error'); return;
    }
    setFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      if (tab === 'file' && file) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('type', 'file');
        await api.post(`/tasks/${task.id}/submit`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else if (tab === 'url') {
        await api.post(`/tasks/${task.id}/submit`, { type: 'url', url });
      } else {
        await api.post(`/tasks/${task.id}/submit`, { type: 'text', text_content: text });
      }
      toast('Proof submitted!', 'success');
      onSuccess();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Submission failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel"
        style={{ width: '100%', maxWidth: '520px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--color-border-subtle)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Submit Proof of Work</h2>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
              {task.title}
            </p>
          </div>
          <button className="btn-ghost btn-icon" onClick={onClose} style={{ fontSize: '18px' }}>×</button>
        </div>

        {/* Tabs */}
        <div className="tabs" style={{ padding: '0 24px' }}>
          {(['file', 'url', 'text'] as Tab[]).map(t => (
            <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t === 'file' ? '📎 File Upload' : t === 'url' ? '🔗 URL' : '📝 Text'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px', flex: 1, overflow: 'auto' }}>
          {tab === 'file' && (
            <div>
              <div
                className={`drop-zone ${dragging ? 'dragging-over' : ''}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
              >
                <input
                  ref={fileRef}
                  type="file"
                  style={{ display: 'none' }}
                  accept=".pdf,.csv,.xlsx,.docx,.jpg,.jpeg,.png,.webp"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                {file ? (
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-completed)' }}>
                      ✓ {file.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                      {(file.size / 1024).toFixed(0)} KB
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📁</div>
                    <div style={{ fontSize: '13px', marginBottom: '4px' }}>Drag & drop or click to upload</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>PDF, CSV, XLSX, DOCX · max 10 MB</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'url' && (
            <div className="form-group">
              <label className="form-label">Link URL</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://drive.google.com/..."
                value={url}
                onChange={e => setUrl(e.target.value)}
                id="submission-url"
              />
              {url && !urlValid && (
                <span className="form-error">Please enter a valid URL starting with http:// or https://</span>
              )}
            </div>
          )}

          {tab === 'text' && (
            <div className="form-group">
              <label className="form-label">Description of Work</label>
              <textarea
                className="form-input"
                rows={6}
                placeholder="Describe the work completed (minimum 20 characters)…"
                value={text}
                onChange={e => setText(e.target.value)}
                id="submission-text"
                style={{ resize: 'vertical' }}
              />
              <span style={{ fontSize: '11px', color: textValid ? 'var(--color-completed)' : 'var(--color-text-muted)' }}>
                {text.trim().length} / 20 min characters
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--color-border-subtle)',
          display: 'flex', justifyContent: 'flex-end', gap: '10px',
        }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            id="submission-confirm"
            className="btn btn-primary"
            disabled={!canSubmit || loading}
            onClick={handleSubmit}
          >
            {loading ? 'Submitting…' : 'Confirm Submission'}
          </button>
        </div>
      </div>
    </div>
  );
}
