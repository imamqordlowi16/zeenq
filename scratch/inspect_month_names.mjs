const id = '1ADtLN3mRJ2XcbQUpjpNVfoiUBQ7dan2LmjkLUPNl9XY';
const gid = '272037099';
const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${gid}`;

const res = await fetch(url);
const csv = await res.text();
const lines = csv.split('\n');

console.log('--- Around row 182 ---');
for (let i = 175; i < 225; i++) {
  if (lines[i] && (lines[i].includes('Jakarta') || lines[i].includes('BULAN') || lines[i].includes('NAMA') || lines[i].includes('Mengetahui'))) {
    console.log(`Line ${i+1}: ${lines[i]}`);
  }
}
console.log('--- Around row 218 ---');
for (let i = 215; i < 253; i++) {
  if (lines[i] && (lines[i].includes('Jakarta') || lines[i].includes('BULAN') || lines[i].includes('NAMA') || lines[i].includes('Mengetahui'))) {
    console.log(`Line ${i+1}: ${lines[i]}`);
  }
}
