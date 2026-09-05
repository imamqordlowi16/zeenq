import { parseCSV } from '../src/services/sheetParser.js';

const id = '1ADtLN3mRJ2XcbQUpjpNVfoiUBQ7dan2LmjkLUPNl9XY';
const gid = '272037099';
const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${gid}`;

const res = await fetch(url);
const csv = await res.text();
const rawRows = parseCSV(csv);

const headerRowIndices = [2, 38, 74, 110, 146, 182, 218];
const monthNames = [
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
];

headerRowIndices.forEach((headerIdx, sectionIndex) => {
  let detectedMonth = '';
  // 1. Check title rows
  for (let u = Math.max(0, headerIdx - 4); u < headerIdx; u++) {
    const lineStr = rawRows[u].join(' ');
    for (const m of monthNames) {
      if (new RegExp(`\\b${m}\\b`, 'i').test(lineStr)) {
        console.log(`Section ${sectionIndex} (header ${headerIdx}): title match ${m} on row ${u}`);
        detectedMonth = m;
        break;
      }
    }
  }

  // 2. Check footer
  const nextHeader = headerRowIndices[sectionIndex + 1] || rawRows.length;
  for (let f = headerIdx + 15; f < nextHeader; f++) {
    const fRow = rawRows[f];
    const rowStr = fRow.join(' ');
    const bulanMatch = rowStr.match(
      /\b(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\b/i
    );
    if (bulanMatch) {
      console.log(`Section ${sectionIndex} (header ${headerIdx}): footer match ${bulanMatch[1]} on row ${f}`);
    }
  }
});
