import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  Check,
  RotateCcw,
  Sparkles,
  Info,
  Calendar,
  Share2,
  Plus,
  Trash2,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { exportToCSV, generateWhatsAppReport } from '../utils/exportUtils';
import AddMonthModal from './AddMonthModal';

export default function AttendanceView({
  attendanceData,
  selectedMonth,
  setSelectedMonth,
  onSelectStudent,
  onUpdateAttendance,
  onOpenQuickText,
  onAddMonth,
  onDeleteMonth,
  onExportExcel,
  onFixSemester2
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ABSENT_ONLY, PERFECT_ONLY
  const [activeDayFilter, setActiveDayFilter] = useState(null);
  const [isAddMonthOpen, setIsAddMonthOpen] = useState(false);

  const currentMonth =
    attendanceData?.months?.find((m) => m.id === selectedMonth) ||
    attendanceData?.months?.[0];

  if (!currentMonth) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Sedang memuat data absensi...</p>
      </div>
    );
  }

  const { students, dayNumbers, dailySummary, signatures } = currentMonth;

  // Filter students based on search and status
  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
    const totalAbsent = (student.sakit || 0) + (student.izin || 0) + (student.alpa || 0);

    if (!matchesSearch) return false;
    if (statusFilter === 'ABSENT_ONLY') return totalAbsent > 0;
    if (statusFilter === 'PERFECT_ONLY') return totalAbsent === 0;
    return true;
  });

  // Click cell to view student details safely without accidentally modifying marks
  const handleCellClick = (studentNo) => {
    const s = students.find((item) => item.no === studentNo);
    if (s && onSelectStudent) onSelectStudent(s);
  };

  // Export current month table to CSV
  const handleExportCSV = () => {
    const headers = [
      'No',
      'Nama Siswa',
      ...dayNumbers.map((d) => `Tgl ${d}`),
      'Sakit (S)',
      'Izin (I)',
      'Alpa (A)',
      'Total Hadir',
      'Persentase Kehadiran'
    ];

    const rows = filteredStudents.map((s) => [
      s.no,
      s.name,
      ...dayNumbers.map((d) => s.days[d] || ''),
      s.sakit,
      s.izin,
      s.alpa,
      s.hadir,
      `${s.attendanceRate}%`
    ]);

    exportToCSV(`Presensi_${currentMonth.name}_2026`, headers, rows);
  };

  return (
    <div>
      {/* Action Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '16px'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
            Matriks Presensi Harian — {currentMonth.name}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem' }}>
            Daftar absensi siswa tanggal 1 s/d 31 secara rinci (Hadir, Sakit, Izin, Alpa)
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={onOpenQuickText}
            title="Ketik catatan seperti 'Abi Alpa, Afifah ijin, Ahmad Sakit' dan selainnya otomatis Hadir"
          >
            <Sparkles size={15} />
            <span>Input Teks Cepat</span>
          </button>
        </div>
      </div>

      {/* Month Selector Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '14px',
          flexWrap: 'wrap'
        }}
      >
        {attendanceData.months.map((m) => {
          const isSelected = selectedMonth === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedMonth(m.id)}
              className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                borderRadius: '20px',
                padding: '7px 16px',
                fontSize: '0.84rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: isSelected ? '0 4px 14px var(--primary-glow)' : 'none'
              }}
            >
              <Calendar size={14} />
              <span>{m.name}</span>

              {m.isCustom && onDeleteMonth && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Hapus bulan tambahan "${m.name}"?`)) {
                      onDeleteMonth(m.id);
                    }
                  }}
                  title="Hapus bulan tambahan ini"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.1)',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    marginLeft: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <X size={10} />
                </span>
              )}
            </button>
          );
        })}

        {/* Button to Add New Month */}
        <button
          onClick={() => setIsAddMonthOpen(true)}
          className="btn btn-sm btn-secondary"
          style={{
            borderRadius: '20px',
            padding: '6px 14px',
            borderStyle: 'dashed',
            borderColor: 'var(--primary-color)',
            color: 'var(--primary-color)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 600
          }}
          title="Tambah lembar bulan absensi baru"
        >
          <Plus size={14} />
          <span>Tambah Bulan</span>
        </button>

        {/* Quick Fix Semester 2 Order button */}
        {onFixSemester2 && (
          <button
            type="button"
            onClick={onFixSemester2}
            className="btn btn-sm btn-secondary"
            style={{
              borderRadius: '20px',
              padding: '6px 14px',
              borderColor: 'var(--accent-amber)',
              color: 'var(--accent-amber)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600
            }}
            title="Rapikan judul dan urutan tabel di Google Sheet agar dimulai dari Januari (Semester 2)"
          >
            <RotateCcw size={13} />
            <span>Rapikan Urutan Bulan (Semester 2)</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        {/* Search */}
        <div
          style={{
            position: 'relative',
            flex: '1 1 240px',
            maxWidth: '380px'
          }}
        >
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }}
          />
          <input
            type="text"
            className="input-control"
            style={{ paddingLeft: '36px' }}
            placeholder="Cari nama siswa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Filter:
          </span>
          <button
            className={`btn btn-sm ${statusFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('ALL')}
          >
            Semua ({students.length})
          </button>
          <button
            className={`btn btn-sm ${statusFilter === 'ABSENT_ONLY' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('ABSENT_ONLY')}
          >
            Pernah Absen
          </button>
          <button
            className={`btn btn-sm ${statusFilter === 'PERFECT_ONLY' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('PERFECT_ONLY')}
          >
            Hadir Penuh 100%
          </button>
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          flexWrap: 'wrap',
          marginBottom: '12px',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)'
        }}
      >
        <span style={{ fontWeight: 600 }}>Keterangan:</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span className="mark-cell mark-dot" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '4px' }}>•</span>
          Hadir
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span className="mark-cell mark-s" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '4px' }}>S</span>
          Sakit
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span className="mark-cell mark-i" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '4px' }}>I</span>
          Izin
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span className="mark-cell mark-a" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '4px' }}>A</span>
          Alpa (Tanpa Keterangan)
        </span>
      </div>

      {/* Attendance Matrix Table */}
      <div className="matrix-container">
        <table className="matrix-table" role="grid">
          <thead>
            <tr>
              <th className="col-sticky-no" scope="col">No</th>
              <th className="col-sticky-name" scope="col">Nama Siswa</th>
              {dayNumbers.map((d) => (
                <th
                  key={d}
                  scope="col"
                  style={{ minWidth: '34px', cursor: 'pointer' }}
                  title={`Klik untuk bagikan laporan harian Tgl ${d}`}
                  onClick={() => handleShareDaily(d)}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span>{d}</span>
                  </div>
                </th>
              ))}
              <th scope="col" style={{ background: 'var(--status-sakit-bg)', color: 'var(--status-sakit)' }}>S</th>
              <th scope="col" style={{ background: 'var(--status-izin-bg)', color: 'var(--status-izin)' }}>I</th>
              <th scope="col" style={{ background: 'var(--status-alpa-bg)', color: 'var(--status-alpa)' }}>A</th>
              <th scope="col" style={{ minWidth: '70px' }}>% Hadir</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={dayNumbers.length + 6} style={{ padding: '30px', color: 'var(--text-muted)' }}>
                  Tidak ada siswa yang sesuai dengan kriteria pencarian.
                </td>
              </tr>
            ) : (
              filteredStudents.map((s) => (
                <tr key={s.no}>
                  <td className="col-sticky-no">{s.no}</td>
                  <td
                    className="col-sticky-name"
                    style={{ cursor: 'pointer' }}
                    onClick={() => onSelectStudent && onSelectStudent(s)}
                    title="Klik untuk melihat profil kehadiran siswa"
                  >
                    <span style={{ color: 'var(--text-primary)' }}>{s.name}</span>
                  </td>

                  {/* Day cells */}
                  {dayNumbers.map((d) => {
                    const mark = s.days[d] || '';
                    let markClass = 'mark-empty';
                    if (mark === '.') markClass = 'mark-dot';
                    else if (mark === 'S') markClass = 'mark-s';
                    else if (mark === 'I') markClass = 'mark-i';
                    else if (mark === 'A') markClass = 'mark-a';
                    else if (mark.length > 1) markClass = 'mark-holiday';

                    return (
                      <td
                        key={d}
                        className={`mark-cell ${markClass}`}
                        onClick={() => handleCellClick(s.no)}
                        style={{ cursor: 'pointer' }}
                        title={`${s.name} - Tgl ${d}: ${mark === '.' ? 'Hadir' : mark === 'S' ? 'Sakit' : mark === 'I' ? 'Izin' : mark === 'A' ? 'Alpa' : mark || 'Belum Ada Keterangan'}`}
                      >
                        {mark === '.' ? '•' : mark || '-'}
                      </td>
                    );
                  })}

                  {/* Totals */}
                  <td style={{ fontWeight: 700, color: s.sakit > 0 ? 'var(--status-sakit)' : 'var(--text-muted)' }}>
                    {s.sakit || '-'}
                  </td>
                  <td style={{ fontWeight: 700, color: s.izin > 0 ? 'var(--status-izin)' : 'var(--text-muted)' }}>
                    {s.izin || '-'}
                  </td>
                  <td style={{ fontWeight: 700, color: s.alpa > 0 ? 'var(--status-alpa)' : 'var(--text-muted)' }}>
                    {s.alpa || '-'}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        s.attendanceRate >= 95
                          ? 'badge-hadir'
                          : s.attendanceRate >= 80
                          ? 'badge-izin'
                          : 'badge-alpa'
                      }`}
                    >
                      {s.attendanceRate}%
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Signatures from Sheet */}
      <div
        style={{
          marginTop: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          padding: '16px',
          background: 'var(--bg-surface-subtle)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          fontSize: '0.83rem'
        }}
      >
        <div>
          <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Mengetahui,</div>
          <div style={{ fontWeight: 700 }}>Kepala Sekolah</div>
          <div style={{ marginTop: '28px', fontWeight: 700 }}>{signatures.kepalaSekolah}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>NIP. {signatures.nipKepala}</div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>{signatures.dateString}</div>
          <div style={{ fontWeight: 700 }}>Guru Kelas 2C</div>
          <div style={{ marginTop: '28px', fontWeight: 700 }}>{signatures.guruKelas}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>NIP. {signatures.nipGuru}</div>
        </div>
      </div>

      {/* Add Month Modal */}
      <AddMonthModal
        isOpen={isAddMonthOpen}
        onClose={() => setIsAddMonthOpen(false)}
        existingMonths={attendanceData.months || []}
        studentCount={currentMonth.students?.length || 0}
        sheetTitle={attendanceData.docTitle || ''}
        onAddMonth={onAddMonth}
      />
    </div>
  );
}
