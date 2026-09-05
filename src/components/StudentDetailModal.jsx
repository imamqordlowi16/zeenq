import React from 'react';
import { X, User, HeartPulse, Mail, UserX, CheckCircle, Share2, Calendar } from 'lucide-react';

export default function StudentDetailModal({ student, monthName, signatures, onClose }) {
  if (!student) return null;

  const handleSharePersonalWA = () => {
    let text = `Salam Bapak/Ibu Wali Murid dari *${student.name}*,\n\n`;
    text += `Berikut ini rekapitulasi kehadiran ananda untuk periode *Bulan ${monthName} 2026*:\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `✅ Masuk / Hadir: *${student.hadir} hari*\n`;
    text += `🤒 Sakit (S): *${student.sakit} hari*\n`;
    text += `📩 Izin (I): *${student.izin} hari*\n`;
    text += `❌ Alpa (A): *${student.alpa} hari*\n`;
    text += `📈 Persentase Kehadiran: *${student.attendanceRate}%*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `Terima kasih atas perhatian dan kerjasama Bapak/Ibu.\n\n`;
    text += `Hormat kami,\n`;
    text += `Wali Kelas: *${signatures?.guruKelas || 'Guru Kelas'}*`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
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
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800
              }}
            >
              {student.no}
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{student.name}</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Buku Presensi — Periode {monthName}
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        {/* Attendance Rate Pill & Highlights */}
        <div
          style={{
            background: 'var(--bg-surface-subtle)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '18px',
            textAlign: 'center',
            border: '1px solid var(--border-color)'
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Tingkat Kehadiran Siswa
          </div>
          <div
            style={{
              fontSize: '2.4rem',
              fontWeight: 800,
              color:
                student.attendanceRate >= 95
                  ? 'var(--status-hadir)'
                  : student.attendanceRate >= 80
                  ? 'var(--status-izin)'
                  : 'var(--status-alpa)'
            }}
          >
            {student.attendanceRate}%
          </div>
          <span
            className={`badge ${
              student.attendanceRate >= 95
                ? 'badge-hadir'
                : student.attendanceRate >= 80
                ? 'badge-izin'
                : 'badge-alpa'
            }`}
          >
            {student.attendanceRate >= 95
              ? 'Sangat Baik'
              : student.attendanceRate >= 80
              ? 'Cukup Baik'
              : 'Perlu Perhatian'}
          </span>
        </div>

        {/* Mini 4-column Stat Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            marginBottom: '18px'
          }}
        >
          <div
            style={{
              padding: '10px 6px',
              borderRadius: '8px',
              background: 'var(--status-hadir-bg)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--status-hadir)' }}>
              {student.hadir}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Hadir</div>
          </div>

          <div
            style={{
              padding: '10px 6px',
              borderRadius: '8px',
              background: 'var(--status-sakit-bg)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--status-sakit)' }}>
              {student.sakit}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Sakit</div>
          </div>

          <div
            style={{
              padding: '10px 6px',
              borderRadius: '8px',
              background: 'var(--status-izin-bg)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--status-izin)' }}>
              {student.izin}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Izin</div>
          </div>

          <div
            style={{
              padding: '10px 6px',
              borderRadius: '8px',
              background: 'var(--status-alpa-bg)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--status-alpa)' }}>
              {student.alpa}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Alpa</div>
          </div>
        </div>

        {/* Daily Marks Log */}
        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Calendar size={14} />
            Riwayat Presensi Harian (Tgl 1 - 31):
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '4px'
            }}
          >
            {Object.keys(student.days).map((day) => {
              const mark = student.days[day];
              let bg = 'var(--bg-surface-subtle)';
              let color = 'var(--text-muted)';
              if (mark === '.') {
                bg = 'var(--status-hadir-bg)';
                color = 'var(--status-hadir)';
              } else if (mark === 'S') {
                bg = 'var(--status-sakit-bg)';
                color = 'var(--status-sakit)';
              } else if (mark === 'I') {
                bg = 'var(--status-izin-bg)';
                color = 'var(--status-izin)';
              } else if (mark === 'A') {
                bg = 'var(--status-alpa-bg)';
                color = 'var(--status-alpa)';
              }

              return (
                <div
                  key={day}
                  style={{
                    padding: '6px 2px',
                    borderRadius: '6px',
                    background: bg,
                    color: color,
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                  title={`Tanggal ${day}: ${mark || 'Tidak Ada Data'}`}
                >
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{day}</div>
                  <div>{mark || '-'}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Tutup
          </button>
          <button className="btn btn-success" onClick={handleSharePersonalWA}>
            <Share2 size={16} />
            <span>Kirim WA ke Wali Murid</span>
          </button>
        </div>
      </div>
    </div>
  );
}
