const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

async function main() {
  const workbookPath = path.resolve(process.cwd(), 'Template10.xlsx');
  const outputPath = path.resolve(process.cwd(), 'store-options.json');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(workbookPath);

  const worksheet = workbook.getWorksheet('Sheet1') || workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('Template10.xlsx does not contain a worksheet');
  }

  const stores = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const rawValue = String(row.getCell(1).value || '').trim();
    const value = rawValue
      .replace(/^Yogurtland\s*-\s*/i, '')
      .replace(/^Yogurtland\s+/i, '')
      .trim();
    if (value) stores.push(value);
  });

  fs.writeFileSync(outputPath, `${JSON.stringify(stores, null, 2)}\n`);
  console.log(`Exported ${stores.length} stores to store-options.json`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
