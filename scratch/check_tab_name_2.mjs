const id = '1ADtLN3mRJ2XcbQUpjpNVfoiUBQ7dan2LmjkLUPNl9XY';
fetch(`https://docs.google.com/spreadsheets/d/${id}/htmlview`)
  .then(r => r.text())
  .then(html => {
    // search for sheets or tabs
    const matches = html.match(/<li id="sheet-button-[^>]+>.*?<\/li>/g);
    console.log('Matches:', matches);
    if (!matches) {
      // try other pattern
      const m2 = html.match(/gid=[0-9]+/g);
      console.log('GIDs found:', Array.from(new Set(m2)));
    }
  })
  .catch(console.error);
