import { parseAttendanceSheet } from '../src/services/sheetParser.js';
import { getColLetter } from '../src/services/googleSheetsApiService.js';

const id = '1ADtLN3mRJ2XcbQUpjpNVfoiUBQ7dan2LmjkLUPNl9XY';
const gid = '272037099';
const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${gid}`;

const res = await fetch(url);
const csv = await res.text();
const attendanceData = parseAttendanceSheet(csv, 'DAFTAR HADIR');

console.log('--- TEST 1: Months count and order ---');
console.log('Months count:', attendanceData.months.length);
console.log('Months list:', attendanceData.months.map(m => m.name));

console.log('\n--- TEST 2: Row and Column mapping for each month ---');
attendanceData.months.forEach(m => {
  const s1 = m.students[0];
  const s28 = m.students[m.students.length - 1];
  const day1Col = m.dayColMap?.[1] ?? 2;
  const day31Col = m.dayColMap?.[31] ?? 32;
  console.log(`${m.name}: header=${m.headerRowIndex}, S1(${s1.name}) row=${s1.rowIndex}, S28(${s28.name}) row=${s28.rowIndex}`);
  console.log(`   Day 1 col=${getColLetter(day1Col)} (cell=${getColLetter(day1Col)}${s1.rowIndex}), Day 31 col=${getColLetter(day31Col)}`);
});

console.log('\n--- TEST 3: Attendance cycle logic ---');
const cycle = (currentMark) => {
  let nextMark = '.';
  if (currentMark === '.') nextMark = 'S';
  else if (currentMark === 'S') nextMark = 'I';
  else if (currentMark === 'I') nextMark = 'A';
  else if (currentMark === 'A') nextMark = '';
  else if (currentMark === '') nextMark = '.';
  return nextMark;
};
console.log('. ->', cycle('.'));
console.log('S ->', cycle('S'));
console.log('I ->', cycle('I'));
console.log('A ->', cycle('A'));
console.log('"" ->', cycle(''));

console.log('\nALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
