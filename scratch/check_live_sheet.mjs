const id = '1ADtLN3mRJ2XcbQUpjpNVfoiUBQ7dan2LmjkLUPNl9XY';
const gid = '272037099';
const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${gid}`;

fetch(url)
  .then(res => res.text())
  .then(csv => {
    const lines = csv.split('\n');
    for (let i = 0; i < 10; i++) {
      console.log(`Row ${i+1}: ${lines[i]}`);
    }
  })
  .catch(console.error);
