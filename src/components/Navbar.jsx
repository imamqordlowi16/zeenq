import React from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  FileSpreadsheet,
  Users,
  Settings,
  RefreshCw,
  Sun,
  Moon,
  ExternalLink,
  ShieldCheck,
  Printer,
  CheckCircle2,
  Zap
} from 'lucide-react';

export default function Navbar({
  currentView,
  setCurrentView,
  sheetConfig,
  isRefreshing,
  onRefresh,
  onOpenConfig,
  onOpenPrint,
  googleUser,
  onOpenGoogleAuth,
  isDarkMode,
  onToggleTheme,
  isFromCache
}) {
  return (
    <header className="navbar-wrapper no-print">
      <div className="navbar-inner">
        {/* Brand & Class Info */}
        <div className="nav-brand">
          <div className="brand-icon">Z</div>
          <div className="brand-meta">
            <h1>ZeenQ EduPresence</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span className="badge badge-primary">
                {sheetConfig.title || 'Daftar Hadir Siswa'}
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: isFromCache ? 'var(--accent-amber)' : 'var(--accent-emerald)',
                  fontWeight: 600
                }}
              >
                <span
                  className="live-pulse"
                  style={{
                    background: isFromCache ? 'var(--accent-amber)' : 'var(--accent-emerald)'
                  }}
                />
                {isFromCache ? 'Cache Offline' : 'Live Google Sheet'}
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Nav Tabs */}
        <nav className="nav-tabs" aria-label="Navigasi Utama">
          <button
            className={`nav-tab-item ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            <LayoutDashboard size={16} />
            Dashboard
          </button>
          <button
            className={`nav-tab-item ${currentView === 'attendance' ? 'active' : ''}`}
            onClick={() => setCurrentView('attendance')}
          >
            <CalendarCheck size={16} />
            Presensi Harian
          </button>
          <button
            className={`nav-tab-item ${currentView === 'rekap' ? 'active' : ''}`}
            onClick={() => setCurrentView('rekap')}
          >
            <FileSpreadsheet size={16} />
            Rekap Semester
          </button>
          <button
            className={`nav-tab-item ${currentView === 'mutasi' ? 'active' : ''}`}
            onClick={() => setCurrentView('mutasi')}
          >
            <Users size={16} />
            Data Siswa
          </button>
        </nav>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onOpenPrint}
            title="Cetak format laporan resmi"
          >
            <Printer size={15} />
            <span className="hide-mobile">Cetak</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Sinkronisasi ulang data Google Sheet"
          >
            <RefreshCw size={15} className={isRefreshing ? 'spin-anim' : ''} />
            <span className="hide-mobile">{isRefreshing ? 'Memuat...' : 'Sync'}</span>
          </button>

          <button
            className={`btn btn-sm ${googleUser ? 'btn-success' : 'btn-primary'}`}
            onClick={onOpenGoogleAuth}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            title={
              googleUser
                ? `Akun Google Terhubung: ${googleUser.email || googleUser.name}`
                : 'Klik untuk Hubungkan Akun Google & Izinkan Akses Drive'
            }
          >
            {googleUser?.picture ? (
              <img
                src={googleUser.picture}
                alt={googleUser.name}
                style={{ width: '18px', height: '18px', borderRadius: '50%' }}
              />
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24">
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
            )}
            <span className="hide-mobile">
              {googleUser ? 'Google Aktif' : 'Hubungkan Google'}
            </span>
          </button>

          <div
            className="badge badge-success hide-mobile"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 700,
              borderRadius: '20px'
            }}
            title="Semua perubahan presensi dan tambah bulan otomatis tersimpan langsung secara real-time"
          >
            <CheckCircle2 size={14} />
            <span>Tersimpan Otomatis</span>
          </div>

          <button
            className="btn btn-primary btn-sm"
            onClick={onOpenConfig}
            title="Atur link Google Spreadsheet penugasan guru"
          >
            <Settings size={15} />
            <span className="hide-mobile">Ganti Link</span>
          </button>

          <button
            className="btn-icon"
            onClick={onToggleTheme}
            aria-label="Ganti mode tema"
            title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
          >
            {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </div>
    </header>
  );
}
