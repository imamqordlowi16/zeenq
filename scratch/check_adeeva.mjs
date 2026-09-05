const id = '1ADtLN3mRJ2XcbQUpjpNVfoiUBQ7dan2LmjkLUPNl9XY';
const gid = '272037099';
const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${gid}`;

fetch(url)
  .then(res => res.text())
  .then(csv => {
    const lines = csv.split('\n');
    console.log('Row 1 (Title):', lines[0]);
    console.log('Row 2 (Header):', lines[1]);
    console.log('Row 3 (Adeeva):', lines[2]);
    console.log('Row 4 (Adelia):', lines[3]);
  })
  .catch(console.error);
