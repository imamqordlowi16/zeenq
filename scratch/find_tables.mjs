const id = '1ADtLN3mRJ2XcbQUpjpNVfoiUBQ7dan2LmjkLUPNl9XY';
const gid = '272037099';
const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${gid}`;

fetch(url)
  .then(res => res.text())
  .then(csv => {
    const lines = csv.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('BULAN') || line.includes('NAMA SISWA')) {
        console.log(`Row ${idx + 1}: ${line.substring(0, 80)}`);
      }
    });
  });
