const id = '1ADtLN3mRJ2XcbQUpjpNVfoiUBQ7dan2LmjkLUPNl9XY';
const gid = '272037099';
const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${gid}`;

fetch(url)
  .then(res => res.text())
  .then(csv => {
    const lines = csv.split('\n');
    console.log(`Total lines: ${lines.length}`);
    console.log('First 20 lines:');
    lines.slice(0, 20).forEach((l, i) => console.log(`${i+1}: ${l.substring(0, 100)}`));
    console.log('\nLast 20 lines:');
    lines.slice(-20).forEach((l, i) => console.log(`${lines.length - 20 + i + 1}: ${l.substring(0, 100)}`));
  })
  .catch(console.error);
