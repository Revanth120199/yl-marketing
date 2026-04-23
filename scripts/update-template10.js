const path = require('path');
const ExcelJS = require('exceljs');

async function main() {
  const workbookPath = path.resolve(process.cwd(), 'Template10.xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(workbookPath);

  const worksheet = workbook.getWorksheet('Sheet1') || workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('Template10.xlsx does not contain a worksheet');
  }

  worksheet.getColumn(3).width = 28;
  worksheet.getCell('C1').value = 'Selected Store';
  worksheet.getCell('C1').font = { bold: true };

  worksheet.getCell('C2').dataValidation = {
    type: 'list',
    allowBlank: true,
    formulae: ['$A$2:$A$203'],
    showErrorMessage: true,
    errorTitle: 'Invalid Store',
    error: 'Choose a store from the dropdown list.',
  };

  worksheet.autoFilter = {
    from: 'A1',
    to: 'A203',
  };

  await workbook.xlsx.writeFile(workbookPath);
  console.log('Updated Template10.xlsx');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
