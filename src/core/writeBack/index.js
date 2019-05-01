const { getLanguageDicFromXlsx } = require('../utils/xlsx');
const writeBack = require('./write-back');
const assession = require('../utils/assession');
const { collectFiles } = require('../utils/helper');
const { batchAsyncTask } = require('../utils/async-utils');

async function write({ xlsxFilePath, include, exclude, outputPath, globalI18nFnName }) {
  assession(outputPath, 'String', 'outputPath should be a string');
  const dic = await getLanguageDicFromXlsx({ filepath: xlsxFilePath });
  const files = await collectFiles({ include, exclude });
  const writeBackArgsList = files.map(path => [path, dic, globalI18nFnName]);
  return batchAsyncTask(writeBack, writeBackArgsList, 10);
}

write({
  xlsxFilePath: '/Users/julianzeng/Desktop/tmp/output.xlsx',
  include: ['/Users/julianzeng/Desktop/git/fed/lop/Project/extract-zh-electron-react/src/core/extractZh/src-extract-source/demo-file.js'],
  outputPath: 'xxx',
  globalI18nFnName: 'i18n',
}).then((result) => {
  console.log('write success', JSON.stringify(result));
}, (err) => {
  console.log(err);
});

module.exports = write;
