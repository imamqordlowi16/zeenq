const id = '1ADtLN3mRJ2XcbQUpjpNVfoiUBQ7dan2LmjkLUPNl9XY';
fetch(`https://docs.google.com/spreadsheets/d/${id}/htmlview`)
  .then(r => r.text())
  .then(html => {
    ['272037099', '1395406134', '490778033'].forEach(gid => {
      const idx = html.indexOf(gid);
      if (idx !== -1) {
        console.log(`Around gid=${gid}:`);
        console.log(html.substring(Math.max(0, idx - 100), Math.min(html.length, idx + 200)));
      }
    });
  });
