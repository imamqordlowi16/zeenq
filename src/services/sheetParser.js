/**
 * CSV and Google Sheet Structure Parser
 * Parses attendance, cumulative recapitulation, and student mutation rosters
 * with support for multi-month blocks and generic sheet structures.
 */

/**
 * Robust CSV string tokenizer supporting quotes, escaped quotes, commas, and newlines
 */
export function parseCSV(text) {
  if (!text || typeof text !== 'string') return [];

  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // handle CRLF
      }
      currentRow.push(currentVal.trim());
      if (currentRow.some((col) => col !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some((col) => col !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Standardizes attendance mark:
 * '.' or 'v' or 'H' -> Hadir
 * 'S' -> Sakit
 * 'I' -> Izin
 * 'A' -> Alpa
 */
export function normalizeAttendanceMark(val) {
  if (!val) return '';
  const trimmed = val.trim().toUpperCase();
  if (trimmed === '.' || trimmed === 'V' || trimmed === 'H' || trimmed === 'HADIR') return '.';
  if (trimmed === 'S' || trimmed === 'SAKIT') return 'S';
  if (trimmed === 'I' || trimmed === 'IZIN') return 'I';
  if (trimmed === 'A' || trimmed === 'ALPA') return 'A';
  return trimmed; // for holiday notes like "HUT 17 GUSTUS" or custom marks
}

/**
 * Parses the ABSENSI sheet containing monthly tables
 */
export function parseAttendanceSheet(csvText, docTitle = '') {
  const rawRows = parseCSV(csvText);
  if (!rawRows || rawRows.length === 0) {
    return { months: [], allStudents: [], rawRows: [] };
  }

  // 1. Detect semester from document title and first rows
  const headerContext = (docTitle + ' ' + rawRows.slice(0, 10).map((r) => r.join(' ')).join(' ')).toUpperCase();
  const isSemester2 =
    headerContext.includes('SEMESTER 2') ||
    headerContext.includes('SEMESTER II') ||
    headerContext.includes('SMT 2') ||
    headerContext.includes('SMT II') ||
    headerContext.includes('GENAP');

  const semester1Seq = ['JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];
  const semester2Seq = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI'];
  const defaultSeq = isSemester2 ? semester2Seq : semester1Seq;
  const monthNames = [
    'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
    'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
  ];

  // 2. Identify TRUE day header rows (must have "NAMA" and at least 15 numeric day columns)
  const headerRowIndices = [];
  for (let r = 0; r < rawRows.length; r++) {
    const row = rawRows[r];
    const isHeaderCandidate = row.some(
      (cell) => cell.toUpperCase().includes('NAMA SISWA') || cell.toUpperCase() === 'NAMA'
    );
    if (!isHeaderCandidate) continue;

    let dayCols = 0;
    for (const cell of row) {
      const num = parseInt(cell.trim(), 10);
      if (!isNaN(num) && num >= 1 && num <= 31) dayCols++;
    }

    // Must have at least 15 day numbers to be an attendance matrix header
    if (dayCols >= 15) {
      const prev = headerRowIndices[headerRowIndices.length - 1];
      if (prev === undefined || r - prev >= 15) {
        headerRowIndices.push(r);
      }
    }
  }

  // Fallback: if no row had >= 15 day numbers, fallback to standard rows with NAMA SISWA
  if (headerRowIndices.length === 0) {
    for (let r = 0; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (row.some((cell) => cell.toUpperCase().includes('NAMA SISWA') || cell.toUpperCase() === 'NAMA')) {
        const prev = headerRowIndices[headerRowIndices.length - 1];
        if (prev === undefined || r - prev >= 10) {
          headerRowIndices.push(r);
        }
      }
    }
  }

  // If no standard header found, fallback to generic parsing
  if (headerRowIndices.length === 0) {
    return parseGenericSheet(rawRows);
  }

  const months = [];
  const usedMonthNames = new Set();

  // Parse each month section
  headerRowIndices.forEach((headerIdx, sectionIndex) => {
    const headerRow = rawRows[headerIdx];
    
    // Next section index or end of sheet
    const nextHeaderIdx =
      sectionIndex + 1 < headerRowIndices.length
        ? headerRowIndices[sectionIndex + 1]
        : rawRows.length;

    // Look below the student rows for footer dates / signatures
    let signatureDate = '';
    let kepalaSekolah = '';
    let nipKepala = '';
    let guruKelas = '';
    let nipGuru = '';
    let detectedMonth = '';

    // 1. Check title rows directly above headerRow (e.g. "DAFTAR HADIR PESERTA DIDIK BULAN JULI...")
    // Exclude signature lines from the previous table
    for (let u = Math.max(0, headerIdx - 4); u < headerIdx; u++) {
      const lineStr = rawRows[u].join(' ');
      const isPreviousSignature =
        lineStr.includes('NIP.') ||
        lineStr.includes('Kepala Sekolah') ||
        lineStr.includes('Guru Kelas') ||
        lineStr.includes('Mengetahui');

      if (!isPreviousSignature) {
        const bulanMatch =
          lineStr.match(/\bBULAN\s*:\s*([A-Za-z]+)\b/i) ||
          lineStr.match(/\bBULAN\s+([A-Za-z]+)\b/i);

        if (bulanMatch) {
          const candidate = bulanMatch[1].toUpperCase();
          if (monthNames.includes(candidate) && !usedMonthNames.has(candidate)) {
            detectedMonth = candidate;
            break;
          }
        }
        for (const m of monthNames) {
          if (new RegExp(`\\b${m}\\b`, 'i').test(lineStr) && !usedMonthNames.has(m)) {
            detectedMonth = m;
            break;
          }
        }
      }
      if (detectedMonth) break;
    }

    // 2. Check footer lines of THIS SECTION (lines with "Jakarta" or "Mengetahui" after student rows)
    for (let f = headerIdx + 15; f < nextHeaderIdx; f++) {
      const fRow = rawRows[f];
      const rowStr = fRow.join(' ');
      const isFooterOrSignature =
        rowStr.includes('Jakarta') ||
        rowStr.includes('Mengetahui') ||
        rowStr.includes('Kepala Sekolah') ||
        rowStr.includes('Guru Kelas') ||
        rowStr.includes('NIP.');

      if (isFooterOrSignature && !detectedMonth) {
        const bulanMatch = rowStr.match(
          /\b(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\b/i
        );
        if (bulanMatch) {
          const candidate = bulanMatch[1].toUpperCase();
          if (!usedMonthNames.has(candidate)) {
            detectedMonth = candidate;
          }
        }
      }

      for (const cell of fRow) {
        if (cell.includes('Jakarta,') || cell.includes('2026') || cell.includes('2025') || cell.includes('2027')) {
          signatureDate = cell.replace(/^Jakarta,\s*/i, '').trim() || cell;
        }
        if (cell.includes('Venez Wella') || cell.includes('M.Pd') || cell.includes('Kepala Sekolah')) {
          if (!cell.includes('Kepala Sekolah')) kepalaSekolah = cell;
        }
        if (cell.includes('19820129014122002') || (cell.includes('NIP.') && !nipKepala)) {
          nipKepala = cell.replace('NIP.', '').trim();
        }
        if (cell.includes('Jeni oktaviani') || cell.includes('Jeni Oktaviani') || cell.includes('S.Pd')) {
          guruKelas = cell;
        }
        if (cell.includes('199610182022212009') || (cell.includes('NIP.') && cell !== nipKepala)) {
          nipGuru = cell.replace('NIP.', '').trim();
        }
      }
    }

    // 3. Deduplication & Semester sequence fallback
    if (!detectedMonth || usedMonthNames.has(detectedMonth)) {
      const nextAvailable = defaultSeq.find((m) => !usedMonthNames.has(m));
      detectedMonth = nextAvailable || defaultSeq[sectionIndex] || `BULAN ${sectionIndex + 1}`;
    }

    usedMonthNames.add(detectedMonth);
    const monthLabel = detectedMonth;

    // Find day columns (columns with numbers 1 to 31)
    const dayColMap = {};
    let studentNameCol = 1;
    let noCol = 0;

    for (let c = 0; c < headerRow.length; c++) {
      const val = headerRow[c].trim();
      if (val.toUpperCase().includes('NAMA')) {
        studentNameCol = c;
      } else if (val.toUpperCase() === 'NO' || val.toUpperCase() === 'NO.') {
        noCol = c;
      } else {
        const dayNum = parseInt(val, 10);
        if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
          dayColMap[dayNum] = c;
        }
      }
    }

    const dayNumbers = Object.keys(dayColMap)
      .map(Number)
      .sort((a, b) => a - b);

    // Parse students in this month
    const students = [];
    let r = headerIdx + 1;

    while (r < nextHeaderIdx) {
      const row = rawRows[r];
      const noVal = row[noCol] ? row[noCol].trim() : '';
      const nameVal = row[studentNameCol] ? row[studentNameCol].trim() : '';

      // Check if it's a student row (has numeric No or non-empty student name and not summary)
      const isNum = /^[0-9]+$/.test(noVal);
      const isSummary =
        nameVal.toUpperCase().includes('JUMLAH') ||
        nameVal.toUpperCase().includes('PERSENTASE') ||
        nameVal.toUpperCase().includes('MENGETAHUI') ||
        nameVal.toUpperCase().includes('KEPALA SEKOLAH') ||
        (!nameVal && !isNum);

      if (isNum && nameVal && !isSummary) {
        const days = {};
        let sakitCount = 0;
        let izinCount = 0;
        let alpaCount = 0;
        let hadirCount = 0;

        dayNumbers.forEach((d) => {
          const colIdx = dayColMap[d];
          const rawMark = row[colIdx] ? row[colIdx].trim() : '';
          const mark = normalizeAttendanceMark(rawMark);
          days[d] = mark;

          if (mark === '.') hadirCount++;
          else if (mark === 'S') sakitCount++;
          else if (mark === 'I') izinCount++;
          else if (mark === 'A') alpaCount++;
        });

        // Totals from row if provided in the rightmost columns
        // e.g. S, I, A, Total
        const effectiveDays = hadirCount + sakitCount + izinCount + alpaCount;
        const rate = effectiveDays > 0 ? Math.round((hadirCount / effectiveDays) * 100) : 100;

        students.push({
          no: parseInt(noVal, 10) || students.length + 1,
          name: nameVal,
          days,
          sakit: sakitCount,
          izin: izinCount,
          alpa: alpaCount,
          hadir: hadirCount,
          effectiveDays,
          attendanceRate: rate
        });
      }

      r++;
    }

    // Calculate month statistics
    const totalStudents = students.length;
    let totalHadir = 0;
    let totalSakit = 0;
    let totalIzin = 0;
    let totalAlpa = 0;

    students.forEach((s) => {
      totalHadir += s.hadir;
      totalSakit += s.sakit;
      totalIzin += s.izin;
      totalAlpa += s.alpa;
    });

    const totalDaysRecorded = totalHadir + totalSakit + totalIzin + totalAlpa;
    const overallRate =
      totalDaysRecorded > 0 ? ((totalHadir / totalDaysRecorded) * 100).toFixed(1) : '100.0';

    // Daily breakdown
    const dailySummary = {};
    dayNumbers.forEach((d) => {
      let h = 0,
        s = 0,
        i = 0,
        a = 0;
      students.forEach((stud) => {
        const m = stud.days[d];
        if (m === '.') h++;
        else if (m === 'S') s++;
        else if (m === 'I') i++;
        else if (m === 'A') a++;
      });
      dailySummary[d] = {
        hadir: h,
        sakit: s,
        izin: i,
        alpa: a,
        totalActive: h + s + i + a
      };
    });

    let baseId = monthLabel.toLowerCase().replace(/[^a-z0-9]/g, '-');
    let uniqueId = baseId;
    let counter = 1;
    while (months.some((m) => m.id === uniqueId)) {
      uniqueId = `${baseId}-${counter}`;
      counter++;
    }

    months.push({
      id: uniqueId,
      name: monthLabel,
      monthOrder: sectionIndex + 1,
      students,
      totalStudents,
      dayNumbers,
      dailySummary,
      stats: {
        totalHadir,
        totalSakit,
        totalIzin,
        totalAlpa,
        overallRate: parseFloat(overallRate),
        effectiveAttendanceRate: overallRate + '%'
      },
      signatures: {
        dateString: signatureDate || `${monthLabel} 2026`,
        kepalaSekolah: kepalaSekolah || 'Venez Wella, M.Pd',
        nipKepala: nipKepala || '19820129014122002',
        guruKelas: guruKelas || 'Jeni oktaviani, S.Pd',
        nipGuru: nipGuru || '199610182022212009'
      }
    });
  });

  // Extract unique students across all months
  const studentMap = new Map();
  months.forEach((m) => {
    m.students.forEach((s) => {
      if (!studentMap.has(s.name)) {
        studentMap.set(s.name, {
          no: s.no,
          name: s.name
        });
      }
    });
  });

  // Sort months according to semester calendar order (Semester 2: Januari s/d Juni; Semester 1: Juli s/d Desember)
  const semesterOrder = isSemester2
    ? ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER']
    : ['JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER', 'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI'];

  months.sort((a, b) => {
    const idxA = semesterOrder.indexOf(a.name.toUpperCase());
    const idxB = semesterOrder.indexOf(b.name.toUpperCase());
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return (a.monthOrder || 0) - (b.monthOrder || 0);
  });

  return {
    docTitle,
    isSemester2,
    months,
    allStudents: Array.from(studentMap.values()),
    rawRows
  };
}

/**
 * Fallback parser for generic teacher spreadsheets
 */
export function parseGenericSheet(rawRows) {
  if (!rawRows || rawRows.length === 0) {
    return { months: [], allStudents: [], rawRows: [] };
  }

  const headerRow = rawRows[0] || [];
  const students = [];

  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (row.length === 0 || !row.some((c) => c !== '')) continue;

    students.push({
      no: parseInt(row[0], 10) || i,
      name: row[1] || `Siswa ${i}`,
      days: {},
      hadir: 0,
      sakit: 0,
      izin: 0,
      alpa: 0,
      attendanceRate: 100
    });
  }

  const genericMonth = {
    id: 'sheet-utama',
    name: 'Lembar Utama',
    monthOrder: 1,
    students,
    totalStudents: students.length,
    dayNumbers: Array.from({ length: 31 }, (_, i) => i + 1),
    dailySummary: {},
    stats: {
      totalHadir: 0,
      totalSakit: 0,
      totalIzin: 0,
      totalAlpa: 0,
      overallRate: 100,
      effectiveAttendanceRate: '100%'
    },
    signatures: {
      dateString: '2026',
      kepalaSekolah: 'Kepala Sekolah',
      nipKepala: '-',
      guruKelas: 'Guru Kelas',
      nipGuru: '-'
    }
  };

  return {
    months: [genericMonth],
    allStudents: students,
    rawRows
  };
}

/**
 * Parses the REKAP ABSEN cumulative sheet (gid: 490778033)
 */
export function parseRekapSheet(csvText) {
  const rawRows = parseCSV(csvText);
  if (!rawRows || rawRows.length === 0) return { students: [], grandTotal: {} };

  // Find header row with "NAMA SISWA"
  let headerIdx = -1;
  for (let r = 0; r < rawRows.length; r++) {
    if (rawRows[r].some((c) => c.toUpperCase().includes('NAMA SISWA'))) {
      headerIdx = r;
      break;
    }
  }

  if (headerIdx === -1) headerIdx = 0;

  const header = rawRows[headerIdx];
  const students = [];

  for (let r = headerIdx + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    const no = row[0]?.trim();
    const name = row[1]?.trim();

    if (!no || !name || name.toUpperCase().includes('JUMLAH') || name.toUpperCase().includes('PERSENTASE')) {
      continue;
    }

    // Columns 2 to 19 are monthly Sakit, Izin, Alpa
    // Columns 20, 21, 22 are JUMLAH Sakit, Izin, Alpa
    const totalSakit = parseInt(row[20] || '0', 10) || 0;
    const totalIzin = parseInt(row[21] || '0', 10) || 0;
    const totalAlpa = parseInt(row[22] || '0', 10) || 0;
    const totalAbsen = totalSakit + totalIzin + totalAlpa;

    students.push({
      no: parseInt(no, 10) || students.length + 1,
      name,
      jan: { s: row[2] || '', i: row[3] || '', a: row[4] || '' },
      feb: { s: row[5] || '', i: row[6] || '', a: row[7] || '' },
      mar: { s: row[8] || '', i: row[9] || '', a: row[10] || '' },
      apr: { s: row[11] || '', i: row[12] || '', a: row[13] || '' },
      mei: { s: row[14] || '', i: row[15] || '', a: row[16] || '' },
      jun: { s: row[17] || '', i: row[18] || '', a: row[19] || '' },
      totalSakit,
      totalIzin,
      totalAlpa,
      totalAbsen
    });
  }

  return {
    students,
    totalStudents: students.length
  };
}

/**
 * Parses MUTASI SISWA sheet (gid: 1395406134)
 */
export function parseMutasiSheet(csvText) {
  const rawRows = parseCSV(csvText);
  if (!rawRows || rawRows.length === 0) return { roster: [], summary: {} };

  // Find header row with "INDUK" and "NAMA PESERTA DIDIK"
  let headerIdx = -1;
  for (let r = 0; r < rawRows.length; r++) {
    if (
      rawRows[r].some(
        (c) =>
          c.toUpperCase().includes('INDUK') ||
          c.toUpperCase().includes('NAMA PESERTA DIDIK') ||
          c.toUpperCase().includes('MASUK')
      )
    ) {
      headerIdx = r;
      break;
    }
  }

  if (headerIdx === -1) headerIdx = 0;

  const roster = [];
  for (let r = headerIdx + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    const no = row[0]?.trim();
    const induk = row[1]?.trim();
    const name = row[2]?.trim();
    const tanggal = row[3]?.trim();
    const gender = row[4]?.trim().toUpperCase();
    const kelas = row[5]?.trim();
    const asal = row[6]?.trim();

    if (no && /^[0-9]+$/.test(no) && name) {
      roster.push({
        no: parseInt(no, 10),
        induk: induk || '-',
        name,
        tanggal: tanggal || '-',
        gender: gender === 'P' ? 'Perempuan' : 'Laki-laki',
        genderCode: gender === 'P' ? 'P' : 'L',
        kelas: kelas || '2',
        asal: asal || '-'
      });
    }
  }

  return {
    roster,
    countLaki: roster.filter((s) => s.genderCode === 'L').length,
    countPerempuan: roster.filter((s) => s.genderCode === 'P').length,
    total: roster.length
  };
}
