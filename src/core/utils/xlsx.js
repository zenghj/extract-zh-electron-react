const Excel = require('exceljs');
const assession = require('./assession');
const { keyValueReverse } = require('../utils/helper');

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

// async function readRowsDataFromXlsxFile({ filepath, sheetName }) {
//   // read from a file
//   const workbook = new Excel.Workbook();
//   await workbook.xlsx.readFile(filepath);
//   const name = sheetName || SHEET_NAME;
//   const sheet = workbook.getWorksheet(name) || workbook.worksheets[0];
//   if (sheet) {
//     const sheetValues = sheet.getSheetValues();
//     const ret = sheetValues.slice(2);
//     return ret;
//   }
//   throw new Error(`读取不到 ${name} sheet 表单`);
// }


function getKeyFromRow(row) {
  assession(row, 'Array', 'row should be an array');
  return row[1].trim();
}
function getZhFromRow(row) {
  assession(row, 'Array', 'row should be an array');
  return row[2].trim();
}
function isRowValid(row) {
  assession(row, 'Array', 'row should be an array');
  const key = getKeyFromRow(row);
  const zh = getZhFromRow(row);
  return key && zh;
}
function validateRows(rows, sheetname) {
  const inValidRows = [];
  rows.forEach((row, index) => {
    if (!isRowValid(row)) {
      inValidRows.push({
        index,
        row,
      });
    }
  });
  // TODO 验证key不能重复
  if (inValidRows.length) {
    console.log(inValidRows);
    throw new Error(`sheet: ${sheetname} \ninvalid rows: ${JSON.stringify(rows)}`);
  }
}

function getRowsDataFromSheet(sheet) {
  assession(sheet, 'Object', 'sheet should be an object');
  const sheetValues = sheet.getSheetValues();
  return sheetValues.slice(2); // 从index为2开始才是正式的翻译序列
}
/**
 * @param {*} param0
 * @returns [[key, 中文文案， 英文文案], ...]
 */
async function readRowsDataFromXlsx({ filepath, sheetName }) {
  assession(filepath, 'String', 'filepath should be a string');
  const workbook = new Excel.Workbook();
  await workbook.xlsx.readFile(filepath);
  let rows = [];
  if (sheetName) {
    const sheet = workbook.getWorksheet(sheetName);
    if (sheet) {
      rows = getRowsDataFromSheet(sheet);
      validateRows(rows, sheetName);
    } else {
      throw new Error(`can find sheetname ${sheetName}`);
    }
  } else {
    workbook.eachSheet((worksheet, sheetId) => {
      const indexedRows = getRowsDataFromSheet(worksheet);
      validateRows(indexedRows, sheetId);
      rows.push(...indexedRows);
    });
  }
  return rows;
}

/**
 *
 * @param {*} rows
 * @returns {object} dic
 * {
 *  chineseText: 'key'
 * }
 */
function getLanguageDicFromRows(rows) {
  assession(rows, 'Array', 'rows should be an array');
  const dic = {};
  rows.forEach((row) => {
    dic[getKeyFromRow(row)] = getZhFromRow(row);
  });
  return dic;
}

async function getLanguageDicFromXlsx({ filepath, sheetName }) {
  assession(filepath, 'String', 'filepath should be a string');
  const rows = await readRowsDataFromXlsx({ filepath, sheetName });
  return keyValueReverse(getLanguageDicFromRows(rows));
}
module.exports = {
  createXlsxFile,
  readRowsDataFromXlsx,
  getLanguageDicFromXlsx,
};
