async function findSheetButtons() {
  const url = 'https://docs.google.com/spreadsheets/d/1-TcO9i3_73Rh-uWSSZTYDb14BTV2vhq2/edit';
  const r = await fetch(url);
  const html = await r.text();
  
  // Search for sheet-tab or sheet-button or docs-sheet-tab
  const tabRegex = /class="[^"]*sheet[^"]*"[^>]*>([^<]+)</gi;
  let m;
  const tabs = new Set();
  while ((m = tabRegex.exec(html)) !== null) {
    if (m[1].trim()) tabs.add(m[1].trim());
  }
  console.log('Tabs detected:', [...tabs]);
}
findSheetButtons();
