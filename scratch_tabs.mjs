async function checkEdit() {
  const url = 'https://docs.google.com/spreadsheets/d/1-TcO9i3_73Rh-uWSSZTYDb14BTV2vhq2/edit';
  const r = await fetch(url);
  const text = await r.text();
  console.log('Status:', r.status);
  const titleMatch = text.match(/<title>([^<]+)<\/title>/);
  console.log('Title:', titleMatch ? titleMatch[1] : 'none');
  
  // Look for bootstrap data or sheet names
  const nameMatches = [...text.matchAll(/"name":"([^"]+)"/g)];
  console.log('Names found:', nameMatches.slice(0, 10).map(m => m[1]));
}
checkEdit();
