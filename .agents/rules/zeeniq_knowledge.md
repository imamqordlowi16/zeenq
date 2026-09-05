# ZeenQ EduPresence — Core Rules & Context

- Selalu gunakan tanda titik biasa `.` untuk Hadir (JANGAN gunakan simbol bullet `•`).
- Siswa 1 di bulan Januari adalah Baris 4 (Row 4) di Google Sheets (`AH3:AK3` adalah subheader, jangan ditimpa).
- Urutan bulan Semester 2 adalah: JANUARI -> FEBRUARI -> MARET -> APRIL -> MEI -> JUNI (+ JULI).
- Perhitungan baris siswa: `computeStudentRowIndex(curMonth, studentNo, curStudent)`.
- Sinkronisasi presensi harian ke Google Sheets menggunakan `queueAttendanceMarkUpdate`.
