const util = require('util');
const fs = require('fs');
const path = require('path');
// const Types = require('./types');
const assession = require('./assession');
const { batchAsyncTask } = require('./async-utils');

const objPrototype = Object.prototype;
const toString = objPrototype.toString;

const fsPromises = {
  readdir: util.promisify(fs.readdir),
  readFile: util.promisify(fs.readFile),
  stat: util.promisify(fs.stat),
  writeFile: util.promisify(fs.writeFile),
  copyFile: util.promisify(fs.copyFile),
  exists: util.promisify(fs.exists),
};

function toArray(ele) {
  if (Array.isArray(ele)) {
    return ele;
  } else if (ele) {
    return [ele];
  }
  return [];
}

async function collectFiles({ include, exclude, suffixs = ['.js', '.jsx'], blackSuffixs = ['.test.js'] }) {
  const fileSet = new Set();
  const excludes = toArray(exclude);
  let includes = toArray(include);
  includes = includes.filter(item => !excludes.includes(item));
  function isTargetFile(fileName) {
    assession(fileName, 'String', 'fileName should be string type');
    return suffixs.some(suffix => fileName.endsWith(suffix)) &&
      blackSuffixs.every(suffix => !fileName.endsWith(suffix));
  }
  async function collect(filepath) {
    assession(filepath, 'String', 'filepath should be string type');
    const stat = await fsPromises.stat(filepath);
    if (stat.isFile() && isTargetFile(filepath)) {
      fileSet.add(filepath);
    } else if (stat.isDirectory()) {
      let subFiles = await fsPromises.readdir(filepath);
      subFiles = subFiles.map(subfile => path.join(filepath, subfile));
      await batchAsyncTask(collect, subFiles, 10);
    }
  }

  await batchAsyncTask(collect, includes, 2);
  return [...fileSet];
}

function isType(val, type) {
  const formatedType = type.replace(/^(\w)/, x => x.toUpperCase());
  return toString.call(val) === `[object ${formatedType}]`;
}
function unique(arr = [], prop) {
  const map = {};
  const ret = [];
  if (arr && arr.length > 0) {
    arr.forEach((item) => {
      const uniqueKey = prop && isType(item, 'Object') ? item[prop] : item;
      if (!map[uniqueKey]) {
        ret.push(item);
        map[uniqueKey] = true;
      }
    });
    return ret;
  }
  return arr;
}

function postNormalizeText(text) {
  const result = text.replace(/(^[\s\n]+)|([\s\n]+$)/g, ''); // TODO 结尾的标点符号不需要处理掉吧
  // result = result.replace(/[?？:：!！]+$/g, '');
  return result;
}

function keyValueReverse(map) {
  assession(map, 'Object', 'map should be an object');
  const reversed = {};
  Object.keys(map).forEach((key) => {
    const value = map[key];
    if (!reversed[value]) {
      reversed[value] = key;
    } else {
      throw new Error(`has duplicate value of ${value}`);
    }
  });
  return reversed;
}
module.exports = {
  fsPromises,
  collectFiles,
  unique,
  postNormalizeText,
  keyValueReverse,
};
