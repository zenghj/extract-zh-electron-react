const babylon = require('@babel/parser');
// const babel = require('@babel/core')
const traverse = require('@babel/traverse').default;
const { postNormalizeText } = require('../utils/helper');
const assession = require('./assession');
/**
 *
 * @param {string} codeStr
 * @returns {Array}
 */
function extractZh(code) {
  const ast = babylon.parse(code, {
    sourceType: 'module',
    plugins: ['classProperties', 'jsx'],
  });
  console.log(JSON.stringify(ast));
  const zhNodes = [];
  const zhsMap = {}; // map去重; 这里只是去掉了单个文件中重复的
  traverse(ast, {
    enter(path) {
      let nodeVal = path.node.value;
      const loc = path.node.loc;
      function addNewStrNode(val) {
        assession(val, 'String', 'val should be a string');
        const zhReg = /[\u4e00-\u9fa5]/;
        if (!zhReg.test(val)) return;
        val = postNormalizeText(val);
        if (!zhsMap[val]) {
          zhNodes.push({
            value: val,
            loc,
          });
          zhsMap[val] = true;
        }
      }
      if (nodeVal) {
        if (typeof nodeVal === 'string') {
          addNewStrNode(nodeVal);
        } else if (typeof nodeVal === 'object' && typeof nodeVal.raw === 'string') {
          nodeVal = nodeVal.raw;
          addNewStrNode(nodeVal);
        }
      }
    },
  });
  return zhNodes;
}

module.exports = extractZh;
