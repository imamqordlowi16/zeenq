import React from 'react';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  UserX,
  HeartPulse,
  Mail,
  TrendingUp,
  Share2,
  Calendar,
  Award,
  ChevronRight,
  Printer,
  Sparkles
} from 'lucide-react';
import { generateWhatsAppReport } from '../utils/exportUtils';

export default function DashboardView({
  attendanceData,
  selectedMonth,
  setSelectedMonth,
  onOpenPrint,
  onSelectStudent,
  onOpenQuickText
}) {
  const currentMonth =
    attendanceData?.months?.find((m) => m.id === selectedMonth) ||
    attendanceData?.months?.[0];

  if (!currentMonth) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Sedang menyiapkan data dashboard...</p>
      </div>
    );
  }

  const { students, stats, dailySummary, dayNumbers, signatures } = currentMonth;

  // Find students with highest absence
  const absentWatchlist = [...students]
    .map((s) => ({
      ...s,
      totalAbsent: (s.sakit || 0) + (s.izin || 0) + (s.alpa || 0)
    }))
    .filter((s) => s.totalAbsent > 0)
    .sort((a, b) => b.totalAbsent - a.totalAbsent)
    .slice(0, 6);

  // Perfect attendance students
  const perfectStudents = students.filter(
    (s) => (s.sakit || 0) + (s.izin || 0) + (s.alpa || 0) === 0 && (s.hadir || 0) > 0
  );

  // Handle share WhatsApp
  const handleShareWhatsApp = () => {
    const message = generateWhatsAppReport(currentMonth);
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div>
      {/* Dashboard Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '20px'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Ringkasan Kehadiran Kelas</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Pantau statistik harian dan bulanan siswa secara real-time dari penugasan guru
          </p>
        </div>

        {/* Month Selector & Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={16} style={{ color: 'var(--primary)' }} />
            <select
              className="input-control"
              style={{ width: 'auto', fontWeight: 700, padding: '7px 12px' }}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {attendanceData.months.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-primary btn-sm"
            onClick={onOpenQuickText}
            title="Ketik catatan seperti 'Abi Alpa, Afifah ijin, Ahmad Sakit' dan selainnya otomatis Hadir"
          >
            <Sparkles size={15} />
            <span>Input Teks Cepat</span>
          </button>

          <button className="btn btn-success btn-sm" onClick={handleShareWhatsApp}>
            <Share2 size={15} />
            <span>Kirim Rekap WA</span>
          </button>

          <button className="btn btn-secondary btn-sm" onClick={onOpenPrint}>
            <Printer size={15} />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Stat Widgets */}
      <div className="stats-grid">
        {/* Total Students */}
        <div className="glass-panel stat-card primary">
          <div
            className="stat-icon-wrapper"
            style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}
          >
            <Users size={26} />
          </div>
          <div>
            <div className="stat-val">{students.length}</div>
            <div className="stat-label">Total Peserta Didik</div>
          </div>
        </div>

        {/* Kehadiran Rata-rata */}
        <div className="glass-panel stat-card emerald">
          <div
            className="stat-icon-wrapper"
            style={{ background: 'var(--status-hadir-bg)', color: 'var(--status-hadir)' }}
          >
            <TrendingUp size={26} />
          </div>
          <div>
            <div className="stat-val">{stats.effectiveAttendanceRate}</div>
            <div className="stat-label">Tingkat Kehadiran</div>
          </div>
        </div>

        {/* Sakit */}
        <div className="glass-panel stat-card sky">
          <div
            className="stat-icon-wrapper"
            style={{ background: 'var(--status-sakit-bg)', color: 'var(--status-sakit)' }}
          >
            <HeartPulse size={26} />
          </div>
          <div>
            <div className="stat-val">{stats.totalSakit}</div>
            <div className="stat-label">Total Sakit (S)</div>
          </div>
        </div>

        {/* Izin */}
        <div className="glass-panel stat-card amber">
          <div
            className="stat-icon-wrapper"
            style={{ background: 'var(--status-izin-bg)', color: 'var(--status-izin)' }}
          >
            <Mail size={26} />
          </div>
          <div>
            <div className="stat-val">{stats.totalIzin}</div>
            <div className="stat-label">Total Izin (I)</div>
          </div>
        </div>

        {/* Alpa */}
        <div className="glass-panel stat-card rose">
          <div
            className="stat-icon-wrapper"
            style={{ background: 'var(--status-alpa-bg)', color: 'var(--status-alpa)' }}
          >
            <UserX size={26} />
          </div>
          <div>
            <div className="stat-val">{stats.totalAlpa}</div>
            <div className="stat-label">Tanpa Keterangan (A)</div>
          </div>
        </div>
      </div>

      {/* Analytics Rows */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px',
          marginBottom: '24px'
        }}
      >
        {/* Daily Attendance Trend Visualizer */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}
          >
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
                Aktivitas Kehadiran Harian ({currentMonth.name})
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Distribusi siswa yang masuk pada tanggal 1 s/d 31
              </p>
            </div>
            <span className="badge badge-hadir">Hadir</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '4px',
              height: '140px',
              paddingTop: '20px',
              overflowX: 'auto'
            }}
          >
            {dayNumbers.map((d) => {
              const summary = dailySummary[d] || { hadir: 0, sakit: 0, izin: 0, alpa: 0 };
              const totalActive = summary.totalActive || 0;
              const heightPercent =
                students.length > 0 ? Math.round((summary.hadir / students.length) * 100) : 0;
              const hasActivity = totalActive > 0;

              return (
                <div
                  key={d}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    flex: '1 0 16px',
                    minWidth: '16px'
                  }}
                  title={`Tgl ${d}: ${summary.hadir} Hadir, ${summary.sakit} S, ${summary.izin} I, ${summary.alpa} A`}
                >
                  <div
                    style={{
                      width: '100%',
                      height: `${Math.max(6, (heightPercent / 100) * 95)}px`,
                      background: hasActivity
                        ? 'linear-gradient(180deg, var(--accent-emerald) 0%, #059669 100%)'
                        : 'var(--border-color)',
                      borderRadius: '3px 3px 0 0',
                      transition: 'height 0.3s ease',
                      opacity: hasActivity ? 1 : 0.4
                    }}
                  />
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{d}</span>
                </div>
              );
            })}
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '12px',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '10px'
            }}
          >
            <span>Tanggal 1</span>
            <span>Tanggal 15</span>
            <span>Tanggal 31</span>
          </div>
        </div>

        {/* Watchlist: Students requiring attention */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} style={{ color: 'var(--accent-amber)' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Perhatian Wali Kelas</h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {absentWatchlist.length} Siswa Terbanyak Absen
            </span>
          </div>

          {absentWatchlist.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={32} style={{ color: 'var(--accent-emerald)', margin: '0 auto 8px' }} />
              <p>Hebat! Belum ada siswa yang absen pada bulan ini.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {absentWatchlist.map((s) => (
                <div
                  key={s.name}
                  onClick={() => onSelectStudent && onSelectStudent(s)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-surface-subtle)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: 'var(--primary-light)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                    >
                      {s.no}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{s.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Kehadiran: {s.attendanceRate}%
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {s.sakit > 0 && <span className="badge badge-sakit">S: {s.sakit}</span>}
                    {s.izin > 0 && <span className="badge badge-izin">I: {s.izin}</span>}
                    {s.alpa > 0 && <span className="badge badge-alpa">A: {s.alpa}</span>}
                    <ChevronRight size={15} style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Perfect Attendance Recognition */}
      {perfectStudents.length > 0 && (
        <div
          className="glass-panel"
          style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)',
            borderColor: 'rgba(16, 185, 129, 0.3)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Award size={20} style={{ color: 'var(--accent-emerald)' }} />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>
              Penghargaan Kehadiran Penuh 100% ({perfectStudents.length} Siswa)
            </h4>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {perfectStudents.map((s) => (
              <span
                key={s.name}
                onClick={() => onSelectStudent && onSelectStudent(s)}
                style={{
                  cursor: 'pointer',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>⭐ {s.name}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
