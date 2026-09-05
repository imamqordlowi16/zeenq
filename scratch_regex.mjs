const r1 = 'ABSENSI!A45:AL85';
const r2 = "'ABSENSI'!A45:AL85";
const safeRegex = /!([A-Za-z]+)(\d+):([A-Za-z]+)(\d+)/;
console.log('Safe r1:', r1.match(safeRegex)?.[2], r1.match(safeRegex)?.[4]);
console.log('Safe r2:', r2.match(safeRegex)?.[2], r2.match(safeRegex)?.[4]);
