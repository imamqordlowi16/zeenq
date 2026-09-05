/**
 * Export and WhatsApp Sharing Utilities for ZeenQ
 */

/**
 * Downloads attendance data as CSV
 */
export function exportToCSV(filename, headers, rows) {
  const escapeCell = (cell) => {
    if (cell === null || cell === undefined) return '""';
    const str = String(cell).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map((r) => r.map(escapeCell).join(','))
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates formatted WhatsApp broadcast message for parents / school group
 */
export function generateWhatsAppReport(monthData, activeDay = null) {
  if (!monthData) return '';

  const { name: monthName, students, stats, signatures } = monthData;
  const now = new Date();
  const dateStr = activeDay
    ? `Tanggal ${activeDay} ${monthName}`
    : `Bulan ${monthName} (${now.toLocaleDateString('id-ID', { dateStyle: 'long' })})`;

  let text = `📢 *LAPORAN PRESENSI SISWA - ${signatures.guruKelas ? 'KELAS 2C' : 'SEKOLAH'}*\n`;
  text += `📅 *Periode:* ${dateStr}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (activeDay) {
    const hadir = [];
    const sakit = [];
    const izin = [];
    const alpa = [];

    students.forEach((s) => {
      const mark = s.days[activeDay];
      if (mark === '.') hadir.push(s.name);
      else if (mark === 'S') sakit.push(s.name);
      else if (mark === 'I') izin.push(s.name);
      else if (mark === 'A') alpa.push(s.name);
    });

    text += `📊 *Ringkasan Kehadiran Hari Ini:*\n`;
    text += `✅ Hadir: *${hadir.length} Siswa*\n`;
    text += `🤒 Sakit (S): *${sakit.length} Siswa*\n`;
    text += `📩 Izin (I): *${izin.length} Siswa*\n`;
    text += `❌ Alpa (A): *${alpa.length} Siswa*\n\n`;

    if (sakit.length > 0) {
      text += `*Siswa Sakit:*\n` + sakit.map((n) => `• ${n}`).join('\n') + '\n\n';
    }
    if (izin.length > 0) {
      text += `*Siswa Izin:*\n` + izin.map((n) => `• ${n}`).join('\n') + '\n\n';
    }
    if (alpa.length > 0) {
      text += `*Siswa Tanpa Keterangan:*\n` + alpa.map((n) => `• ${n}`).join('\n') + '\n\n';
    }
  } else {
    text += `📊 *Statistik Keseluruhan ${monthName}:*\n`;
    text += `👥 Total Siswa: *${students.length}*\n`;
    text += `📈 Rata-rata Kehadiran: *${stats.effectiveAttendanceRate}*\n`;
    text += `🤒 Total Sakit: *${stats.totalSakit}*\n`;
    text += `📩 Total Izin: *${stats.totalIzin}*\n`;
    text += `❌ Total Alpa: *${stats.totalAlpa}*\n\n`;

    const absentees = students
      .filter((s) => s.sakit + s.izin + s.alpa > 0)
      .sort((a, b) => b.sakit + b.izin + b.alpa - (a.sakit + a.izin + a.alpa));

    if (absentees.length > 0) {
      text += `📌 *Catatan Ketidakhadiran:* \n`;
      absentees.slice(0, 10).forEach((s) => {
        text += `• ${s.name} (S: ${s.sakit}, I: ${s.izin}, A: ${s.alpa})\n`;
      });
      text += '\n';
    }
  }

  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `Wali Kelas: *${signatures.guruKelas || 'Guru'}*\n`;
  text += `_Dibuat otomatis via Aplikasi ZeenQ EduPresence_`;

  return text;
}
