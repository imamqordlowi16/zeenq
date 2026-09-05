import { parseCSV } from '../src/services/sheetParser.js';

// Simulate row 3 with empty cells
const csvWithBlankRow3 = [
  '"TITLE"',
  '"NO","NAMA","1","2"',
  '"","","",""', // completely blank cells
  '"1","ADEEVA","•","•"',
  '"2","ADELIA","•","•"'
].join('\n');

const origRows = parseCSV(csvWithBlankRow3);
console.log('origRows length:', origRows.length);
origRows.forEach((r, idx) => console.log('Idx ' + idx + ' (Row ' + (idx + 1) + '):', r));
