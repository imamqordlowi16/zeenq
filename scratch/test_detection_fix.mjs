import { parseCSV, normalizeAttendanceMark } from '../src/services/sheetParser.js';

const id = '1ADtLN3mRJ2XcbQUpjpNVfoiUBQ7dan2LmjkLUPNl9XY';
const gid = '272037099';
const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${gid}`;

const res = await fetch(url);
const csv = await res.text();
const rawRows = parseCSV(csv);

const headerContext = rawRows.slice(0, 15).map((r) => r.join(' ')).join(' ').toUpperCase();
const isSemester2 =
  headerContext.includes('SEMESTER 2') ||
  headerContext.includes('SEMESTER II') ||
  headerContext.includes('SMT 2') ||
  headerContext.includes('GENAP') ||
  headerContext.includes('JANUARI') ||
  headerContext.includes('FEBRUARI');

const semester1Seq = ['JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER', 'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI'];
const semester2Seq = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];
const defaultSeq = isSemester2 ? semester2Seq : semester1Seq;

const monthNames = [
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
];

// 2. Identify TRUE day header rows
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
  if (dayCols >= 15) {
    const prev = headerRowIndices[headerRowIndices.length - 1];
    if (prev === undefined || r - prev >= 15) {
      headerRowIndices.push(r);
    }
  }
}

const months = [];
const usedMonthNames = new Set();

headerRowIndices.forEach((headerIdx, sectionIndex) => {
  const nextHeaderIdx = sectionIndex + 1 < headerRowIndices.length ? headerRowIndices[sectionIndex + 1] : rawRows.length;
  let detectedMonth = '';

  // 1. Check title rows directly above headerRow
  for (let u = Math.max(0, headerIdx - 4); u < headerIdx; u++) {
    const lineStr = rawRows[u].join(' ');
    const isPreviousSignature =
      lineStr.includes('NIP.') ||
      lineStr.includes('Kepala Sekolah') ||
      lineStr.includes('Guru Kelas') ||
      lineStr.includes('Mengetahui') ||
      lineStr.includes('Jakarta');

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

  // 2. Check footer lines
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
  }

  // 3. Fallback
  if (!detectedMonth || usedMonthNames.has(detectedMonth)) {
    const nextAvailable = defaultSeq.find((m) => !usedMonthNames.has(m));
    detectedMonth = nextAvailable || defaultSeq[sectionIndex] || `BULAN ${sectionIndex + 1}`;
  }

  usedMonthNames.add(detectedMonth);
  months.push({
    sectionIndex,
    headerIdx: headerIdx + 1,
    detectedMonth
  });
});

console.log('Resulting detected months:', months);
