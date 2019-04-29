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
};

// const jsFileSuffix = '.js';
// async function collectJSFiles({ include, exclude }) {
//   let jsFiles = [];
//   const excludes = Array.isArray(exclude) ? exclude : typeof exclude === 'string' ? [exclude] : [];
//   if (typeof include === 'string') {
//     const dir = include;
//     if (dir) {
//       const names = await fsPromises.readdir(dir);
//       const allStats = await Promise.all(
//         names.map(name =>
//           // console.log(name)
//           fsPromises.stat(path.join(dir, name)),
//         ),
//       );
//       for (let idx = 0; idx < allStats.length; idx++) {
//         const stats = allStats[idx];
//         const name = names[idx];
//         const curPath = path.join(dir, name);
//         if (stats.isDirectory()) {
//           const subFiles = await collectJSFiles({
//             include: curPath,
//             exclude: excludes,
//           });
//           jsFiles = jsFiles.concat(subFiles);
//         } else if (name.endsWith(jsFileSuffix) && !name.endsWith('.test.js')) {
//           // console.log(curPath)
//           jsFiles.push(curPath);
//         }
//       }
//       excludes.forEach((exclude) => {
//         jsFiles = jsFiles.filter(path => path.indexOf(exclude) === -1);
//       });
//       return jsFiles;
//     }
//   } else if (Array.isArray(include) && include.length > 0) {
//     const paths = await Promise.all(
//       include.map(subInclude =>
//         collectJSFiles({
//           include: subInclude,
//           exclude: excludes,
//         }),
//       ),
//     );
//     return paths.reduce((sum = [], item = []) => [...sum, ...item], jsFiles);
//   } else {
//     return [];
//   }
// }

function toArray(ele) {
  if (Array.isArray(ele)) {
    return ele;
  } else if (ele) {
    return [ele];
  }
  return [];
}


async function collectFiles({ include, exclude, suffixs = ['.js', 'jsx'], blackSuffixs = ['.test.js'] }) {
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
      // for (const file of subFiles) {
      //   await collect(file);
      // }
    }
  }

  await batchAsyncTask(collect, includes, 2);
  // for (const item of includes) {
  //   await collect(item);
  // }
  // console.log([...fileSet]);
  // let test = await collectJSFiles(...([].slice.call(arguments)))
  // console.log('test', test)
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
module.exports = {
  fsPromises,
  collectFiles,
  unique,
};
