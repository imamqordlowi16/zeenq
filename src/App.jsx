import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import AttendanceView from './components/AttendanceView';
import RekapView from './components/RekapView';
import MutasiView from './components/MutasiView';
import SheetConfigModal from './components/SheetConfigModal';
import StudentDetailModal from './components/StudentDetailModal';
import PrintReportModal from './components/PrintReportModal';
import QuickTextInputModal from './components/QuickTextInputModal';
import GoogleScriptSetupModal from './components/GoogleScriptSetupModal';
import GoogleAuthModal from './components/GoogleAuthModal';
import { getStoredGoogleSession, clearGoogleSession } from './services/googleAuthService';
import { appendMonthToGoogleSheet, deleteCorruptedUpperRows, fetchLiveSheetValues, fixSemester2Spreadsheet } from './services/googleSheetsApiService';
import confetti from 'canvas-confetti';
import {
  getSavedConfig,
  saveConfig,
  getPresets,
  savePreset,
  deletePreset,
  fetchSheetCSV,
  syncAddMonthToSheet,
  syncAttendanceMarkToSheet,
  DEFAULT_CONFIG
} from './services/sheetsService';
import {
  parseAttendanceSheet,
  parseRekapSheet,
  parseMutasiSheet
} from './services/sheetParser';
import {
  LayoutDashboard,
  CalendarCheck,
  FileSpreadsheet,
  Users,
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
  Zap,
  CheckCircle2,
  X
} from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [sheetConfig, setSheetConfig] = useState(() => {
    const cfg = getSavedConfig();
    const savedUrl = localStorage.getItem(`zeenq_script_url_${cfg.id}`) || '';
    return { ...cfg, scriptUrl: savedUrl };
  });
  const [presets, setPresets] = useState(getPresets);

  // Loaded Data States
  const [attendanceData, setAttendanceData] = useState(null);
  const [rekapData, setRekapData] = useState(null);
  const [mutasiData, setMutasiData] = useState(null);

  // UI States
  const [selectedMonth, setSelectedMonth] = useState('januari');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [syncToast, setSyncToast] = useState(null);

  // Modals
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isQuickTextOpen, setIsQuickTextOpen] = useState(false);
  const [isScriptSetupOpen, setIsScriptSetupOpen] = useState(false);
  const [isGoogleAuthOpen, setIsGoogleAuthOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Google OAuth Session State
  const [googleSession, setGoogleSession] = useState(getStoredGoogleSession);
  const googleUser = googleSession?.user || null;
  const googleToken = googleSession?.token || null;

  // Theme State (Dark / Light)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('zeenq_theme') === 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('zeenq_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  // Helper to persist master data to local storage and silent background file
  const persistAttendance = (updatedAttendance, rekap = rekapData, mutasi = mutasiData) => {
    try {
      localStorage.setItem(`zeenq_master_data_${sheetConfig.id}`, JSON.stringify(updatedAttendance));
      // Silent auto-save to computer's hard drive via Vite middleware
      fetch('/api/auto-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendanceData: updatedAttendance,
          rekapData: rekap,
          mutasiData: mutasi
        })
      }).catch(() => {});
    } catch (err) {
      console.warn('Persistence save error:', err);
    }
  };

  // Main data loader function
  const loadSheetData = useCallback(
    async (config = sheetConfig, forceRefresh = false) => {
      setIsLoading(true);
      setIsRefreshing(true);
      setFetchError(null);

      const masterKey = `zeenq_master_data_${config.id}`;

      // 1. If not forcing a full refresh, check if persistent local data exists
      if (!forceRefresh) {
        const savedMaster = localStorage.getItem(masterKey);
        if (savedMaster) {
          try {
            const parsed = JSON.parse(savedMaster);
            if (parsed && parsed.months && parsed.months.length > 0) {
              setAttendanceData(parsed);
              setIsFromCache(true);
              setSelectedMonth((prev) => {
                const exists = parsed.months.some((m) => m.id === prev);
                return exists ? prev : parsed.months[0].id;
              });

              // Load cached secondary tabs
              const savedRekap = localStorage.getItem(`zeenq_rekap_${config.id}`);
              if (savedRekap) setRekapData(JSON.parse(savedRekap));
              const savedMutasi = localStorage.getItem(`zeenq_mutasi_${config.id}`);
              if (savedMutasi) setMutasiData(JSON.parse(savedMutasi));

              setIsLoading(false);
              setIsRefreshing(false);
              return;
            }
          } catch (e) {
            console.warn('Could not parse local master data:', e);
          }
        }
      }

      // 2. Fetch baseline data from spreadsheet link
      try {
        let csvText = '';
        let fromCache = false;

        // Jika login Google aktif, coba ambil data live resmi via Google Sheets API
        if (googleToken) {
          try {
            const liveRows = await fetchLiveSheetValues(config.id, 'ABSENSI', googleToken);
            if (liveRows && liveRows.length > 5) {
              csvText = liveRows
                .map((row) => row.map((c) => `"${String(c || '').replace(/"/g, '""')}"`).join(','))
                .join('\n');
            }
          } catch (liveErr) {
            console.warn('Live Google Sheets API fetch warning, fallback to CSV:', liveErr);
          }
        }

        if (!csvText) {
          const mainRes = await fetchSheetCSV(config.id, config.gid || '0');
          csvText = mainRes.csvText;
          fromCache = mainRes.fromCache;
        }

        setIsFromCache(fromCache);
        const parsedAttendance = parseAttendanceSheet(csvText, config.title || '');

        // Pertahankan bulan yang baru ditambahkan jika belum masuk ke file online
        setAttendanceData((prev) => {
          if (!prev || !prev.months || prev.months.length === 0) {
            localStorage.setItem(masterKey, JSON.stringify(parsedAttendance));
            return parsedAttendance;
          }
          const mergedMonths = [...(parsedAttendance.months || [])];
          prev.months.forEach((oldM) => {
            if (!mergedMonths.some((m) => m.id === oldM.id)) {
              mergedMonths.push(oldM);
            }
          });
          const merged = { ...parsedAttendance, months: mergedMonths };
          localStorage.setItem(masterKey, JSON.stringify(merged));
          return merged;
        });

        if (parsedAttendance.months && parsedAttendance.months.length > 0) {
          setSelectedMonth((prev) => {
            const exists = parsedAttendance.months.some((m) => m.id === prev);
            return exists ? prev : parsedAttendance.months[0].id;
          });
        }

        // Fetch REKAP sheet
        try {
          const rekapGid = config.id === DEFAULT_CONFIG.id ? '490778033' : '490778033';
          const rekapRes = await fetchSheetCSV(config.id, rekapGid);
          const parsedRekap = parseRekapSheet(rekapRes.csvText);
          setRekapData(parsedRekap);
          localStorage.setItem(`zeenq_rekap_${config.id}`, JSON.stringify(parsedRekap));
        } catch (rekapErr) {
          console.warn('Could not fetch secondary rekap tab:', rekapErr);
        }

        // Fetch MUTASI sheet
        try {
          const mutasiGid = config.id === DEFAULT_CONFIG.id ? '1395406134' : '1395406134';
          const mutasiRes = await fetchSheetCSV(config.id, mutasiGid);
          const parsedMutasi = parseMutasiSheet(mutasiRes.csvText);
          setMutasiData(parsedMutasi);
          localStorage.setItem(`zeenq_mutasi_${config.id}`, JSON.stringify(parsedMutasi));
        } catch (mutasiErr) {
          console.warn('Could not fetch secondary mutasi tab:', mutasiErr);
        }

        // Auto-save baseline to local disk
        persistAttendance(parsedAttendance);
      } catch (err) {
        console.error('Error loading sheet:', err);
        setFetchError(err.message || 'Gagal memuat data spreadsheet.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [sheetConfig]
  );

  // Initial load
  useEffect(() => {
    loadSheetData(sheetConfig);
  }, []);

  // Save new configuration when teacher pastes a new link
  const handleSaveConfig = (newConfig) => {
    saveConfig(newConfig);
    const savedUrl = localStorage.getItem(`zeenq_script_url_${newConfig.id}`) || '';
    const configWithScript = { ...newConfig, scriptUrl: savedUrl };
    setSheetConfig(configWithScript);
    loadSheetData(configWithScript, true);
  };

  // Google OAuth Login & Logout Handlers
  const handleLoginSuccess = (user, token) => {
    setGoogleSession({ user, token });
    setSyncToast({
      type: 'success',
      title: 'Akun Google Terhubung!',
      message: `Berhasil terhubung sebagai ${user.name || user.email}. Setiap tambah bulan dan absen akan langsung tersimpan di Google Drive.`
    });
    setTimeout(() => setSyncToast(null), 5000);
  };

  const handleLogoutGoogle = () => {
    clearGoogleSession();
    setGoogleSession(null);
    setSyncToast({
      type: 'info',
      title: 'Koneksi Google Diputus',
      message: 'Sinkronisasi online dinonaktifkan. Data tetap tersimpan aman di ZeenQ.'
    });
    setTimeout(() => setSyncToast(null), 4000);
  };

  // Save Google Apps Script Webhook URL for direct cloud sync
  const handleSaveScriptUrl = (url) => {
    try {
      localStorage.setItem(`zeenq_script_url_${sheetConfig.id}`, url);
    } catch (err) {
      console.warn('Failed saving scriptUrl:', err);
    }
    setSheetConfig((prev) => ({ ...prev, scriptUrl: url }));
    setSyncToast({
      type: 'success',
      title: 'Google Sheets Berhasil Terhubung!',
      message: url
        ? 'Sekarang setiap penambahan bulan akan otomatis langsung muncul di Google Spreadsheet Anda!'
        : 'Sinkronisasi online dinonaktifkan.'
    });
    setTimeout(() => setSyncToast(null), 5000);
  };

  // Preset management
  const handleSavePreset = (preset) => {
    const updated = savePreset(preset);
    setPresets(updated);
  };

  const handleDeletePreset = (id) => {
    const updated = deletePreset(id);
    setPresets(updated);
  };

  const handleSelectPreset = (preset) => {
    const newCfg = {
      id: preset.sheetId,
      gid: preset.gid,
      title: preset.name,
      url: preset.url
    };
    handleSaveConfig(newCfg);
    setIsConfigOpen(false);
  };

  const [isCleaning, setIsCleaning] = useState(false);

  const handleCleanUpperRows = async () => {
    if (!googleToken) return;
    if (
      !window.confirm(
        'Rapikan tabel dan urutan bulan Semester 2 di Google Sheets?\n\nSistem akan membersihkan tabel percobaan lama sehingga tabel resmi Januari naik ke urutan pertama paling atas, dan urutan bulan selanjutnya (Februari, Maret, dst) akan rapi otomatis.'
      )
    ) {
      return;
    }

    setIsCleaning(true);
    setSyncToast({
      type: 'loading',
      title: 'Merapikan Google Sheets...',
      message: 'Menyesuaikan urutan bulan & membersihkan tabel percobaan di spreadsheet Anda...'
    });

    try {
      const res = await fixSemester2Spreadsheet(sheetConfig.id, googleToken);
      setSyncToast({
        type: 'success',
        title: 'Berhasil Dirapikan!',
        message: res.message || 'Urutan bulan berhasil dirapikan! Tabel resmi Januari sekarang berada di paling atas.'
      });
      setTimeout(() => setSyncToast(null), 7000);
      await loadSheetData(sheetConfig, true);
    } catch (err) {
      setSyncToast({
        type: 'error',
        title: 'Gagal Merapikan Baris',
        message: err.message || 'Terjadi kesalahan saat merapikan baris di Google Sheets.'
      });
      setTimeout(() => setSyncToast(null), 8000);
    } finally {
      setIsCleaning(false);
    }
  };

  // Real-time Attendance Mark Updater
  const handleUpdateAttendance = (monthId, studentNo, dayNum, newMark) => {
    if (!attendanceData) return;

    setAttendanceData((prev) => {
      const newMonths = prev.months.map((m) => {
        if (m.id !== monthId) return m;

        const updatedStudents = m.students.map((s) => {
          if (s.no !== studentNo) return s;

          const updatedDays = { ...s.days, [dayNum]: newMark };

          let h = 0,
            sk = 0,
            iz = 0,
            al = 0;
          m.dayNumbers.forEach((d) => {
            const mark = updatedDays[d];
            if (mark === '.') h++;
            else if (mark === 'S') sk++;
            else if (mark === 'I') iz++;
            else if (mark === 'A') al++;
          });

          const effective = h + sk + iz + al;
          const rate = effective > 0 ? Math.round((h / effective) * 100) : 100;

          return {
            ...s,
            days: updatedDays,
            hadir: h,
            sakit: sk,
            izin: iz,
            alpa: al,
            effectiveDays: effective,
            attendanceRate: rate
          };
        });

        let totH = 0,
          totS = 0,
          totI = 0,
          totA = 0;
        updatedStudents.forEach((s) => {
          totH += s.hadir;
          totS += s.sakit;
          totI += s.izin;
          totA += s.alpa;
        });

        const totalActive = totH + totS + totI + totA;
        const overallRate = totalActive > 0 ? ((totH / totalActive) * 100).toFixed(1) : '100.0';

        return {
          ...m,
          students: updatedStudents,
          stats: {
            ...m.stats,
            totalHadir: totH,
            totalSakit: totS,
            totalIzin: totI,
            totalAlpa: totA,
            effectiveAttendanceRate: overallRate + '%'
          }
        };
      });

      const updated = {
        ...prev,
        months: newMonths
      };

      persistAttendance(updated);

      // Cloud sync to Google Sheets if connected
      if (sheetConfig.scriptUrl) {
        const monthObj = attendanceData.months.find((m) => m.id === monthId);
        const studentObj = monthObj?.students?.find((s) => s.no === studentNo);
        if (monthObj && studentObj) {
          syncAttendanceMarkToSheet(sheetConfig.scriptUrl, {
            monthName: monthObj.name,
            studentName: studentObj.name,
            studentNo: studentNo,
            dayNum: dayNum,
            day: dayNum,
            mark: newMark
          }).catch((err) => console.warn('Cloud sync error:', err));
        }
      }

      return updated;
    });
  };

  // Add a new custom month dynamically (100% Instant & Permanent + Cloud Sync)
  const handleAddMonth = ({ name, totalDays = 30, year = 2026, initialAttendance = 'empty' }) => {
    if (!attendanceData) return;

    const baseStudents =
      attendanceData.months[0]?.students ||
      attendanceData.allStudents ||
      [];

    const dayNumbers = Array.from({ length: totalDays }, (_, i) => i + 1);
    const newMonthId = `custom-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;

    const newStudents = baseStudents.map((s, idx) => {
      const days = {};
      dayNumbers.forEach((d) => {
        days[d] = initialAttendance === 'hadir' ? '.' : '';
      });

      const hadirCount = initialAttendance === 'hadir' ? totalDays : 0;
      const effective = hadirCount;
      const rate = 100;

      return {
        no: s.no || idx + 1,
        name: s.name,
        days,
        sakit: 0,
        izin: 0,
        alpa: 0,
        hadir: hadirCount,
        effectiveDays: effective,
        attendanceRate: rate
      };
    });

    const newMonth = {
      id: newMonthId,
      name: name.toUpperCase(),
      monthOrder: (attendanceData.months.length || 0) + 1,
      students: newStudents,
      totalStudents: newStudents.length,
      dayNumbers,
      isCustom: true,
      dailySummary: {},
      stats: {
        totalHadir: initialAttendance === 'hadir' ? newStudents.length * totalDays : 0,
        totalSakit: 0,
        totalIzin: 0,
        totalAlpa: 0,
        overallRate: '100.0',
        effectiveAttendanceRate: '100%'
      },
      signatures: attendanceData.months[0]?.signatures || {
        dateString: `${totalDays} ${name} ${year}`,
        kepalaSekolah: 'Venez Wella, M.Pd',
        nipKepala: '19820129014122002',
        guruKelas: 'Jeni oktaviani, S.Pd',
        nipGuru: '199610182022212009'
      }
    };

    setAttendanceData((prev) => {
      const isSem2 = prev.isSemester2 !== false;
      const order = isSem2
        ? ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER']
        : ['JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER', 'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI'];

      // Sort strictly according to calendar sequence
      const updatedList = [...prev.months, newMonth];
      updatedList.sort((a, b) => {
        const idxA = order.indexOf(a.name.toUpperCase());
        const idxB = order.indexOf(b.name.toUpperCase());
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return (a.monthOrder || 0) - (b.monthOrder || 0);
      });

      const updated = { ...prev, months: updatedList };
      persistAttendance(updated);
      return updated;
    });

    setSelectedMonth(newMonthId);

    // Celebratory effect
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch {
      // ignore
    }

    // Cloud sync to Google Sheets (Official OAuth API or Apps Script Webhook)
    if (googleToken) {
      setSyncToast({
        type: 'loading',
        title: 'Mengirim ke Google Spreadsheet...',
        message: `Menambahkan tabel bulan ${name.toUpperCase()} langsung ke Google Drive Anda.`
      });
      appendMonthToGoogleSheet(
        sheetConfig.id,
        {
          monthName: name.toUpperCase(),
          totalDays,
          year,
          students: newStudents.map((s) => ({ no: s.no, name: s.name }))
        },
        googleToken
      )
        .then((res) => {
          if (res.converted && res.newSpreadsheetId) {
            const updatedConfig = {
              ...sheetConfig,
              id: res.newSpreadsheetId,
              url: res.newSpreadsheetUrl || `https://docs.google.com/spreadsheets/d/${res.newSpreadsheetId}/edit`
            };
            saveConfig(updatedConfig);
            setSheetConfig(updatedConfig);
          }
          setSyncToast({
            type: 'success',
            title: `Bulan ${name.toUpperCase()} Tersimpan di Google Sheets!`,
            message: res.converted
              ? 'File Excel otomatis dikonversi menjadi Google Spreadsheet murni & bulan baru tersimpan!'
              : 'Tabel bulan baru otomatis terbit di file Google Sheets Anda di Google Drive.'
          });
          setTimeout(() => setSyncToast(null), 7000);
        })
        .catch((err) => {
          if (err.code === 'TOKEN_EXPIRED' || err.message?.includes('invalid authentication credentials') || err.message?.includes('401')) {
            clearGoogleSession();
            setGoogleSession(null);
            setIsGoogleAuthOpen(true);
            setSyncToast({
              type: 'warning',
              title: 'Sesi Google Kedaluwarsa',
              message: 'Token login Google Anda telah kedaluwarsa. Silakan login ulang via popup yang terbuka.'
            });
            setTimeout(() => setSyncToast(null), 8000);
            return;
          }

          let errorMsg = err.message || 'Gagal mengirim data ke Google Sheets API.';
          if (errorMsg.toLowerCase().includes('not supported') || errorMsg.includes('FAILED_PRECONDITION')) {
            errorMsg = 'File di Google Drive masih berformat Excel (.XLSX). Silakan buka file tersebut di browser lalu klik menu Berkas/File > "Simpan sebagai Google Spreadsheet".';
          }
          setSyncToast({
            type: 'error',
            title: 'Gagal Menyinkron ke Google Sheets',
            message: errorMsg
          });
          setTimeout(() => setSyncToast(null), 9000);
        });
    } else if (sheetConfig.scriptUrl) {
      setSyncToast({
        type: 'loading',
        title: 'Mengirim ke Google Spreadsheet...',
        message: `Menambahkan tabel bulan ${name.toUpperCase()} langsung ke Google Drive Anda.`
      });
      syncAddMonthToSheet(sheetConfig.scriptUrl, {
        spreadsheetId: sheetConfig.id,
        monthName: name.toUpperCase(),
        totalDays,
        year,
        initialAttendance,
        students: newStudents.map((s) => ({ no: s.no, name: s.name })),
        signatures: newMonth.signatures
      })
        .then((res) => {
          if (res.success) {
            setSyncToast({
              type: 'success',
              title: `Bulan ${name.toUpperCase()} Masuk ke Google Sheets!`,
              message: 'Tabel bulan baru otomatis terbit di file Google Sheets Anda di Google Drive.'
            });
          } else {
            setSyncToast({
              type: 'error',
              title: 'Gagal Menyinkron ke Google Sheets',
              message: res.message || 'Periksa kembali URL Web App Apps Script Anda.'
            });
          }
          setTimeout(() => setSyncToast(null), 6000);
        })
        .catch((err) => {
          setSyncToast({
            type: 'error',
            title: 'Gagal Menyinkron ke Google Sheets',
            message: err.message
          });
          setTimeout(() => setSyncToast(null), 6000);
        });
    } else {
      setSyncToast({
        type: 'warning',
        title: `Bulan ${name.toUpperCase()} Ditambahkan (Belum Konek Google)`,
        message: `Tabel bulan baru sudah aktif di aplikasi. Agar data otomatis masuk ke Google Spreadsheet online, silakan klik tombol biru [Hubungkan Google] di pojok kanan atas.`
      });
      setTimeout(() => setSyncToast(null), 6000);
    }
  };

  // Delete a custom added month
  const handleDeleteMonth = (monthId) => {
    setAttendanceData((prev) => {
      const updatedMonths = prev.months.filter((m) => m.id !== monthId);
      const updated = { ...prev, months: updatedMonths };
      persistAttendance(updated);
      return updated;
    });

    setSelectedMonth((prevId) => {
      if (prevId === monthId) {
        return attendanceData.months.find((m) => m.id !== monthId)?.id || '';
      }
      return prevId;
    });
  };

  const activeMonthData =
    attendanceData?.months?.find((m) => m.id === selectedMonth) ||
    attendanceData?.months?.[0];

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        sheetConfig={sheetConfig}
        isRefreshing={isRefreshing}
        onRefresh={() => loadSheetData(sheetConfig, true)}
        onOpenConfig={() => setIsConfigOpen(true)}
        onOpenPrint={() => setIsPrintOpen(true)}
        googleUser={googleUser}
        onOpenGoogleAuth={() => setIsGoogleAuthOpen(true)}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        isFromCache={isFromCache}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {/* Success / Notification Toast */}
        {syncToast && (
          <div
            className="glass-panel"
            style={{
              padding: '14px 18px',
              borderRadius: '12px',
              borderLeft: '4px solid var(--accent-emerald)',
              background: 'var(--bg-secondary)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              boxShadow: 'var(--shadow-md)',
              animation: 'fadeIn 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={20} style={{ color: 'var(--accent-emerald)' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                  {syncToast.title}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {syncToast.message}
                </div>
              </div>
            </div>
            <button
              className="btn-icon"
              onClick={() => setSyncToast(null)}
              style={{ width: '28px', height: '28px' }}
              title="Tutup"
            >
              ✕
            </button>
          </div>
        )}

        {/* Error Alert Banner */}
        {fetchError && (
          <div
            className="glass-panel"
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              borderLeft: '4px solid var(--accent-rose)',
              background: 'var(--status-alpa-bg)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={22} style={{ color: 'var(--accent-rose)' }} />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--accent-rose)' }}>
                  Pemberitahuan Sinkronisasi Spreadsheet
                </div>
                <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                  {fetchError}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setIsConfigOpen(true)}
              >
                <SlidersHorizontal size={14} />
                <span>Cek Link Spreadsheet</span>
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => loadSheetData(sheetConfig, true)}
              >
                <RefreshCw size={14} />
                <span>Muat Ulang</span>
              </button>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && !attendanceData ? (
          <div
            className="glass-panel"
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px'
            }}
          >
            <div className="brand-icon spin-anim" style={{ width: '48px', height: '48px' }}>
              Z
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              Memuat Sistem Presensi ZeenQ...
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '400px' }}>
              Mengambil daftar hadir siswa dan menyiapkan lembar presensi otomatis.
            </p>
          </div>
        ) : (
          <>
            {/* View Switcher */}
            {currentView === 'dashboard' && (
              <DashboardView
                attendanceData={attendanceData}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                onOpenPrint={() => setIsPrintOpen(true)}
                onSelectStudent={(s) => setSelectedStudent(s)}
                onOpenQuickText={() => setIsQuickTextOpen(true)}
              />
            )}

            {currentView === 'attendance' && (
              <AttendanceView
                attendanceData={attendanceData}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                onSelectStudent={(s) => setSelectedStudent(s)}
                onUpdateAttendance={handleUpdateAttendance}
                onOpenQuickText={() => setIsQuickTextOpen(true)}
                onAddMonth={handleAddMonth}
                onDeleteMonth={handleDeleteMonth}
                onFixSemester2={handleCleanUpperRows}
              />
            )}

            {currentView === 'rekap' && (
              <RekapView rekapData={rekapData} isLoading={isLoading} />
            )}

            {currentView === 'mutasi' && (
              <MutasiView mutasiData={mutasiData} isLoading={isLoading} />
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav no-print" aria-label="Navigasi Bawah">
        <button
          className={`mobile-nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentView('dashboard')}
        >
          <LayoutDashboard size={20} />
          <span>Ringkasan</span>
        </button>
        <button
          className={`mobile-nav-btn ${currentView === 'attendance' ? 'active' : ''}`}
          onClick={() => setCurrentView('attendance')}
        >
          <CalendarCheck size={20} />
          <span>Presensi</span>
        </button>
        <button
          className={`mobile-nav-btn ${currentView === 'rekap' ? 'active' : ''}`}
          onClick={() => setCurrentView('rekap')}
        >
          <FileSpreadsheet size={20} />
          <span>Rekap</span>
        </button>
        <button
          className={`mobile-nav-btn ${currentView === 'mutasi' ? 'active' : ''}`}
          onClick={() => setCurrentView('mutasi')}
        >
          <Users size={20} />
          <span>Data Siswa</span>
        </button>
      </nav>

      {/* Modals */}
      <SheetConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        currentConfig={sheetConfig}
        onSaveConfig={handleSaveConfig}
        presets={presets}
        onSavePreset={handleSavePreset}
        onDeletePreset={handleDeletePreset}
        onSelectPreset={handleSelectPreset}
      />

      <StudentDetailModal
        student={selectedStudent}
        monthName={activeMonthData?.name || 'Bulan'}
        signatures={activeMonthData?.signatures}
        onClose={() => setSelectedStudent(null)}
      />

      <PrintReportModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        monthData={activeMonthData}
        sheetTitle={sheetConfig.title}
      />

      <QuickTextInputModal
        isOpen={isQuickTextOpen}
        onClose={() => setIsQuickTextOpen(false)}
        currentMonth={activeMonthData}
        onApplyAttendance={handleUpdateAttendance}
      />

      <GoogleAuthModal
        isOpen={isGoogleAuthOpen}
        onClose={() => setIsGoogleAuthOpen(false)}
        googleUser={googleUser}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogoutGoogle}
        onCleanUpperRows={handleCleanUpperRows}
        isCleaning={isCleaning}
      />

      {/* Toast Notifikasi Status Sinkronisasi Google Sheets */}
      {syncToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            minWidth: '320px',
            maxWidth: '430px',
            padding: '14px 18px',
            borderRadius: '12px',
            background:
              syncToast.type === 'error'
                ? 'var(--status-alpa-bg)'
                : syncToast.type === 'warning'
                ? '#FEF3C7'
                : 'var(--bg-surface)',
            border: `1px solid ${
              syncToast.type === 'error'
                ? 'var(--status-alpa)'
                : syncToast.type === 'warning'
                ? '#F59E0B'
                : 'var(--accent-emerald)'
            }`,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}
        >
          {syncToast.type === 'loading' ? (
            <RefreshCw size={20} className="spin-anim" style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
          ) : syncToast.type === 'error' ? (
            <AlertCircle size={20} style={{ color: 'var(--status-alpa)', flexShrink: 0, marginTop: '2px' }} />
          ) : syncToast.type === 'warning' ? (
            <AlertCircle size={20} style={{ color: '#F59E0B', flexShrink: 0, marginTop: '2px' }} />
          ) : (
            <CheckCircle2 size={20} style={{ color: 'var(--accent-emerald)', flexShrink: 0, marginTop: '2px' }} />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '2px', color: 'var(--text-main)' }}>
              {syncToast.title}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              {syncToast.message}
            </div>
          </div>
          <button
            onClick={() => setSyncToast(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
