import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  PlusCircle,
  Users,
  CheckCircle2,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

const STANDARD_MONTHS = [
  { name: 'JANUARI', defaultDays: 31 },
  { name: 'FEBRUARI', defaultDays: 28 },
  { name: 'MARET', defaultDays: 31 },
  { name: 'APRIL', defaultDays: 30 },
  { name: 'MEI', defaultDays: 31 },
  { name: 'JUNI', defaultDays: 30 },
  { name: 'JULI', defaultDays: 31 },
  { name: 'AGUSTUS', defaultDays: 31 },
  { name: 'SEPTEMBER', defaultDays: 30 },
  { name: 'OKTOBER', defaultDays: 31 },
  { name: 'NOVEMBER', defaultDays: 30 },
  { name: 'DESEMBER', defaultDays: 31 }
];

export default function AddMonthModal({
  isOpen,
  onClose,
  existingMonths = [],
  studentCount = 0,
  onAddMonth
}) {
  const currentYear = new Date().getFullYear();
  const existingNames = existingMonths.map((m) => m.name.toUpperCase());

  const [mode, setMode] = useState('standard'); // 'standard' or 'custom'
  const [selectedMonthName, setSelectedMonthName] = useState('OKTOBER');
  const [customNameInput, setCustomNameInput] = useState('');
  const [yearInput, setYearInput] = useState(currentYear);
  const [totalDays, setTotalDays] = useState(31);
  const [initialAttendance, setInitialAttendance] = useState('empty'); // 'empty' or 'hadir'
  const [errorMsg, setErrorMsg] = useState('');

  // Always reset properly when modal opens
  useEffect(() => {
    if (isOpen) {
      const firstAvailable =
        STANDARD_MONTHS.find((m) => !existingNames.includes(m.name)) || STANDARD_MONTHS[0];
      setMode('standard');
      setSelectedMonthName(firstAvailable.name);
      setTotalDays(firstAvailable.defaultDays);
      setCustomNameInput('');
      setYearInput(new Date().getFullYear());
      setInitialAttendance('empty');
      setErrorMsg('');
    }
  }, [isOpen, existingMonths]);

  if (!isOpen) return null;

  const handleSelectStandardMonth = (month) => {
    setErrorMsg('');
    setSelectedMonthName(month.name);
    setTotalDays(month.defaultDays);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const effectiveName =
      mode === 'custom' ? customNameInput.trim().toUpperCase() : selectedMonthName;

    if (!effectiveName) {
      setErrorMsg('Nama bulan atau kegiatan tidak boleh kosong.');
      return;
    }

    if (totalDays < 1 || totalDays > 31) {
      setErrorMsg('Jumlah hari harus antara 1 sampai 31 hari.');
      return;
    }

    // Celebration confetti
    confetti({
      particleCount: 90,
      spread: 60,
      origin: { y: 0.6 }
    });

    onAddMonth({
      name: effectiveName,
      totalDays: parseInt(totalDays, 10),
      year: yearInput,
      initialAttendance
    });

    onClose();
  };

  const effectiveDisplayName =
    mode === 'custom'
      ? customNameInput.trim().toUpperCase() || 'BULAN BARU'
      : selectedMonthName;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '540px',
          background: 'var(--bg-surface-elevated)',
          color: 'var(--text-primary)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface-subtle)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Calendar size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Tambah Bulan Presensi Baru
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                Tambahkan lembar absensi baru ke dalam daftar bulan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{ width: '32px', height: '32px' }}
            aria-label="Tutup modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
          {errorMsg && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid var(--status-alpa)',
                borderRadius: '8px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--status-alpa)',
                fontSize: '0.85rem',
                marginBottom: '16px'
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Type Toggle Tabs */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-surface-subtle)',
              padding: '4px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              marginBottom: '16px',
              gap: '4px'
            }}
          >
            <button
              type="button"
              onClick={() => setMode('standard')}
              className={`btn btn-sm ${mode === 'standard' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '7px', fontSize: '0.82rem', borderRadius: '8px' }}
            >
              <Calendar size={14} />
              <span>Bulan Kalender (12 Bulan)</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('custom')}
              className={`btn btn-sm ${mode === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '7px', fontSize: '0.82rem', borderRadius: '8px' }}
            >
              <span>✍️ Nama Kustom / Kegiatan</span>
            </button>
          </div>

          {/* Standard Months Grid */}
          {mode === 'standard' ? (
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  marginBottom: '8px',
                  color: 'var(--text-primary)'
                }}
              >
                Pilih Bulan yang Ingin Ditambahkan:
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px'
                }}
              >
                {STANDARD_MONTHS.map((m) => {
                  const isSelected = selectedMonthName === m.name;
                  const alreadyExists = existingNames.includes(m.name);
                  return (
                    <button
                      key={m.name}
                      type="button"
                      onClick={() => handleSelectStandardMonth(m)}
                      className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                      style={{
                        padding: '8px 4px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        position: 'relative',
                        boxShadow: isSelected ? '0 4px 12px var(--primary-glow)' : 'none'
                      }}
                    >
                      {m.name}
                      {alreadyExists && (
                        <span
                          title="Bulan ini sudah ada di daftar"
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: isSelected ? '#ffffff' : 'var(--accent-amber)',
                            position: 'absolute',
                            top: '4px',
                            right: '4px'
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Custom Month / Period Name */
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  marginBottom: '6px',
                  color: 'var(--text-primary)'
                }}
              >
                Ketik Nama Periode / Kegiatan Khusus:
              </label>
              <input
                type="text"
                placeholder="Contoh: PESANTREN KILAT, MATRIKULASI, UJIAN AKHIR"
                value={customNameInput}
                onChange={(e) => setCustomNameInput(e.target.value)}
                autoFocus
                className="input-field"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-surface-subtle)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }}
              />
            </div>
          )}

          {/* Days count & Year Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  marginBottom: '6px',
                  color: 'var(--text-primary)'
                }}
              >
                Jumlah Hari (Tanggal):
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[28, 29, 30, 31].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setTotalDays(d)}
                    className={`btn btn-sm ${totalDays === d ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '8px 2px', fontSize: '0.82rem', fontWeight: 700 }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  marginBottom: '6px',
                  color: 'var(--text-primary)'
                }}
              >
                Tahun Ajaran:
              </label>
              <input
                type="number"
                value={yearInput}
                onChange={(e) => setYearInput(parseInt(e.target.value, 10) || currentYear)}
                className="input-field"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-surface-subtle)',
                  color: 'var(--text-primary)',
                  fontWeight: 600
                }}
              />
            </div>
          </div>

          {/* Initial Attendance State */}
          <div style={{ marginBottom: '18px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 700,
                marginBottom: '8px',
                color: 'var(--text-primary)'
              }}
            >
              Status Pengisian Awal:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border:
                    initialAttendance === 'empty'
                      ? '1px solid var(--primary)'
                      : '1px solid var(--border-color)',
                  background:
                    initialAttendance === 'empty' ? 'var(--primary-light)' : 'var(--bg-surface-subtle)',
                  cursor: 'pointer',
                  fontSize: '0.84rem'
                }}
              >
                <input
                  type="radio"
                  name="initialAttendance"
                  value="empty"
                  checked={initialAttendance === 'empty'}
                  onChange={() => setInitialAttendance('empty')}
                />
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Kosongkan Tanggal</strong>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>
                    Siap diisi harian atau via tombol 'Input Teks Cepat'
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border:
                    initialAttendance === 'hadir'
                      ? '1px solid var(--primary)'
                      : '1px solid var(--border-color)',
                  background:
                    initialAttendance === 'hadir' ? 'var(--primary-light)' : 'var(--bg-surface-subtle)',
                  cursor: 'pointer',
                  fontSize: '0.84rem'
                }}
              >
                <input
                  type="radio"
                  name="initialAttendance"
                  value="hadir"
                  checked={initialAttendance === 'hadir'}
                  onChange={() => setInitialAttendance('hadir')}
                />
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Otomatis Hadir Penuh (.)</strong>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>
                    Semua {totalDays} hari terisi tanda titik hadhir (bisa diedit)
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Student Roster Sync Notice with HIGH CONTRAST */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'var(--accent-emerald-light)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={16} style={{ color: 'var(--status-hadir)' }} />
              <span style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                <strong>{studentCount} Siswa</strong> otomatis disalin ke lembar{' '}
                <span
                  style={{
                    background: 'var(--primary)',
                    color: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    marginLeft: '4px'
                  }}
                >
                  {effectiveDisplayName}
                </span>
              </span>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Tgl 1 s/d {totalDays}
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Batal
            </button>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PlusCircle size={16} />
              <span>Tambah Bulan Ini</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
