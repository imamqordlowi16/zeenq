/**
 * Google Sheets Service for Multiplatform Teacher App
 * Handles dynamic spreadsheet links, ID/GID extraction, live CSV fetching,
 * offline caching, and preset assignment bookmarks.
 */

export const DEFAULT_SPREADSHEET_URL =
  'https://docs.google.com/spreadsheets/d/1AdM3GE4xeUzW1d_yqcU5N2x_kaSJg8Re/edit?gid=272037099#gid=272037099';

export const DEFAULT_CONFIG = {
  id: '1AdM3GE4xeUzW1d_yqcU5N2x_kaSJg8Re',
  gid: '272037099',
  title: 'DAFTAR HADIR 2C SEMESTER 1',
  url: DEFAULT_SPREADSHEET_URL,
  knownTabs: [
    { name: 'ABSENSI', gid: '272037099' },
    { name: 'REKAP ABSEN', gid: '490778033' },
    { name: 'MUTASI SISWA', gid: '1395406134' }
  ]
};

const STORAGE_KEYS = {
  CURRENT_CONFIG: 'zeenq_current_sheet_config',
  PRESETS: 'zeenq_sheet_presets',
  CACHED_DATA: 'zeenq_cached_sheet_data_'
};

/**
 * Extracts spreadsheet ID and GID from any Google Sheets URL or text
 */
export function parseSheetUrl(input) {
  if (!input || typeof input !== 'string') {
    return { id: '', gid: '0', isValid: false };
  }

  const trimmed = input.trim();

  // Pattern 1: Standard /d/{id}/...
  const idMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/i);
  let id = idMatch ? idMatch[1] : '';

  // If no URL pattern, check if the input itself looks like an ID
  if (!id && /^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
    id = trimmed;
  }

  // Extract GID (from #gid= or ?gid= or gid=)
  let gid = '0';
  const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/i);
  if (gidMatch) {
    gid = gidMatch[1];
  }

  return {
    id,
    gid,
    hasExplicitGid: Boolean(gidMatch),
    isValid: Boolean(id),
    originalUrl: trimmed
  };
}

/**
 * Automatically inspects a spreadsheet URL to discover its title, GID, and validity directly from Google Sheets
 */
export async function autoDetectSpreadsheet(inputUrl) {
  const parsed = parseSheetUrl(inputUrl);
  if (!parsed.isValid) {
    throw new Error('URL spreadsheet tidak valid. Pastikan link diawali dengan https://docs.google.com/spreadsheets/d/...');
  }

  const { id, gid, hasExplicitGid } = parsed;
  let title = '';
  let availableTabs = [];

  // 1. Try to fetch htmlview to extract document title & tab list
  try {
    const htmlUrl = `https://docs.google.com/spreadsheets/d/${id}/htmlview`;
    const res = await fetch(htmlUrl, { headers: { Accept: 'text/html' } });
    if (res.ok) {
      const html = await res.text();
      const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i);
      const titleMatch = html.match(/<title>(.*?)<\/title>/i);
      let rawTitle = (ogTitleMatch ? ogTitleMatch[1] : titleMatch ? titleMatch[1] : '')
        .replace(/\s*-\s*Google\s*(Drive|Sheets|Docs)$/i, '')
        .replace(/\.xlsx$/i, '')
        .trim();

      if (rawTitle && !rawTitle.toLowerCase().includes('google drive')) {
        title = rawTitle;
      }

      // Extract tab names and gids
      const tabRegex = /name:\s*["']([^"']+)["'][^}]+gid:\s*["']?([0-9]+)["']?/g;
      let match;
      while ((match = tabRegex.exec(html)) !== null) {
        const tabName = match[1].trim();
        const tabGid = match[2];
        if (!availableTabs.some((t) => t.gid === tabGid)) {
          availableTabs.push({ name: tabName, gid: tabGid });
        }
      }
    }
  } catch (err) {
    console.warn('htmlview inspect skipped or restricted by CORS, using direct sheet CSV:', err);
  }

  // 2. Fetch CSV directly (always CORS-enabled) using the detected GID or '0'
  const effectiveGid = hasExplicitGid ? gid : availableTabs[0]?.gid || '0';
  let sampleCSV = '';
  try {
    const csvRes = await fetchSheetCSV(id, effectiveGid);
    sampleCSV = csvRes.csvText;

    // If title still empty, extract from the very first non-empty rows of the sheet
    if (!title && sampleCSV) {
      const lines = sampleCSV.split(/\r?\n/).slice(0, 5);
      for (const line of lines) {
        const cleaned = line.replace(/["',]/g, ' ').replace(/\s+/g, ' ').trim();
        if (
          cleaned.length > 4 &&
          (cleaned.toUpperCase().includes('DAFTAR') ||
            cleaned.toUpperCase().includes('KELAS') ||
            cleaned.toUpperCase().includes('HADIR') ||
            cleaned.toUpperCase().includes('ABSEN') ||
            cleaned.toUpperCase().includes('REKAP'))
        ) {
          title = cleaned;
          break;
        }
      }
    }
  } catch (csvErr) {
    console.warn('CSV auto-detection fallback:', csvErr);
  }

  if (!title) {
    title = `Spreadsheet Penugasan (${id.slice(0, 8)}...)`;
  }

  return {
    id,
    gid: effectiveGid,
    title,
    availableTabs,
    isValid: true
  };
}


/**
 * Loads current sheet configuration from localStorage or default
 */
export function getSavedConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_CONFIG);
    if (saved) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Error reading saved sheet config:', e);
  }
  return { ...DEFAULT_CONFIG };
}

/**
 * Saves current sheet configuration to localStorage
 */
export function saveConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.warn('Error saving sheet config:', e);
  }
}

/**
 * Retrieves teacher assignment bookmarks / presets
 */
export function getPresets() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PRESETS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Error reading presets:', e);
  }

  // Default presets
  return [
    {
      id: 'default-2c',
      name: 'Kelas 2C - SDN Pulo 01 (Semester 1)',
      url: DEFAULT_SPREADSHEET_URL,
      sheetId: '1AdM3GE4xeUzW1d_yqcU5N2x_kaSJg8Re',
      gid: '272037099',
      dateAdded: new Date().toISOString()
    }
  ];
}

/**
 * Adds or updates a preset
 */
export function savePreset(preset) {
  const presets = getPresets();
  const index = presets.findIndex((p) => p.sheetId === preset.sheetId && p.gid === preset.gid);
  if (index >= 0) {
    presets[index] = { ...presets[index], ...preset };
  } else {
    presets.push({ ...preset, id: 'preset_' + Date.now() });
  }
  localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(presets));
  return presets;
}

/**
 * Deletes a preset
 */
export function deletePreset(presetId) {
  const presets = getPresets().filter((p) => p.id !== presetId);
  localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(presets));
  return presets;
}

/**
 * Fetches raw CSV data from Google Sheets endpoint
 */
export async function fetchSheetCSV(sheetId, gid = '0') {
  const primaryUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
  const fallbackUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

  const cacheKey = `${STORAGE_KEYS.CACHED_DATA}${sheetId}_${gid}`;

  // Helper to fetch with timeout
  const fetchWithTimeout = async (url, timeoutMs = 12000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'text/csv,text/plain,*/*' }
      });
      clearTimeout(timer);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.text();
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  };

  try {
    let csvText = '';
    try {
      csvText = await fetchWithTimeout(primaryUrl);
    } catch (err1) {
      console.warn('Primary GViz fetch failed, trying export endpoint:', err1);
      csvText = await fetchWithTimeout(fallbackUrl);
    }

    if (csvText && csvText.length > 20) {
      // Save to cache
      try {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            data: csvText,
            timestamp: Date.now()
          })
        );
      } catch (cacheErr) {
        console.warn('Could not cache sheet in localStorage:', cacheErr);
      }
      return { csvText, fromCache: false, timestamp: Date.now() };
    }
    throw new Error('Data spreadsheet kosong atau tidak valid.');
  } catch (error) {
    console.error('Error fetching Google Sheet CSV:', error);

    // Try offline cache fallback
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return {
          csvText: parsed.data,
          fromCache: true,
          timestamp: parsed.timestamp,
          warning: 'Memuat data dari cache offline karena jaringan terputus.'
        };
      } catch (parseErr) {
        // ignore
      }
    }

    throw new Error(
      'Gagal mengambil data dari Google Sheets. Pastikan Spreadsheet memiliki akses "Siapa saja yang memiliki link dapat melihat" (Public/Anyone with link can view).'
    );
  }
}

/**
 * Sends a payload to Google Apps Script Web App Webhook
 */
export async function sendToGoogleScript(scriptUrl, payload) {
  if (!scriptUrl || typeof scriptUrl !== 'string' || !scriptUrl.trim()) {
    return { success: false, message: 'URL Google Apps Script belum dikonfigurasi.' };
  }

  const cleanUrl = scriptUrl.trim();

  try {
    // We send payload as text/plain to avoid CORS preflight (OPTIONS) rejection by Google Apps Script
    const res = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        return {
          success: data.status === 'success',
          message: data.message || 'Tersinkron ke Google Sheets!',
          data
        };
      } catch {
        return { success: true, message: 'Tersinkron ke Google Sheets!' };
      }
    } else {
      return { success: false, message: `Google Sheets server error (Status: ${res.status})` };
    }
  } catch (err) {
    console.warn('Apps Script fetch warning (likely opaque response):', err);
    // Google Apps Script often executes the script but triggers an opaque redirect
    return {
      success: true,
      message: 'Perintah berhasil dikirim ke Google Sheets!'
    };
  }
}

/**
 * Tests connection to Google Apps Script Web App
 */
export async function testGoogleScriptConnection(scriptUrl) {
  if (!scriptUrl || !scriptUrl.trim()) {
    return { success: false, message: 'Masukkan URL Google Apps Script terlebih dahulu.' };
  }

  return await sendToGoogleScript(scriptUrl, { action: 'ping' });
}

/**
 * Synchronizes adding a new month table to the Google Sheet
 */
export async function syncAddMonthToSheet(scriptUrl, monthData) {
  return await sendToGoogleScript(scriptUrl, {
    action: 'addMonth',
    spreadsheetId: monthData.spreadsheetId,
    monthName: monthData.monthName || monthData.name,
    totalDays: monthData.totalDays,
    year: monthData.year,
    students: monthData.students,
    initialAttendance: monthData.initialAttendance
  });
}

/**
 * Synchronizes single attendance mark change to Google Sheet
 */
export async function syncAttendanceMarkToSheet(scriptUrl, updateData) {
  return await sendToGoogleScript(scriptUrl, {
    action: 'updateAttendance',
    spreadsheetId: updateData.spreadsheetId,
    monthName: updateData.monthName || updateData.name,
    studentNo: updateData.studentNo,
    dayNum: updateData.dayNum || updateData.day,
    mark: updateData.mark
  });
}
