const id = '1ADtLN3mRJ2XcbQUpjpNVfoiUBQ7dan2LmjkLUPNl9XY';
fetch(`https://docs.google.com/spreadsheets/d/${id}/htmlview`)
  .then(r => r.text())
  .then(html => {
    const regex = /<li[^>]+id="sheet-button-([0-9]+)"[^>]*><a[^>]*>([^<]+)<\/a>/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      console.log('GID:', match[1], 'Tab Name:', match[2]);
    }
  })
  .catch(console.error);
