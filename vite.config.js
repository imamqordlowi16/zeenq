import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

function autoSavePlugin() {
  return {
    name: 'auto-save-plugin',
    configureServer(server) {
      // Endpoint to auto-save directly to local Excel & JSON without any download
      server.middlewares.use('/api/auto-save', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const payload = JSON.parse(body);
              const { attendanceData, rekapData, mutasiData } = payload;

              // 1. Save JSON database
              const dataDir = path.resolve('data');
              if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
              }
              const jsonPath = path.join(dataDir, 'attendance_database.json');
              fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf-8');

              // 2. Automatically write real Excel file directly on hard drive
              if (attendanceData && attendanceData.months) {
                const wb = XLSX.utils.book_new();
                const absensiRows = [];

                attendanceData.months.forEach((month, mIdx) => {
                  if (mIdx > 0) {
                    absensiRows.push([]);
                    absensiRows.push([]);
                  }

                  absensiRows.push([
                    `DAFTAR HADIR PESERTA DIDIK BULAN ${month.name} TAHUN AJARAN 2024/2025`
                  ]);

                  const totalDays = month.dayNumbers?.length || 31;
                  const header = ['NO', 'NAMA SISWA'];
                  for (let d = 1; d <= totalDays; d++) header.push(d);
                  header.push('S', 'I', 'A', 'JML HADIR', 'PERSENTASE');
                  absensiRows.push(header);

                  if (month.students) {
                    month.students.forEach((s) => {
                      const row = [s.no, s.name];
                      for (let d = 1; d <= totalDays; d++) {
                        const mark = s.days ? s.days[d] || '' : '';
                        row.push(mark === '.' ? '•' : mark);
                      }
                      row.push(s.sakit || 0);
                      row.push(s.izin || 0);
                      row.push(s.alpa || 0);
                      row.push(s.hadir || 0);
                      row.push(`${s.attendanceRate || 100}%`);
                      absensiRows.push(row);
                    });
                  }

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

                if (rekapData && rekapData.students) {
                  const rekapRows = [['REKAPITULASI KEHADIRAN SISWA SEMESTER'], ['NO', 'NAMA SISWA', 'S', 'I', 'A', 'TOTAL ABSEN']];
                  rekapData.students.forEach((s) => rekapRows.push([s.no, s.name, s.sakit || 0, s.izin || 0, s.alpa || 0, s.totalAbsen || 0]));
                  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rekapRows), 'REKAP ABSEN');
                }

                if (mutasiData && mutasiData.students) {
                  const mutasiRows = [['DATA INDUK & MUTASI SISWA'], ['NO', 'NIS', 'NAMA SISWA', 'L/P', 'STATUS']];
                  mutasiData.students.forEach((s) => mutasiRows.push([s.no, s.nis || '-', s.name, s.gender || 'L', s.status || 'Aktif']));
                  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(mutasiRows), 'DATA SISWA');
                }

                const excelPath = path.resolve('Presensi_Siswa_Aktif.xlsx');
                XLSX.writeFile(wb, excelPath);
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, message: 'Otomatis tersimpan di komputer!' }));
            } catch (err) {
              console.error('Auto-save error:', err);
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end();
        }
      });

      // Endpoint to load local saved database if exists
      server.middlewares.use('/api/load-saved', (req, res) => {
        const jsonPath = path.resolve('data', 'attendance_database.json');
        if (fs.existsSync(jsonPath)) {
          try {
            const data = fs.readFileSync(jsonPath, 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.end(data);
            return;
          } catch (err) {
            console.error('Load saved error:', err);
          }
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ exists: false }));
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), autoSavePlugin()],
});
