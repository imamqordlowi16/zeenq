import React, { useState } from 'react';
import {
  X,
  Code2,
  Copy,
  Check,
  ExternalLink,
  Zap,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { testGoogleScriptConnection } from '../services/sheetsService';

const APPS_SCRIPT_CODE = `/**
 * ZEENQ EDUPRESENCE — GOOGLE APPS SCRIPT WEBHOOK
 * Integrasi 2 Arah: Otomatis Menambahkan Tabel Bulan & Menyimpan Presensi
 */

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({
      status: 'success',
      message: 'ZeenQ Google Sheets Webhook aktif dan siap!',
      timestamp: new Date().toISOString()
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var rawData = e.postData ? e.postData.contents : '';
    if (!rawData) {
      return jsonResponse({ status: 'error', message: 'Tidak ada data payload' });
    }

    var payload = JSON.parse(rawData);
    var action = payload.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

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

    return jsonResponse({ status: 'error', message: 'Aksi tidak dikenali: ' + action });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

function handleAddMonth(ss, payload) {
  var monthName = (payload.monthName || 'BULAN BARU').toUpperCase();
  var totalDays = parseInt(payload.totalDays, 10) || 30;
  var year = payload.year || new Date().getFullYear();
  var students = payload.students || [];
  var initialAttendance = payload.initialAttendance || 'empty';

  var sheet = ss.getSheetByName('ABSENSI') || ss.getSheets()[0];
  var lastRow = sheet.getLastRow();
  var startRow = lastRow > 0 ? lastRow + 3 : 1;

  // 1. Judul Tabel
  var titleText = 'DAFTAR HADIR PESERTA DIDIK BULAN ' + monthName + ' TAHUN AJARAN ' + year + '/' + (year + 1);
  sheet.getRange(startRow, 1).setValue(titleText).setFontWeight('bold').setFontSize(11);

  // 2. Header Kolom Tanggal
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

  // 3. Baris Siswa
  var defaultMark = initialAttendance === 'hadir' ? '.' : '';
  var studentRows = [];

  for (var i = 0; i < students.length; i++) {
    var s = students[i];
    var row = [s.no || (i + 1), s.name || ''];
    for (var day = 1; day <= totalDays; day++) {
      row.push(defaultMark);
    }
    row.push('', '', '', '');
    studentRows.push(row);
  }

  if (studentRows.length > 0) {
    var studentRange = sheet.getRange(headerRow + 1, 1, studentRows.length, headerValues.length);
    studentRange.setValues(studentRows);
    studentRange.setBorder(true, true, true, true, true, true);
    headerRange.setBorder(true, true, true, true, true, true);
  }

  return jsonResponse({
    status: 'success',
    message: 'Tabel bulan ' + monthName + ' berhasil dibuat di Google Sheets!',
    sheetName: sheet.getName(),
    createdRowStart: startRow
  });
}

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
      if (data[r].indexOf('NAMA SISWA') !== -1 || data[r].indexOf('NAMA') !== -1) {
        var header = data[r];
        for (var c = 0; c < header.length; c++) {
          if (parseInt(header[c], 10) === dayNum) {
            targetCol = c + 1;
            break;
          }
        }
      }

      if (parseInt(data[r][0], 10) === studentNo && targetCol !== -1) {
        targetRow = r + 1;
        break;
      }
    }
  }

  if (targetRow !== -1 && targetCol !== -1) {
    sheet.getRange(targetRow, targetCol).setValue(mark);
    return jsonResponse({ status: 'success', message: 'Presensi diperbarui!' });
  }

  return jsonResponse({ status: 'partial', message: 'Tersimpan lokal di ZeenQ.' });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}`;

export default function GoogleScriptSetupModal({
  isOpen,
  onClose,
  currentScriptUrl = '',
  onSaveScriptUrl
}) {
  const [urlInput, setUrlInput] = useState(currentScriptUrl);
  const [isCopied, setIsCopied] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_CODE);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    } catch (err) {
      console.warn('Clipboard copy error:', err);
    }
  };

  const handleTestConnection = async () => {
    if (!urlInput.trim()) {
      setTestResult({
        success: false,
        message: 'Silakan tempelkan URL Google Apps Script Anda terlebih dahulu.'
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await testGoogleScriptConnection(urlInput.trim());
      setTestResult(res);
      if (res.success) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (e) {
      setTestResult({
        success: false,
        message: 'Gagal terhubung: ' + (e.message || 'Periksa URL')
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSaveScriptUrl(urlInput.trim());
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-surface-elevated)',
          color: 'var(--text-primary)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface-subtle)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Zap size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                Integrasi 2 Arah Google Sheets (Otomatis Buat Tabel)
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                Hubungkan Apps Script agar penambahan bulan otomatis masuk ke Google Sheets asli
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" aria-label="Tutup modal">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {/* Step-by-Step Guide */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '10px' }}>
              Panduan 3 Langkah Pemasangan (Hanya 1 Menit):
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Step 1 */}
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'var(--bg-surface-subtle)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.84rem'
                }}
              >
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    flexShrink: 0
                  }}
                >
                  1
                </span>
                <div>
                  <strong>Buka Google Sheets & Apps Script:</strong>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '2px' }}>
                    Di spreadsheet Anda, klik menu <code>Ekstensi (Extensions)</code> &gt;{' '}
                    <code>Apps Script</code>.
                  </div>
                  <div
                    style={{
                      marginTop: '6px',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      background: 'var(--status-izin-bg)',
                      color: 'var(--accent-amber)',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    ⚠️ <em>Jika ada kotak hijau <strong>.XLSX</strong> di samping judul, klik <strong>File &gt; Simpan sebagai Google Spreadsheet</strong> agar menu Ekstensi muncul!</em>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'var(--bg-surface-subtle)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.84rem'
                }}
              >
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    flexShrink: 0
                  }}
                >
                  2
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <strong>Hapus Kode Lama & Tempelkan Kode Ini:</strong>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className={`btn btn-sm ${isCopied ? 'btn-success' : 'btn-primary'}`}
                      style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                    >
                      {isCopied ? <Check size={13} /> : <Copy size={13} />}
                      <span>{isCopied ? 'Kode Disalin!' : 'Salin Kode Script'}</span>
                    </button>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '4px' }}>
                    Hapus kode yang ada di Apps Script, lalu <em>Paste</em> kode di atas dan klik tombol <strong>Simpan</strong> (ikon disket / Ctrl + S).
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'var(--bg-surface-subtle)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.84rem'
                }}
              >
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    flexShrink: 0
                  }}
                >
                  3
                </span>
                <div>
                  <strong>Terapkan Sebagai Aplikasi Web:</strong>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '2px' }}>
                    Klik tombol biru <code>Deploy</code> &gt; <code>New deployment</code>. Pilih jenis{' '}
                    <strong>Web app</strong>, ubah <em>Who has access</em> menjadi:{' '}
                    <strong>Anyone (Siapa saja)</strong>, lalu klik <strong>Deploy</strong>. Salin URL yang dihasilkan dan tempelkan di bawah.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Input URL Apps Script */}
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-color)'
            }}
          >
            <label
              style={{
                display: 'block',
                fontSize: '0.84rem',
                fontWeight: 700,
                marginBottom: '8px'
              }}
            >
              Tempelkan URL Google Apps Script Web App:
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setTestResult(null);
                }}
                className="input-field"
                style={{
                  flex: '1 1 260px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-surface-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: '0.84rem'
                }}
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="btn btn-secondary btn-sm"
                style={{ padding: '8px 14px' }}
              >
                <RefreshCw size={14} className={isTesting ? 'spin' : ''} />
                <span>{isTesting ? 'Menguji...' : 'Uji Koneksi'}</span>
              </button>
            </div>

            {/* Test Connection Status Feedback */}
            {testResult && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: testResult.success
                    ? 'var(--accent-emerald-light)'
                    : 'rgba(239, 68, 68, 0.1)',
                  color: testResult.success ? 'var(--status-hadir)' : 'var(--status-alpa)',
                  border: testResult.success
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid rgba(239, 68, 68, 0.3)'
                }}
              >
                {testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Buttons */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface-subtle)'
          }}
        >
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
            Tutup
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn btn-primary btn-sm"
            style={{ padding: '8px 18px', fontWeight: 700 }}
          >
            <Check size={15} />
            <span>Simpan Pengaturan Sinkronisasi</span>
          </button>
        </div>
      </div>
    </div>
  );
}
