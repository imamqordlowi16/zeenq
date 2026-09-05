import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  Calendar,
  AlertCircle,
  HelpCircle,
  Check,
  UserCheck,
  Send
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { parseAttendanceText } from '../utils/textAttendanceParser';


export default function QuickTextInputModal({
  isOpen,
  onClose,
  currentMonth,
  onApplyAttendance
}) {
  const todayDate = new Date().getDate();
  const [selectedDay, setSelectedDay] = useState(
    todayDate >= 1 && todayDate <= 31 ? todayDate : 1
  );

  // Default sample template exactly as requested by user
  const [inputText, setInputText] = useState(
    'Abi Alpa\nAfifah ijin\nAhmad Sakit'
  );

  const students = currentMonth?.students || [];

  // Parse live on text change
  const parseResult = useMemo(() => {
    return parseAttendanceText(inputText, students);
  }, [inputText, students]);

  if (!isOpen || !currentMonth) return null;

  const countHadir = parseResult.fullRosterResult.filter((s) => s.mark === '.').length;
  const countSakit = parseResult.fullRosterResult.filter((s) => s.mark === 'S').length;
  const countIzin = parseResult.fullRosterResult.filter((s) => s.mark === 'I').length;
  const countAlpa = parseResult.fullRosterResult.filter((s) => s.mark === 'A').length;

  const handleApply = () => {
    if (onApplyAttendance) {
      // Apply the attendance marks for the selected day to all students
      parseResult.fullRosterResult.forEach((s) => {
        onApplyAttendance(currentMonth.id, s.no, selectedDay, s.mark);
      });
    }

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    onClose();
  };

  const handleClear = () => {
    setInputText('');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '680px', width: '95vw' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
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
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                Input Presensi Cepat Lewat Teks
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Ketik / tempel daftar siswa yang absen, siswa lainnya otomatis terisi Hadir (•)
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        {/* Date Selection Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
            padding: '10px 14px',
            background: 'var(--bg-surface-subtle)',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={16} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
              Untuk Tanggal:
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              className="input-control"
              style={{ width: 'auto', fontWeight: 700, padding: '5px 10px' }}
              value={selectedDay}
              onChange={(e) => setSelectedDay(Number(e.target.value))}
            >
              {currentMonth.dayNumbers?.map((d) => (
                <option key={d} value={d}>
                  Tanggal {d} {currentMonth.name}
                </option>
              ))}
            </select>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              ({currentMonth.name} 2026)
            </span>
          </div>
        </div>

        {/* Text Input Box */}
        <div style={{ marginBottom: '14px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '6px'
            }}
          >
            <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>
              Ketik / Paste Catatan Ketidakhadiran:
            </label>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '2px 8px' }}
              onClick={handleClear}
            >
              Bersihkan
            </button>
          </div>

          <textarea
            className="input-control"
            style={{
              height: '110px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.9rem',
              lineHeight: '1.6',
              resize: 'vertical'
            }}
            placeholder={'Contoh format:\nAbi Alpa\nAfifah ijin\nAhmad Sakit'}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '6px',
              fontSize: '0.75rem',
              color: 'var(--text-muted)'
            }}
          >
            <HelpCircle size={13} style={{ color: 'var(--primary)' }} />
            <span>
              Format fleksibel: bisa tulis <em>"Abi Alpa"</em>, <em>"Afifah izin"</em>, atau <em>"Ahmad Sakit"</em>. Sistem otomatis mencocokkan nama siswa.
            </span>
          </div>
        </div>

        {/* Live Parse Summary Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            marginBottom: '16px'
          }}
        >
          <div
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: 'var(--status-hadir-bg)',
              textAlign: 'center',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}
          >
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--status-hadir)' }}>
              {countHadir} Siswa
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Hadir (•)</div>
          </div>

          <div
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: 'var(--status-sakit-bg)',
              textAlign: 'center',
              border: '1px solid rgba(2, 132, 199, 0.3)'
            }}
          >
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--status-sakit)' }}>
              {countSakit} Siswa
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Sakit (S)</div>
          </div>

          <div
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: 'var(--status-izin-bg)',
              textAlign: 'center',
              border: '1px solid rgba(245, 158, 11, 0.3)'
            }}
          >
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--status-izin)' }}>
              {countIzin} Siswa
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Izin (I)</div>
          </div>

          <div
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: 'var(--status-alpa-bg)',
              textAlign: 'center',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}
          >
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--status-alpa)' }}>
              {countAlpa} Siswa
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Alpa (A)</div>
          </div>
        </div>

        {/* Warning if any line could not be parsed */}
        {parseResult.unmatchedLines.length > 0 && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'var(--status-izin-bg)',
              color: 'var(--status-izin)',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '14px'
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <div>
              {parseResult.unmatchedLines.map((u, i) => (
                <div key={i}>
                  Baris <strong>"{u.line}"</strong>: {u.reason}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Preview List */}
        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>Pratinjau Hasil untuk Tanggal {selectedDay}:</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--status-hadir)', fontWeight: 600 }}>
              ✓ Selain yang ditulis otomatis Hadir
            </span>
          </div>

          <div
            style={{
              maxHeight: '180px',
              overflowY: 'auto',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              background: 'var(--bg-surface-elevated)'
            }}
          >
            {parseResult.fullRosterResult.map((s) => (
              <div
                key={s.no}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 12px',
                  borderBottom: '1px solid var(--border-color)',
                  background: s.isCustomMarked
                    ? s.mark === 'S'
                      ? 'var(--status-sakit-bg)'
                      : s.mark === 'I'
                      ? 'var(--status-izin-bg)'
                      : 'var(--status-alpa-bg)'
                    : 'transparent',
                  fontSize: '0.82rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '22px',
                      color: 'var(--text-muted)',
                      fontSize: '0.75rem',
                      textAlign: 'center'
                    }}
                  >
                    {s.no}.
                  </span>
                  <span style={{ fontWeight: s.isCustomMarked ? 700 : 500 }}>{s.name}</span>
                </div>

                <div>
                  {s.mark === '.' && <span className="badge badge-hadir">Hadir (•)</span>}
                  {s.mark === 'S' && <span className="badge badge-sakit">Sakit (S)</span>}
                  {s.mark === 'I' && <span className="badge badge-izin">Izin (I)</span>}
                  {s.mark === 'A' && <span className="badge badge-alpa">Alpa (A)</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '16px'
          }}
        >
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Batal
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleApply}
            style={{ padding: '9px 20px' }}
          >
            <Check size={16} />
            <span>Terapkan Presensi Tanggal {selectedDay}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
