/**
 * 此文件作为一个webwork运行
 * TODO 1. 排除非目标文件，并在结果信息中展示
 * TODO 2. 如何终止一次很费时的提取操作
 */

const path = require('path');
const { collectFiles, unique, fsPromises } = require('../utils/helper');
const extractZh = require('../utils/extract-zh');
const assession = require('../utils/assession');
const { createXlsxFile } = require('../utils/xlsx');
// const { getMainWindow } = require('../index');
const { PROGRESS_STATUS, WORKER_MSG_TYPE } = require('../../constant');
const { batchAsyncTask } = require('../utils/async-utils');

/* eslint-disable */

self.onmessage = function (e) {
  const data = e.data || {};
  if (data.type === 'extract') {
    console.log(data);
    extract(data.data);
  }
};

function generateXlsx(texts, outputFilePath) {
  console.log(JSON.stringify(texts))
  return createXlsxFile({
    filepath: outputFilePath,
    columns: [
      { header: 'key', key: 'key', width: 10 },
      { header: '中文', key: 'Chinese', width: 50 },
      { header: '英文', key: 'English', width: 50 },
    ],
    data: texts.map((item, index) => ({
      key: `key_${index}`,
      Chinese: item,
      English: '',
    })),
  });
}

async function extract({ include, exclude, outputPath }) {
  let dealedCount = 0;
  let successCount = 0;
  let someFileHasError = false;
  function handleProgress({ total, current, status = PROGRESS_STATUS.normal, done = false, ...rest }) {
    if (status === PROGRESS_STATUS.exception) {
      self.postMessage({
        type: WORKER_MSG_TYPE.progressInfo,
        data: {
          status,
          ...rest
        }
      })
    } else {
      const percent = Math.floor((current * 100) / total);
      self.postMessage({
        type: WORKER_MSG_TYPE.progressInfo,
        data: {
          status: (percent === 100 && !someFileHasError) ? PROGRESS_STATUS.success : status,
          percent,
          done,
          ...rest
        }
      })
    }
  }


  try {
    const outputFilePath = path.join(outputPath, 'output.xlsx');
    const jsFilePaths = await collectFiles({
      include,
      exclude,
    });

    async function extractFile(filename, file) {
      assession(file, 'Object', 'file should be an object');
      const code = await fsPromises.readFile(filename, {
        encoding: 'utf-8',
      });
      let zhNodes = []
      try {
        zhNodes = extractZh(code);
        file.error = null;
        successCount++
      } catch (err) {
        someFileHasError = true
        file.error = err;
      }
      dealedCount++;
      file.zhNodes = zhNodes;
      let progressInfo = {
        total: files.length,
        current: successCount,
        status: PROGRESS_STATUS.normal,
      }
      if (dealedCount === files.length) {
        progressInfo.errors = files.reduce((sum, item) => {
          if (item.error) {
            sum.push({
              error: item.error.message,
              stack: item.error.stack,
              path: item.path
            });
          }
          return sum;
        }, []);
        progressInfo.done = true;
      }
      handleProgress(progressInfo);
      return file;
    }
    let files = jsFilePaths.map(filepath => ({path: filepath}));
    let batchArgsList = files.map(file => ([file.path, file]));
    await batchAsyncTask(extractFile, batchArgsList, 10);

    console.log(files)
    let texts = files.reduce((sum, item) => {
      const zhCnVals = item.zhNodes.map(node => node.value);
      sum.push(...zhCnVals);
      return sum;
    }, []);
    texts = unique(texts);
    return generateXlsx(texts, outputFilePath).then(() => ({
      output: outputFilePath,
      errors: null,
    }));
  } catch (error) {
    handleProgress({
      status: PROGRESS_STATUS.exception,
      error: error.message,
      stack: error.stack,
    });
    return Promise.reject(error);
  }
}

module.exports = extract;
