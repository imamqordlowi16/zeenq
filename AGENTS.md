# ZeenQ EduPresence — Project Memory & Architecture Knowledge Base

Dokumen ini berisi rangkuman lengkap arsitektur sistem, aturan bisnis, pemetaan spreadsheet, dan seluruh fitur yang telah diselesaikan untuk aplikasi **ZeenQ EduPresence**.

---

## 1. Identitas & Tujuan Proyek
- **Nama Aplikasi**: ZeenQ EduPresence
- **Tujuan**: Aplikasi web manajemen absensi harian dan rekapitulasi semester siswa sekolah dasar (Kelas 1C / SD), terintegrasi dua arah (*two-way live sync*) dengan Google Sheets di Google Drive guru.
- **Teknologi**: React (Vite), Vanilla CSS modern (Glassmorphism & tema responsif), Google Sheets REST API v4, Google Identity Services (OAuth 2.0).

---

## 2. Struktur Google Spreadsheet & Pemetaan Baris (Blueprint)
- **ID Spreadsheet Default**: `1ADtLN3mRJ2XcbQUpjpNVfoiUBQ7dan2LmjkLUPNl9XY`
- **Tab Utama**:
  - `ABSENSI` (GID: `272037099`): Matriks absensi bulanan semester 2.
  - `REKAP` (GID: `490778033`): Rekapitulasi semester siswa.
  - `MUTASI` (GID: `1395406134`): Data mutasi peserta didik.

### Struktur Baris & Kolom Bulan Januari
- **Baris 1**: Judul resmi (`DAFTAR HADIR PESERTA DIDIK BULAN JANUARI TAHUN AJARAN 2025/2026`) — Merged `A1:AK1`.
- **Baris 2**: Header Kolom Utama (`NO`, `NAMA SISWA`, Tanggal `1` s/d `31`, `TGL`, `S`, `I`, `A`, `JML`).
- **Baris 3**: Subheader Kolom (`L/P`, `Sakit`, `Izin`, `Alpa`, `Jumlah`). **PENTING: Jangan pernah ditimpa oleh angka rekapitulasi siswa!**
- **Baris Siswa (1 s/d 28)**:
  - **Siswa 1 (ADEEVA NATASHA PUTRI)**: **Baris 4**
  - **Siswa 2 (ADELIA FARANISA AZNII)**: **Baris 5**
  - **Siswa 3 (AFIFAH AULIADINATA)**: **Baris 6**
  - **Siswa $N$**: `Row = 4 + (N - 1)` (Baris 4 s/d 31)

### Rumus Baris Siswa untuk Semua Bulan
| Bulan | Header Row | First Student Row | Rumus Baris Siswa ($N$) |
|---|---|---|---|
| **JANUARI** | Baris 2 | Baris 4 | `4 + (N - 1)` |
| **FEBRUARI** | Baris 39 | Baris 40 | `40 + (N - 1)` |
| **MARET** | Baris 75 | Baris 76 | `76 + (N - 1)` |
| **APRIL** | Baris 111 | Baris 112 | `112 + (N - 1)` |
| **MEI** | Baris 147 | Baris 148 | `148 + (N - 1)` |
| **JUNI** | Baris 183 | Baris 184 | `184 + (N - 1)` |
| **JULI** | Baris 219 | Baris 220 | `220 + (N - 1)` |

### Kolom Rekapitulasi Siswa (Kolom Kanan)
- **Kolom AH**: Sakit (S)
- **Kolom AI**: Izin (I)
- **Kolom AJ**: Alpa (A)
- **Kolom AK**: Jumlah Ketidakhadiran (Sakit + Izin + Alpa)

---

## 3. Standar Karakter Absensi (Aturan Tanda)
- **Hadir**: Karakter titik biasa `.` (**BUKAN simbol bullet `•`**). Di UI ditampilkan titik tegas `.`.
- **Sakit**: Huruf kapital `S`.
- **Izin**: Huruf kapital `I`.
- **Alpa / Tanpa Keterangan**: Huruf kapital `A`.
- **Kosong / Libur**: Nilai string kosong `""` atau tanda `-`.

---

## 4. Fitur Utama yang Telah Selesai Dibangun

### A. Live Google Sheets REST API & OAuth 2.0
- Login Google resmi via GIS (`@react-oauth/google` / direct client token).
- Tanda aktif `[ Google Aktif ]` di navbar.
- Antrean batch update (`queueAttendanceMarkUpdate`) dengan debouncing 350ms untuk efisiensi kuota API dan update seketika ke Google Sheets.
- Proteksi subheader baris 3 (`AH3:AK3`) agar selalu terkunci dengan teks `Sakit`, `Izin`, `Alpa`, `Jumlah`.

### B. Input Teks Cepat (Quick Text Input)
- Memungkinkan guru meng-copy teks absensi WhatsApp (contoh: *"absen tgl 5: Adeeva sakit, Afifah izin, Albiandra alpa"*).
- Siswa yang tidak disebutkan dalam teks secara cerdas otomatis terisi Hadir (`.`).
- Menampilkan ringkasan jumlah Hadir, Sakit, Izin, Alpa sebelum disimpan.
- Sekali klik langsung memperbarui state lokal dan mengirim pembaruan massal ke Google Sheets.

### C. Pengurutan & Perapian Bulan (Semester 2)
- Urutan bulan Semester 2 dipastikan: **Januari -> Februari -> Maret -> April -> Mei -> Juni (+ Juli)**.
- Tombol **"Rapikan Urutan Bulan (Semester 2)"**:
  - Membersihkan tabel percobaan di bagian atas.
  - Memastikan baris 1 dan baris 2 bulan Januari rapi dan presisi.
  - Memulihkan subheader baris 3.
- Fitur **"+ Tambah Bulan"**: Menyisipkan tabel 37 kolom baru lengkap dengan tanda tangan Kepala Sekolah & Guru Kelas langsung ke Google Sheets.

### D. Performa & Offline-First (Stale-While-Revalidate)
- Cache instan via `localStorage` sehingga aplikasi langsung terbuka tanpa loading lama.
- Background refresh otomatis menyinkronkan data terbaru dari spreadsheet online.
- Parser CSV (`parseCSV`) dan Array parser (`parseAttendanceSheet`) dirancang menjaga keutuhan nomor baris tanpa pemotongan baris kosong (mencegah bug *shifted rows*).

### E. Cetak & Ekspor
- **Cetak Laporan Presensi**: Format siap cetak kertas A4/Folio standar kedinasan dengan tanda tangan dan rekapitulasi.
- **Ekspor Excel (.xlsx)**: File spreadsheet hasil unduhan dengan tanda titik `.` murni.
- **Bagikan Laporan Harian**: Format teks ringkasan untuk grup WhatsApp wali murid.

### F. Dukungan Mobile & Progressive Web App (PWA)
- **Installable PWA**: Terdaftar melalui `public/manifest.json`, icon SVG 192px/512px, meta tag standalone iOS/Android, dan pendaftaran Service Worker (`public/sw.js`) dengan strategi caching *Stale-While-Revalidate*.
- **Banner Instalasi Cerdas (`InstallPwaBanner.jsx`)**: Menampilkan tombol instal otomatis pada Chrome/Android dan instruksi khusus "Add to Home Screen" pada iOS Safari.
- **Mode Kartu Absensi Sentuh (`MobileAttendanceCards.jsx`)**:
  - Tampilan kartu absensi vertikal yang ramah layar sentuh (touch targets $\ge 44$px).
  - Pita pemilih tanggal (*date strip*) yang bisa digeser dengan mudah.
  - 5 tombol status langsung (H, S, I, A, -) per siswa tanpa perlu membuka modal.
  - Tombol toggle instan antara **Mode Kartu (HP)** dan **Mode Tabel Matriks** di `AttendanceView.jsx`.

---

## 5. Ringkasan File Kunci
- `src/App.jsx`: State utama aplikasi, fungsi `computeStudentRowIndex`, integrasi event handler, toast notification.
- `src/services/googleSheetsApiService.js`: Integrasi Google Sheets REST API v4, `queueAttendanceMarkUpdate`, `fixSemester2Spreadsheet`, `appendMonthToGoogleSheet`.
- `src/services/sheetParser.js`: Parser CSV & array live rows, penentuan semester, kalkulasi statistik kehadiran harian/bulanan.
- `src/components/AttendanceView.jsx`: Tampilan matriks absensi, legenda kehadiran, navigasi bulan, aksi klik sel, switch mode Kartu / Matriks.
- `src/components/MobileAttendanceCards.jsx`: Komponen kartu absensi harian ramah sentuhan khusus layar mobile/HP.
- `src/components/InstallPwaBanner.jsx`: Banner interaktif untuk instalasi PWA di Android dan iOS.
- `src/components/QuickTextInputModal.jsx`: Modal input teks presensi cepat berbasis parser regex/NLP.
- `src/components/PrintReportModal.jsx`: Modal pratinjau cetak laporan absensi dinas.
- `public/manifest.json` & `public/sw.js`: Konfigurasi PWA dan Service Worker caching.
- `zeeniq_web.zip`: Arsip build produksi siap *deploy* atau distribusikan.
