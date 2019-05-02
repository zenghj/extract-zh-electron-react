const path = require('path');
const shell = require('shelljs');
const { getInfoFromXlsx } = require('../utils/xlsx');
const writeBack = require('./write-back');
const assession = require('../utils/assession');
const { collectFiles, fsPromises } = require('../utils/helper');
const { batchAsyncTask } = require('../utils/async-utils');
const { WORKER_MSG_TYPE, PROGRESS_STATUS } = require('../../constant');

async function generateLocateFiles(outputPath, locateJson) {
  const locatesDir = path.join(outputPath, './locates');
  if (await fsPromises.exists(locatesDir)) {
    shell.rm('-rf', locatesDir);
  }
  shell.mkdir('-p', locatesDir);
  return Promise.all(Object.keys(locateJson).map(async (languageName) => {
    const file = path.join(outputPath, `locates/${languageName}.json`);
    const json = locateJson[languageName];
    await fsPromises.writeFile(file, JSON.stringify(json, null, 4));
    return [file, json];
  }));
}

async function write({ xlsxFilePath, include, exclude = [],
  outputPath, globalI18nFnName, projectRootDir }) {
  assession(outputPath, 'String', 'outputPath should be a string');
  assession(include, 'Array', 'include should be an Array');
  assession(projectRootDir, 'String', 'projectRootDir should be a string');

  const projectDir = path.resolve(projectRootDir, '../');
  const copiedProjectPath = path.resolve(outputPath, path.relative(projectDir, projectRootDir));
  const { dic, locateJson } = await getInfoFromXlsx({ filepath: xlsxFilePath });

  function getRealPath(srcPath) {
    const rel = path.relative(projectDir, srcPath);
    return path.join(outputPath, rel);
  }
  async function copyProject() {
    if (await fsPromises.exists(copiedProjectPath)) {
      shell.rm('-rf', copiedProjectPath);
    }
    shell.cp('-R', projectRootDir, outputPath);
  }

  // console.log(locateJson);
  await generateLocateFiles(outputPath, locateJson).then((result) => {
    console.log('generateLocateFiles success', result);
  }, (err) => {
    console.error(err);
  });

  self.postMessage({
    status: PROGRESS_STATUS.copying,
  });
  await copyProject();

  const realInclude = include.map(item => getRealPath(item));
  const realExclude = exclude.map(item => getRealPath(item));
  // console.log(realInclude, realExclude, copiedProjectPath);
  const files = await collectFiles({ include: realInclude, exclude: realExclude });
  const wbOptions = {
    total: files.length,
    done: false,
    handledCount: 0,
    successCount: 0,
    errors: [],
  };
  const writeBackArgsList = files.map(filePath => [{
    filePath,
    dirctionary: dic,
    globalI18nFnName,
    options: wbOptions,
  }]);
  self.postMessage({
    status: PROGRESS_STATUS.startWrite,
  });
  const results = await batchAsyncTask(writeBack, writeBackArgsList, 10);
  return {
    results,
    options: wbOptions,
  };
}

// write({
//   xlsxFilePath: '/Users/julianzeng/Desktop/tmp/output.xlsx',
//   include: ['/Users/julianzeng/Desktop/git/fed/lop/Project/extract-zh-electron-react/src/core/extractZh/src-extract-source/demo-file.js'],
//   outputPath: 'xxx',
//   globalI18nFnName: 'i18n',
// }).then((result) => {
//   console.log('write success', JSON.stringify(result));
// }, (err) => {
//   console.log(err);
// });

// module.exports = write;

// eslint-disable-next-line no-undef
self.onmessage = (e) => {
  const data = e.data || {};
  if (data.type === WORKER_MSG_TYPE.writeBack) {
    console.log(data);
    write(data.data).then(({ results, options }) => {
      console.log('write success', results);
      const warnings = results.reduce((sum, item) => {
        if (item.noKeyVals && item.noKeyVals.length) {
          sum.push({
            path: item.filePath,
            error: `${JSON.stringify(item.noKeyVals)}没有对应的key`,
          });
        }
        return sum;
      }, []);
      self.postMessage({
        type: WORKER_MSG_TYPE.progressInfo,
        data: {
          status: options.errors.length === 0 ? PROGRESS_STATUS.success : PROGRESS_STATUS.normal,
          errors: [...options.errors, ...warnings],
          percent: options.percent,
          done: true,
        },
      });
    }, (err) => {
      console.error(err);
      self.postMessage({
        type: WORKER_MSG_TYPE.progressInfo,
        data: {
          status: PROGRESS_STATUS.exception,
          error: err.message,
          stack: err.stack,
        },
      });
    });
  }
};
