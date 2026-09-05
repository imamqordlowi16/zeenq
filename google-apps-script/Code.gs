/**
 * =========================================================================
 * ZEENQ EDUPRESENCE — GOOGLE APPS SCRIPT WEBHOOK
 * Integrasi 2 Arah: Otomatis Menambahkan Tabel Bulan & Menyimpan Presensi
 * =========================================================================
 * 
 * CARA MEMASANG (HANYA 1 MENIT):
 * 1. Buka file Google Sheets Anda.
 * 2. Klik menu: Ekstensi (Extensions) > Apps Script.
 * 3. Hapus seluruh kode lama yang ada di editor, lalu TEMPELKAN (PASTE) kode ini.
 * 4. Klik ikon Disket (Simpan) atau tekan Ctrl + S.
 * 5. Klik tombol biru di kanan atas: Terapkan (Deploy) > Deployment baru (New deployment).
 * 6. Klik ikon gerigi (Pilih jenis) > pilih "Aplikasi web" (Web app).
 * 7. Konfigurasi:
 *    - Deskripsi: ZeenQ Webhook
 *    - Jalankan sebagai: Saya (Email Anda)
 *    - Yang memiliki akses: Siapa saja (Anyone) -> PENTING agar web app bisa mengirim data
 * 8. Klik "Terapkan" (Deploy).
 * 9. Berikan izin (Review Permissions) akun Google Anda jika diminta:
 *    - Pilih Akun Anda > Advanced (Lanjutan) > Buka Proyek (tidak aman) > Izinkan (Allow).
 * 10. Salin "URL Aplikasi Web" (berakhir dengan /exec) dan tempelkan ke aplikasi ZeenQ!
 * =========================================================================
 */

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({
      status: 'success',
      message: 'ZeenQ Google Sheets Webhook is active and connected!',
      timestamp: new Date().toISOString()
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var rawData = e.postData ? e.postData.contents : '';
    if (!rawData) {
      return jsonResponse({ status: 'error', message: 'No payload data received' });
    }

    var payload = JSON.parse(rawData);
    var action = payload.action;

    var ss = (payload.spreadsheetId)
      ? SpreadsheetApp.openById(payload.spreadsheetId)
      : SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'ping') {
      return jsonResponse({
        status: 'success',
        message: 'Koneksi ke Google Sheets berhasil!',
        sheetTitle: ss.getName()
      });
    }

    if (action === 'addMonth') {
      return handleAddMonth(ss, payload);
    }

    if (action === 'updateAttendance') {
      return handleUpdateAttendance(ss, payload);
    }

    return jsonResponse({ status: 'error', message: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

/**
 * Membuat tabel matriks presensi bulan baru di lembar ABSENSI
 */
function handleAddMonth(ss, payload) {
  var monthName = (payload.monthName || 'BULAN BARU').toUpperCase();
  var totalDays = parseInt(payload.totalDays, 10) || 30;
  var year = payload.year || new Date().getFullYear();
  var students = payload.students || [];
  var initialAttendance = payload.initialAttendance || 'empty'; // 'empty' or 'hadir'

  // Cari sheet ABSENSI atau gunakan sheet pertama
  var sheet = ss.getSheetByName('ABSENSI') || ss.getSheets()[0];

  var lastRow = sheet.getLastRow();
  var startRow = lastRow > 0 ? lastRow + 3 : 1;

  // 1. Judul Tabel Bulan
  var titleText = 'DAFTAR HADIR PESERTA DIDIK BULAN ' + monthName + ' TAHUN AJARAN ' + year + '/' + (year + 1);
  sheet.getRange(startRow, 1).setValue(titleText).setFontWeight('bold').setFontSize(11);

  // 2. Header Kolom
  var headerRow = startRow + 1;
  var headerValues = ['NO.', 'NAMA SISWA'];
  for (var d = 1; d <= totalDays; d++) {
    headerValues.push(d.toString());
  }
  headerValues.push('S', 'I', 'A', 'JML');

  var headerRange = sheet.getRange(headerRow, 1, 1, headerValues.length);
  headerRange.setValues([headerValues]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#e2e8f0');
  headerRange.setHorizontalAlignment('center');

  // 3. Baris Data Siswa
  var defaultMark = initialAttendance === 'hadir' ? '.' : '';
  var studentRows = [];

  for (var i = 0; i < students.length; i++) {
    var s = students[i];
    var row = [s.no || (i + 1), s.name || ''];
    for (var day = 1; day <= totalDays; day++) {
      row.push(defaultMark);
    }
    row.push('', '', '', ''); // S, I, A, JML kosong
    studentRows.push(row);
  }

  if (studentRows.length > 0) {
    var studentRange = sheet.getRange(headerRow + 1, 1, studentRows.length, headerValues.length);
    studentRange.setValues(studentRows);

    // Set format borders
    studentRange.setBorder(true, true, true, true, true, true);
    headerRange.setBorder(true, true, true, true, true, true);
  }

  // 4. Baris Tanda Tangan / Pengesahan
  var footerStart = headerRow + studentRows.length + 2;
  var colCenter = Math.floor(headerValues.length / 2);

  sheet.getRange(footerStart, 2).setValue('Mengetahui,');
  sheet.getRange(footerStart + 1, 2).setValue('Kepala Sekolah');
  sheet.getRange(footerStart + 4, 2).setValue('Venez Wella, M.Pd').setFontWeight('bold');
  sheet.getRange(footerStart + 5, 2).setValue('NIP. 19820129014122002');

  sheet.getRange(footerStart, colCenter + 3).setValue('Jakarta, ' + totalDays + ' ' + monthName + ' ' + year);
  sheet.getRange(footerStart + 1, colCenter + 3).setValue('Guru Kelas');
  sheet.getRange(footerStart + 4, colCenter + 3).setValue('Jeni oktaviani, S.Pd').setFontWeight('bold');
  sheet.getRange(footerStart + 5, colCenter + 3).setValue('NIP. 199610182022212009');

  return jsonResponse({
    status: 'success',
    message: 'Tabel bulan ' + monthName + ' berhasil dibuat di Google Sheets!',
    sheetName: sheet.getName(),
    createdRowStart: startRow
  });
}

/**
 * Menyimpan tanda presensi harian siswa langsung ke sel yang tepat
 */
function handleUpdateAttendance(ss, payload) {
  var monthName = (payload.monthName || '').toUpperCase();
  var studentNo = parseInt(payload.studentNo, 10);
  var dayNum = parseInt(payload.dayNum, 10);
  var mark = payload.mark || '';

  var sheet = ss.getSheetByName('ABSENSI') || ss.getSheets()[0];
  var data = sheet.getDataRange().getValues();

  var currentTableMonth = '';
  var targetRow = -1;
  var targetCol = -1;

  for (var r = 0; r < data.length; r++) {
    var rowStr = data[r].join(' ').toUpperCase();
    if (rowStr.indexOf('BULAN ' + monthName) !== -1 || rowStr.indexOf(monthName) !== -1) {
      currentTableMonth = monthName;
    }

    if (currentTableMonth === monthName) {
      // Cek apakah baris ini adalah header kolom tanggal
      if (data[r].indexOf('NAMA SISWA') !== -1 || data[r].indexOf('NAMA') !== -1) {
        var header = data[r];
        for (var c = 0; c < header.length; c++) {
          if (parseInt(header[c], 10) === dayNum) {
            targetCol = c + 1;
            break;
          }
        }
      }

      // Cek apakah baris ini nomor siswa yang dicari
      if (parseInt(data[r][0], 10) === studentNo && targetCol !== -1) {
        targetRow = r + 1;
        break;
      }
    }
  }

  if (targetRow !== -1 && targetCol !== -1) {
    sheet.getRange(targetRow, targetCol).setValue(mark);
    return jsonResponse({
      status: 'success',
      message: 'Presensi berhasil diperbarui di baris ' + targetRow + ', kolom ' + targetCol
    });
  }

  return jsonResponse({
    status: 'partial',
    message: 'Siswa atau tanggal belum ditemukan di tabel Google Sheets, data tersimpan di memori lokal ZeenQ.'
  });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
