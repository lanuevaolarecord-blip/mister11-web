const xlsx = require('xlsx');
const wb = xlsx.readFile('../MACRO jhojan stiven caicedo .xlsx');
const sheet = wb.Sheets['MACRO'];
console.log(xlsx.utils.sheet_to_csv(sheet).substring(0, 3000));
