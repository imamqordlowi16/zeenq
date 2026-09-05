import * as XLSX from 'xlsx';

/**
 * Generates and downloads a complete Microsoft Excel (.xlsx) file
 * containing all attendance months, rekapitulasi, and student roster.
 */
export function exportToExcel(attendanceData, rekapData, mutasiData, filename = 'Presensi_Siswa_ZeenQ.xlsx') {
  if (!attendanceData || !attendanceData.months) {
    alert('Data presensi belum dimuat.');
    return;
  }

  const wb = XLSX.utils.book_new();

  // 1. Build ABSENSI Sheet
  const absensiRows = [];

  attendanceData.months.forEach((month, mIdx) => {
    if (mIdx > 0) {
      // Empty separator rows between months
      absensiRows.push([]);
      absensiRows.push([]);
    }

    // Month Title
    absensiRows.push([
      `DAFTAR HADIR PESERTA DIDIK BULAN ${month.name} TAHUN AJARAN 2024/2025`
    ]);

    // Header Row
    const header = ['NO', 'NAMA SISWA'];
    const totalDays = month.dayNumbers?.length || 31;
    for (let d = 1; d <= totalDays; d++) {
      header.push(d);
    }
    header.push('S', 'I', 'A', 'JML HADIR', 'PERSENTASE');
    absensiRows.push(header);

    // Student Rows
    if (month.students) {
      month.students.forEach((s) => {
        const row = [s.no, s.name];
        for (let d = 1; d <= totalDays; d++) {
          const mark = s.days ? s.days[d] || '' : '';
          row.push(mark || '');
        }
        row.push(s.sakit || 0);
        row.push(s.izin || 0);
        row.push(s.alpa || 0);
        row.push(s.hadir || 0);
        row.push(`${s.attendanceRate || 100}%`);
        absensiRows.push(row);
      });
    }

    // Totals Row
    const totalRow = ['', 'JUMLAH KETIDAKHADIRAN'];
    for (let d = 1; d <= totalDays; d++) {
      totalRow.push('');
    }
    totalRow.push(
      month.stats?.totalSakit || 0,
      month.stats?.totalIzin || 0,
      month.stats?.totalAlpa || 0,
      month.stats?.totalHadir || 0,
      month.stats?.effectiveAttendanceRate || '100%'
    );
    absensiRows.push(totalRow);

    // Signature Rows
    const sig = month.signatures || {
      dateString: `31 ${month.name} 2024`,
      kepalaSekolah: 'Venez Wella, M.Pd',
      nipKepala: '19820129014122002',
      guruKelas: 'Jeni oktaviani, S.Pd',
      nipGuru: '199610182022212009'
    };

    absensiRows.push([]);
    absensiRows.push(['', 'Mengetahui,', '', '', '', '', '', '', '', '', '', '', '', '', '', '', `Jakarta, ${sig.dateString}`]);
    absensiRows.push(['', 'Kepala Sekolah', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Guru Kelas']);
    absensiRows.push([]);
    absensiRows.push([]);
    absensiRows.push(['', sig.kepalaSekolah, '', '', '', '', '', '', '', '', '', '', '', '', '', '', sig.guruKelas]);
    absensiRows.push(['', `NIP. ${sig.nipKepala}`, '', '', '', '', '', '', '', '', '', '', '', '', '', '', `NIP. ${sig.nipGuru}`]);
  });

  const wsAbsensi = XLSX.utils.aoa_to_sheet(absensiRows);
  XLSX.utils.book_append_sheet(wb, wsAbsensi, 'ABSENSI');

  // 2. Build REKAP Sheet if available
  if (rekapData && rekapData.students && rekapData.students.length > 0) {
    const rekapRows = [];
    rekapRows.push(['REKAPITULASI KEHADIRAN SISWA SEMESTER']);
    rekapRows.push(['NO', 'NAMA SISWA', 'SAKIT (S)', 'IZIN (I)', 'ALPA (A)', 'TOTAL TIDAK HADIR', 'STATUS']);

    rekapData.students.forEach((s) => {
      rekapRows.push([
        s.no,
        s.name,
        s.sakit || 0,
        s.izin || 0,
        s.alpa || 0,
        s.totalAbsen || 0,
        (s.totalAbsen || 0) === 0 ? 'Sangat Rajin' : (s.totalAbsen || 0) <= 3 ? 'Baik' : 'Perlu Pembinaan'
      ]);
    });

    const wsRekap = XLSX.utils.aoa_to_sheet(rekapRows);
    XLSX.utils.book_append_sheet(wb, wsRekap, 'REKAP ABSEN');
  }

  // 3. Build MUTASI / DATA SISWA Sheet if available
  if (mutasiData && mutasiData.students && mutasiData.students.length > 0) {
    const mutasiRows = [];
    mutasiRows.push(['DATA INDUK & MUTASI SISWA']);
    mutasiRows.push(['NO', 'NIS / NISN', 'NAMA SISWA', 'L/P', 'STATUS SISWA']);

    mutasiData.students.forEach((s) => {
      mutasiRows.push([
        s.no,
        s.nis || '-',
        s.name,
        s.gender || 'L',
        s.status || 'Aktif'
      ]);
    });

    const wsMutasi = XLSX.utils.aoa_to_sheet(mutasiRows);
    XLSX.utils.book_append_sheet(wb, wsMutasi, 'DATA SISWA');
  }

  // Save to file
  XLSX.writeFile(wb, filename);
}
