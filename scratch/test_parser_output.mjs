import { parseAttendanceSheet } from '../src/services/sheetParser.js';

const id = '1ADtLN3mRJ2XcbQUpjpNVfoiUBQ7dan2LmjkLUPNl9XY';
const gid = '272037099';
const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${gid}`;

const res = await fetch(url);
const csv = await res.text();
const parsed = parseAttendanceSheet(csv, 'DAFTAR HADIR');

console.log('Detected months:', parsed.months.map(m => ({
  id: m.id,
  name: m.name,
  headerRowIndex: m.headerRowIndex,
  studentCount: m.students.length,
  firstStudent: m.students[0] ? { name: m.students[0].name, rowIndex: m.students[0].rowIndex } : null,
  dayCol1: m.dayColMap?.[1],
  dayCol2: m.dayColMap?.[2]
})));
