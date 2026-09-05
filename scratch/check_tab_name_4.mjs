const id = '1ADtLN3mRJ2XcbQUpjpNVfoiUBQ7dan2LmjkLUPNl9XY';
fetch(`https://docs.google.com/spreadsheets/d/${id}/htmlview`)
  .then(r => r.text())
  .then(html => {
    const idx = html.indexOf('272037099');
    console.log(html.substring(Math.max(0, idx - 250), idx + 50));
  });
