import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Zap
} from 'lucide-react';
import {
  requestGoogleAccessToken,
  simulateDemoLogin
} from '../services/googleAuthService';
import confetti from 'canvas-confetti';

export default function GoogleAuthModal({
  isOpen,
  onClose,
  googleUser,
  onLoginSuccess,
  onLogout,
  onCleanUpperRows,
  isCleaning
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleLoginGoogle = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await requestGoogleAccessToken();
      onLoginSuccess(res.user, res.token);
      
      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      } catch {
        // ignore
      }

      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Gagal menghubungkan dengan Google. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    const res = simulateDemoLogin();
    onLoginSuccess(res.user, res.token);
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
    onClose();
  };

  const handleSaveClientId = (e) => {
    e.preventDefault();
    setStoredClientId(clientId);
    setErrorMessage('');
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'var(--bg-secondary)',
          borderRadius: '18px',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          animation: 'fadeIn 0.25s ease'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-tertiary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
              }}
            >
              {/* Google G Logo SVG */}
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                Integrasi Akun Google
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Sinkronisasi otomatis ke Google Spreadsheet di Google Drive
              </p>
            </div>
          </div>
          <button
            className="btn-icon"
            onClick={onClose}
            style={{ width: '32px', height: '32px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto' }}>
          {errorMessage && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'var(--status-alpa-bg)',
                borderLeft: '4px solid var(--accent-rose)',
                marginBottom: '18px',
                fontSize: '0.84rem',
                color: 'var(--accent-rose)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
              <div>{errorMessage}</div>
            </div>
          )}

          {googleUser ? (
            /* Sudah Terhubung */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)'
                }}
              >
                {googleUser.picture ? (
                  <img
                    src={googleUser.picture}
                    alt={googleUser.name}
                    style={{ width: '48px', height: '48px', borderRadius: '50%' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'var(--accent-indigo)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      fontWeight: 700
                    }}
                  >
                    {googleUser.name ? googleUser.name.charAt(0) : 'G'}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.98rem' }}>
                    {googleUser.name}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {googleUser.email}
                  </div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.74rem',
                      color: 'var(--accent-emerald)',
                      fontWeight: 700,
                      marginTop: '4px'
                    }}
                  >
                    <CheckCircle2 size={13} />
                    <span>Terhubung ke Google Drive</span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  fontSize: '0.84rem',
                  lineHeight: '1.5'
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '4px' }}>
                  ⚡ Sinkronisasi Cloud Aktif
                </div>
                Setiap kali Anda menambah bulan baru atau mengisi presensi di ZeenQ, perubahannya langsung dikirim ke file Google Spreadsheet Anda.
              </div>

              {onCleanUpperRows && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'var(--bg-surface-subtle)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    🛠️ <strong>Pembersihan Format</strong>: Jika baris 1 s/d 40 di Google Sheet Anda rusak karena pengujian awal, klik tombol ini untuk menghapusnya secara otomatis. Template resmi sekolah akan langsung naik ke baris paling atas.
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={onCleanUpperRows}
                    disabled={isCleaning}
                    style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <RefreshCw size={13} className={isCleaning ? 'spin-anim' : ''} />
                    <span>{isCleaning ? 'Sedang Membersihkan...' : '🧹 Bersihkan Tabel Rusak (Baris 1-40)'}</span>
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={onLogout}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <LogOut size={16} />
                  <span>Putuskan Sambungan</span>
                </button>
                <button className="btn btn-primary" onClick={onClose} style={{ flex: 1 }}>
                  Tutup
                </button>
              </div>
            </div>
          ) : (
            /* Belum Terhubung */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px' }}>
                  Simpan Presensi Otomatis ke Google Sheets
                </h4>
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.5',
                    maxWidth: '400px',
                    margin: '0 auto'
                  }}
                >
                  Cukup hubungkan akun Google Anda satu kali. Guru lain tidak perlu mengatur ekstensi atau script apa pun.
                </p>
              </div>

              {/* Main Login Button */}
              <button
                className="btn btn-primary"
                onClick={handleLoginGoogle}
                disabled={isLoading}
                style={{
                  padding: '13px 20px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  borderRadius: '12px'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    fill="#fff"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#fff"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#fff"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#fff"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isLoading ? 'Menghubungkan...' : 'Hubungkan Akun Google'}</span>
              </button>

              {/* Demo Mode Button for Instant Testing */}
              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}
                >
                  <Zap size={14} style={{ color: 'var(--accent-amber)' }} />
                  <span>Coba Langsung (Mode Demo Cloud)</span>
                </button>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Langsung coba fitur sinkronisasi tanpa konfigurasi Google Console
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
