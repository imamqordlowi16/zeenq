import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Link,
  CheckCircle2,
  Bookmark,
  Plus,
  Trash2,
  ExternalLink,
  AlertCircle,
  HelpCircle,
  FolderOpen,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet
} from 'lucide-react';
import { parseSheetUrl, autoDetectSpreadsheet } from '../services/sheetsService';

export default function SheetConfigModal({
  isOpen,
  onClose,
  currentConfig,
  onSaveConfig,
  presets,
  onSavePreset,
  onDeletePreset,
  onSelectPreset
}) {
  const [urlInput, setUrlInput] = useState(currentConfig.url || '');
  const [gidInput, setGidInput] = useState(currentConfig.gid || '0');
  const [titleInput, setTitleInput] = useState(currentConfig.title || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [newPresetName, setNewPresetName] = useState('');
  const [showAddPreset, setShowAddPreset] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Auto-detection states
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedInfo, setDetectedInfo] = useState(null);
  const detectTimeoutRef = useRef(null);

  // Sync with currentConfig when modal opens
  useEffect(() => {
    if (isOpen) {
      setUrlInput(currentConfig.url || '');
      setGidInput(currentConfig.gid || '0');
      setTitleInput(currentConfig.title || '');
      setErrorMsg('');
      setSuccessMsg('');
      setDetectedInfo(null);
    }
  }, [isOpen, currentConfig]);

  if (!isOpen) return null;

  // Run auto-detection whenever URL changes
  const handleUrlChange = (e) => {
    const val = e.target.value;
    setUrlInput(val);
    setErrorMsg('');
    setSuccessMsg('');

    const parsed = parseSheetUrl(val);
    if (!parsed.isValid) {
      setDetectedInfo(null);
      return;
    }

    // Immediately update GID to the URL's GID or '0' (never keep old stale GID!)
    const currentGid = parsed.hasExplicitGid ? parsed.gid : '0';
    setGidInput(currentGid);

    // Clear previous debounce timeout
    if (detectTimeoutRef.current) {
      clearTimeout(detectTimeoutRef.current);
    }

    // Debounce auto-detection by 400ms
    setIsDetecting(true);
    detectTimeoutRef.current = setTimeout(async () => {
      try {
        const info = await autoDetectSpreadsheet(val);
        setDetectedInfo(info);
        if (info.title) {
          setTitleInput(info.title);
        }
        if (info.gid) {
          setGidInput(info.gid);
        }
      } catch (err) {
        console.warn('Auto-detect info warning:', err);
      } finally {
        setIsDetecting(false);
      }
    }, 450);
  };

  const handleApply = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const parsed = parseSheetUrl(urlInput);
    if (!parsed.isValid) {
      setErrorMsg(
        'Format URL tidak valid. Masukkan URL Google Spreadsheet lengkap (contoh: https://docs.google.com/spreadsheets/d/...)'
      );
      return;
    }

    // Automatically use detected values if available, or fallbacks
    const effectiveGid =
      gidInput.trim() ||
      detectedInfo?.gid ||
      (parsed.hasExplicitGid ? parsed.gid : '0');

    const effectiveTitle =
      titleInput.trim() ||
      detectedInfo?.title ||
      'Daftar Hadir Siswa';

    onSaveConfig({
      id: parsed.id,
      gid: effectiveGid,
      title: effectiveTitle,
      url: urlInput.trim()
    });

    setSuccessMsg('Link spreadsheet berhasil diterapkan dan langsung dibaca!');
    setTimeout(() => {
      onClose();
    }, 500);
  };

  const handleCreatePreset = (e) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const parsed = parseSheetUrl(urlInput);
    if (!parsed.isValid) {
      setErrorMsg('Masukkan URL spreadsheet yang valid sebelum menyimpan bookmark.');
      return;
    }

    onSavePreset({
      name: newPresetName.trim(),
      url: urlInput.trim(),
      sheetId: parsed.id,
      gid: gidInput.trim() || (parsed.hasExplicitGid ? parsed.gid : '0')
    });

    setNewPresetName('');
    setShowAddPreset(false);
  };

  const handleSelectTab = (tab) => {
    setGidInput(tab.gid);
    if (tab.name) {
      setTitleInput(`${detectedInfo?.title || 'Daftar Hadir'} - ${tab.name}`);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '18px',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--primary) 0%, #06b6d4 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Link size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Ganti Link Penugasan Guru</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Tempel link Google Sheet baru, sistem langsung membacanya secara otomatis
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        {/* Main Form */}
        <form onSubmit={handleApply}>
          <div style={{ marginBottom: '14px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.88rem',
                fontWeight: 700,
                marginBottom: '6px'
              }}
            >
              <span>Tempel (Paste) URL Google Spreadsheet di Sini:</span>
              {isDetecting && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 600
                  }}
                >
                  <RefreshCw size={13} className="spin-anim" />
                  Membaca data otomatis...
                </span>
              )}
            </label>

            <input
              type="text"
              className="input-control"
              style={{ fontSize: '0.92rem', padding: '11px 14px' }}
              placeholder="https://docs.google.com/spreadsheets/d/1AdM3.../edit"
              value={urlInput}
              onChange={handleUrlChange}
              autoFocus
              required
            />
            <span
              style={{
                fontSize: '0.74rem',
                color: 'var(--text-muted)',
                marginTop: '5px',
                display: 'block'
              }}
            >
              Cukup copy link spreadsheet dari browser dan paste di sini. Judul dan tab sheet otomatis terbaca!
            </span>

            <div
              style={{
                marginTop: '12px',
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                fontSize: '0.8rem'
              }}
            >
              <CheckCircle2 size={18} style={{ color: 'var(--accent-emerald)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: 'var(--accent-emerald)', display: 'block', marginBottom: '2px' }}>
                  ⚡ Mode Link Editor Langsung (Tanpa Login & Tanpa Ekstensi):
                </strong>
                <div style={{ color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                  Di Google Sheet Anda, klik tombol <b>Bagikan (Share)</b> di pojok kanan atas, lalu ubah akses umum menjadi <b>"Siapa saja yang memiliki link dapat mengedit (Editor)"</b>. ZeenQ langsung siap membaca dan menyimpan data secara otomatis!
                </div>
              </div>
            </div>
          </div>

          {/* Auto-Detection Success Card */}
          {detectedInfo && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'var(--status-hadir-bg)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                marginBottom: '16px',
                animation: 'modalFadeIn 0.2s ease'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--status-hadir)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  marginBottom: '4px'
                }}
              >
                <CheckCircle2 size={17} />
                <span>Spreadsheet Terbaca Otomatis dari Link!</span>
              </div>

              <div style={{ fontSize: '0.83rem', color: 'var(--text-primary)', marginTop: '4px' }}>
                <div>
                  <strong>Judul:</strong> {detectedInfo.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Sheet ID: <code>{detectedInfo.id.slice(0, 12)}...</code> | Tab GID Terpilih: <code>{gidInput}</code>
                </div>
              </div>

              {/* Multiple tabs chip selector if available */}
              {detectedInfo.availableTabs && detectedInfo.availableTabs.length > 1 && (
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Pilih Lembar Tab:
                  </span>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                    {detectedInfo.availableTabs.map((tab) => {
                      const isSelected = String(tab.gid) === String(gidInput);
                      return (
                        <button
                          key={tab.gid}
                          type="button"
                          className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                          onClick={() => handleSelectTab(tab)}
                        >
                          <FileSpreadsheet size={12} />
                          {tab.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Collapsible Advanced Settings (GID & Manual Label Override) */}
          <div style={{ marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                padding: '4px 0'
              }}
            >
              {showAdvanced ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              <span>Pengaturan Lanjutan (Ubah GID / Nama Kelas Manual)</span>
            </button>

            {showAdvanced && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'var(--bg-surface-subtle)',
                  border: '1px solid var(--border-color)',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px'
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>
                    Sheet GID (ID Tab):
                  </label>
                  <input
                    type="text"
                    className="input-control"
                    style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                    value={gidInput}
                    onChange={(e) => setGidInput(e.target.value)}
                  />
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    Otomatis diambil dari link
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>
                    Label / Nama Kelas:
                  </label>
                  <input
                    type="text"
                    className="input-control"
                    style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {errorMsg && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'var(--status-alpa-bg)',
                color: 'var(--status-alpa)',
                fontSize: '0.83rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '14px'
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'var(--status-hadir-bg)',
                color: 'var(--status-hadir)',
                fontSize: '0.83rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '14px'
              }}
            >
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '16px',
              marginBottom: '20px'
            }}
          >
            <a
              href={urlInput}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.8rem' }}
            >
              <ExternalLink size={14} />
              Buka di Google Docs
            </a>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Batal
              </button>
              <button type="submit" className="btn btn-primary" style={{ padding: '9px 20px' }}>
                <CheckCircle2 size={16} />
                <span>Terapkan & Muat Data</span>
              </button>
            </div>
          </div>
        </form>

        {/* Presets & Bookmarks Section */}
        <div
          style={{
            background: 'var(--bg-surface-subtle)',
            borderRadius: '12px',
            padding: '14px',
            border: '1px solid var(--border-color)'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bookmark size={16} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                Bookmark Penugasan / Kelas Lain
              </span>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowAddPreset(!showAddPreset)}
            >
              <Plus size={14} />
              {showAddPreset ? 'Tutup' : 'Simpan Link Ini'}
            </button>
          </div>

          {showAddPreset && (
            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '12px',
                animation: 'modalFadeIn 0.2s ease'
              }}
            >
              <input
                type="text"
                className="input-control"
                placeholder="Nama Penugasan (misal: Kelas 3A Semester 1)"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleCreatePreset}
              >
                Simpan
              </button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {presets.map((preset) => {
              const isActive =
                preset.sheetId === currentConfig.id && String(preset.gid) === String(currentConfig.gid);
              return (
                <div
                  key={preset.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: isActive ? 'var(--primary-light)' : 'var(--bg-surface-elevated)',
                    border: `1px solid ${isActive ? 'var(--primary)' : 'var(--border-color)'}`
                  }}
                >
                  <div style={{ cursor: 'pointer', flex: 1 }} onClick={() => onSelectPreset(preset)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{preset.name}</span>
                      {isActive && <span className="badge badge-hadir">Aktif</span>}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      ID: {preset.sheetId.slice(0, 8)}... | GID: {preset.gid}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onSelectPreset(preset)}
                      title="Pilih kelas ini"
                    >
                      Buka
                    </button>
                    {presets.length > 1 && (
                      <button
                        className="btn-icon"
                        style={{ padding: '6px', color: 'var(--accent-rose)' }}
                        onClick={() => onDeletePreset(preset.id)}
                        title="Hapus bookmark"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              marginTop: '12px',
              padding: '8px 10px',
              background: 'rgba(79, 70, 229, 0.06)',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              gap: '6px',
              alignItems: 'flex-start'
            }}
          >
            <HelpCircle size={14} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--primary)' }} />
            <span>
              <strong>Tips Guru:</strong> Pastikan izin sharing Google Sheet diset ke{' '}
              <em>"Siapa saja yang memiliki link dapat melihat (Viewer)"</em> agar sistem dapat langsung membaca data secara instan.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
