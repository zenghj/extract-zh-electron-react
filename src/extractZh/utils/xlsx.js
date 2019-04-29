const Excel = require('exceljs');

const SHEET_NAME = 'My Sheet';

function createXlsxFile({ filepath, columns, data = [] }) {
  const workbook = new Excel.Workbook();
  const sheet = workbook.addWorksheet(SHEET_NAME);

  sheet.columns = columns;

  sheet.addRows(data);
  // sheet.commit()// 提交修改
  return workbook.xlsx.writeFile(filepath).then(() => {
    console.log(`创建文件${filepath}成功`);
  });
}

async function readRowsDataFromXlsxFile({ filepath, sheetName }) {
  // read from a file
  const workbook = new Excel.Workbook();
  await workbook.xlsx.readFile(filepath);
  const name = sheetName || SHEET_NAME;
  const sheet = workbook.getWorksheet(name) || workbook.worksheets[0];
  if (sheet) {
    const sheetValues = sheet.getSheetValues();
    const ret = sheetValues.slice(2);
    return ret;
  }
  throw new Error(`读取不到 ${name} sheet 表单`);
}

module.exports = {
  createXlsxFile,
  readRowsDataFromXlsxFile,
};
