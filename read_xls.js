const XLSX = require('xlsx');
const path = 'C:/Users/Oktovaaaaa/Documents/GitHub/web-project-sumut/src/app/Laporan Maturitas Siber Posisi Desember 2025.xls';

try {
  const workbook = XLSX.readFile(path);
  const ws = workbook.Sheets['HASIL PENILAIAN'];
  console.log('HASIL PENILAIAN Cell Details:');
  const cells = ['B3', 'B4', 'C9', 'C10', 'C11', 'C12', 'C13', 'G9', 'G11', 'G13', 'A14', 'E14', 'C25', 'A28'];
  cells.forEach(ref => {
    const cell = ws[ref];
    if (cell) {
      console.log(`${ref}: val = ${cell.v}, formula = ${cell.f || 'none'}, type = ${cell.t}`);
    } else {
      console.log(`${ref}: empty`);
    }
  });
} catch (e) {
  console.error(e);
}
