import React, { useState } from 'react';
import {
  Calendar,
  Check,
  CheckCheck,
  Search,
  Share2,
  Sparkles,
  User,
  Users,
  AlertCircle
} from 'lucide-react';
import { generateWhatsAppReport } from '../utils/exportUtils';

export default function MobileAttendanceCards({
  currentMonth,
  selectedDay,
  onSelectDay,
  onUpdateAttendance,
  onOpenQuickText
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('ALL'); // ALL, UNMARKED, ABSENT

  if (!currentMonth || !currentMonth.students) {
    return null;
  }

  const { students, dayNumbers } = currentMonth;
  const activeDay = selectedDay || dayNumbers[0] || 1;

  // Compute daily stats for active day
  let countHadir = 0;
  let countSakit = 0;
  let countIzin = 0;
  let countAlpa = 0;
  let countBelum = 0;

  students.forEach((s) => {
    const mark = s.days?.[activeDay] || '';
    if (mark === '.') countHadir++;
    else if (mark === 'S') countSakit++;
    else if (mark === 'I') countIzin++;
    else if (mark === 'A') countAlpa++;
    else countBelum++;
  });

  // Filter students based on search and tab
  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    const mark = s.days?.[activeDay] || '';
    if (filterMode === 'UNMARKED') return mark === '';
    if (filterMode === 'ABSENT') return mark === 'S' || mark === 'I' || mark === 'A';
    return true;
  });

  // Bulk mark all unmarked students as Hadir (.)
  const handleMarkAllHadir = () => {
    const unmarked = students.filter((s) => !(s.days?.[activeDay]));
    if (unmarked.length === 0) {
      alert(`Semua siswa sudah memiliki data presensi pada tanggal ${activeDay}.`);
      return;
    }

    if (
      window.confirm(
        `Tandai ${unmarked.length} siswa yang belum diabsen pada tanggal ${activeDay} sebagai HADIR (.)?`
      )
    ) {
      unmarked.forEach((s) => {
        onUpdateAttendance(currentMonth.id, s.no, activeDay, '.');
      });
    }
  };

  // Share daily report to WhatsApp
  const handleShareDaily = () => {
    const absentStudents = students
      .filter((s) => {
        const m = s.days?.[activeDay];
        return m === 'S' || m === 'I' || m === 'A';
      })
      .map((s) => {
        const m = s.days?.[activeDay];
        const label = m === 'S' ? 'Sakit' : m === 'I' ? 'Izin' : 'Alpa';
        return `- ${s.name} (${label})`;
      });

    let text = `*PRESENSI HARIAN KELAS — ZEENQ EDUPRESENCE*\n`;
    text += `Bulan: ${currentMonth.name} | Tanggal: ${activeDay}\n`;
    text += `------------------------------------\n`;
    text += `Total Siswa: ${students.length}\n`;
    text += `Hadir: ${countHadir}\n`;
    text += `Sakit: ${countSakit}\n`;
    text += `Izin: ${countIzin}\n`;
    text += `Alpa: ${countAlpa}\n`;
    text += `Belum Absen: ${countBelum}\n`;
    text += `------------------------------------\n`;

    if (absentStudents.length > 0) {
      text += `*Keterangan Ketidakhadiran:*\n${absentStudents.join('\n')}\n`;
    } else {
      text += `Alhamdulillah seluruh siswa hadir (100%).\n`;
    }

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="mobile-attendance-container">
      {/* Date Ribbon Picker */}
      <div className="day-ribbon-wrapper">
        <div className="day-ribbon-label">
          <Calendar size={15} style={{ color: 'var(--primary)' }} />
          <span>Pilih Tanggal ({currentMonth.name}):</span>
        </div>
        <div className="day-ribbon-scroll">
          {dayNumbers.map((d) => {
            const isSelected = d === activeDay;
            // Count absences on that day
            const hasData = students.some((s) => s.days?.[d]);
            return (
              <button
                key={d}
                type="button"
                onClick={() => onSelectDay(d)}
                className={`day-pill ${isSelected ? 'active' : ''} ${hasData ? 'has-data' : ''}`}
              >
                <span className="day-pill-num">{d}</span>
                {hasData && <span className="day-pill-dot" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Daily Summary Card for Active Day */}
      <div className="glass-panel mobile-day-summary">
        <div className="mobile-summary-header">
          <div>
            <div className="mobile-summary-title">
              Presensi Tanggal {activeDay} {currentMonth.name}
            </div>
            <div className="mobile-summary-sub">
              {students.length - countBelum} dari {students.length} siswa sudah diabsen
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={handleShareDaily}
              className="btn btn-secondary btn-sm"
              title="Bagikan laporan harian ke WhatsApp"
              style={{ padding: '6px 10px' }}
            >
              <Share2 size={15} />
            </button>
            <button
              onClick={onOpenQuickText}
              className="btn btn-primary btn-sm"
              title="Input via teks catatan cepat"
              style={{ padding: '6px 10px' }}
            >
              <Sparkles size={15} />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mobile-stats-row">
          <div className="mobile-stat-box hadir">
            <span className="val">{countHadir}</span>
            <span className="lbl">Hadir (.)</span>
          </div>
          <div className="mobile-stat-box sakit">
            <span className="val">{countSakit}</span>
            <span className="lbl">Sakit (S)</span>
          </div>
          <div className="mobile-stat-box izin">
            <span className="val">{countIzin}</span>
            <span className="lbl">Izin (I)</span>
          </div>
          <div className="mobile-stat-box alpa">
            <span className="val">{countAlpa}</span>
            <span className="lbl">Alpa (A)</span>
          </div>
        </div>

        {/* Quick Action Button: Tandai Semua Hadir */}
        {countBelum > 0 && (
          <button
            onClick={handleMarkAllHadir}
            className="btn btn-primary btn-sm"
            style={{
              width: '100%',
              marginTop: '12px',
              justifyContent: 'center',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderColor: '#10b981'
            }}
          >
            <CheckCheck size={16} />
            <span>Tandai Sisa Siswa ({countBelum}) Sebagai Hadir</span>
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="mobile-filter-bar">
        <div className="mobile-search-input">
          <Search size={15} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Cari nama siswa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="mobile-filter-chips">
          <button
            className={`chip ${filterMode === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterMode('ALL')}
          >
            Semua ({students.length})
          </button>
          <button
            className={`chip ${filterMode === 'UNMARKED' ? 'active' : ''}`}
            onClick={() => setFilterMode('UNMARKED')}
          >
            Belum ({countBelum})
          </button>
          <button
            className={`chip ${filterMode === 'ABSENT' ? 'active' : ''}`}
            onClick={() => setFilterMode('ABSENT')}
          >
            Absen ({countSakit + countIzin + countAlpa})
          </button>
        </div>
      </div>

      {/* Student Attendance Cards List */}
      <div className="mobile-students-list">
        {filteredStudents.length === 0 ? (
          <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <AlertCircle size={24} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.5 }} />
            Tidak ada siswa dalam filter ini.
          </div>
        ) : (
          filteredStudents.map((student) => {
            const currentMark = student.days?.[activeDay] || '';

            return (
              <div key={student.no} className={`student-mobile-card ${currentMark ? `marked-${currentMark}` : 'unmarked'}`}>
                <div className="card-student-info">
                  <div className="student-badge-no">{student.no}</div>
                  <div className="student-name-meta">
                    <div className="student-name">{student.name}</div>
                    <div className="student-sub">
                      <span>Total Hadir: {student.hadir || 0}</span>
                      <span>•</span>
                      <span>Rate: {student.attendanceRate || 100}%</span>
                    </div>
                  </div>
                </div>

                {/* Thumb-Friendly Attendance Choice Buttons */}
                <div className="card-mark-options">
                  <button
                    type="button"
                    className={`mark-btn btn-dot ${currentMark === '.' ? 'active' : ''}`}
                    onClick={() => onUpdateAttendance(currentMonth.id, student.no, activeDay, currentMark === '.' ? '' : '.')}
                    title="Hadir (.)"
                  >
                    .
                  </button>
                  <button
                    type="button"
                    className={`mark-btn btn-s ${currentMark === 'S' ? 'active' : ''}`}
                    onClick={() => onUpdateAttendance(currentMonth.id, student.no, activeDay, currentMark === 'S' ? '' : 'S')}
                    title="Sakit (S)"
                  >
                    S
                  </button>
                  <button
                    type="button"
                    className={`mark-btn btn-i ${currentMark === 'I' ? 'active' : ''}`}
                    onClick={() => onUpdateAttendance(currentMonth.id, student.no, activeDay, currentMark === 'I' ? '' : 'I')}
                    title="Izin (I)"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    className={`mark-btn btn-a ${currentMark === 'A' ? 'active' : ''}`}
                    onClick={() => onUpdateAttendance(currentMonth.id, student.no, activeDay, currentMark === 'A' ? '' : 'A')}
                    title="Alpa (A)"
                  >
                    A
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
