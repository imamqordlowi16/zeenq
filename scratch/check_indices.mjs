import { parseCSV } from '../src/services/sheetParser.js';

const id = '1ADtLN3mRJ2XcbQUpjpNVfoiUBQ7dan2LmjkLUPNl9XY';
const gid = '272037099';
const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${gid}`;

const res = await fetch(url);
const csv = await res.text();
const rawRows = parseCSV(csv);

rawRows.forEach((r, idx) => {
  const lineNum = idx + 1;
  const str = r.join(' ');
  if (str.includes('NAMA SISWA') || str.includes('ADEEVA')) {
    console.log(`CSV Line ${lineNum} (rawRows[${idx}]): ${str.substring(0, 50)}`);
  }
});
