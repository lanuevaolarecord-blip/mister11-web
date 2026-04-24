const xlsx = require('xlsx');
const wb = xlsx.readFile('../MACRO jhojan stiven caicedo .xlsx');
const sheetNames = wb.SheetNames;
console.log('Sheets:', sheetNames);
const sheet = wb.Sheets[sheetNames[0]];
console.log(xlsx.utils.sheet_to_csv(sheet).substring(0, 3000));
