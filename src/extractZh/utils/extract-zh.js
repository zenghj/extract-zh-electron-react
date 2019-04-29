const babylon = require('@babel/parser');
// const babel = require('@babel/core')
const traverse = require('@babel/traverse').default;

function postNormalizeText(text) {
  let result = text.replace(/(^[\s\n]+)|([\s\n]+$)/g, '');
  result = result.replace(/[?？:：!！]+$/g, '');
  return result;
}
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
  const zhNodes = [];
  const zhsMap = {}; // map去重; 这里只是去掉了单个文件中重复的
  traverse(ast, {
    enter(path) {
      let nodeVal = path.node.value;
      const zhReg = /[\u4e00-\u9fa5]/;
      if (nodeVal && typeof nodeVal === 'string') {
        if (zhReg.test(nodeVal)) {
          nodeVal = postNormalizeText(nodeVal);
          if (!zhsMap[nodeVal]) {
            zhNodes.push({
              value: nodeVal,
              loc: path.node.loc,
            });
            zhsMap[nodeVal] = true;
          }
        }
      }
    },
  });
  return zhNodes;
}

module.exports = extractZh;
