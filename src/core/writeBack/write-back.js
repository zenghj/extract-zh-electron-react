const babylon = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { fsPromises } = require('../utils/helper');
const { postNormalizeText } = require('../utils/helper');
const generate = require('@babel/generator').default;
const babelTypes = require('babel-types');
const path = require('path');
const assession = require('../utils/assession');
const resolve = (relative) => path.resolve(__dirname, relative);
const AST_NODE_TYPES = {
  JSXText: 'JSXText',
  StringLiteral: 'StringLiteral',
  ObjectProperty: 'ObjectProperty',
  JSXAttribute: 'JSXAttribute',
  JSXExpressionContainer: 'JSXExpressionContainer',
  TemplateElement: 'TemplateElement',
};

module.exports = async function writeBack(filePath, dirctionary, globalI18nFnName) {
  const exceptions = [];

  function writeJSXText(path, key, nodeVal) {
    const node = path.node;
    const fnStr = `{${globalI18nFnName}('${key}')}`;
    let str = '';
    if (node.value.length === nodeVal.length) {
      str = fnStr;
    } else {
      str = node.value.replace(nodeVal, fnStr);
    }
    node.value = str;
  }

  function getConcatedStr(trimedStr, originStr, fnStr) {
    assession(trimedStr, 'String', 'trimedStr should be a string');
    assession(originStr, 'String', 'originStr should be a string');
    assession(fnStr, 'String', 'fnStr should be a string');
    let str = '';
    if (trimedStr.length === originStr.length) {
      str = fnStr;
    } else {
      const index = originStr.indexOf(trimedStr);
      const left = originStr.slice(0, index);
      const right = originStr.slice(index + trimedStr.length);
      // eslint-disable-next-line prefer-template
      str = '`' + left + '${' + fnStr + '}' + right + '`';// TODO 使用字符串模板是不是不太好，如果有嵌套的会不会出问题
    }
    return str;
  }
  function getI18nFnInvokeStr(key) {
    assession(key, 'String', 'key should be a string');
    return `${globalI18nFnName}('${key}')`;
  }
  function writeJSXAttributeValue(path, key, nodeVal) {
    let str = '';
    const node = path.node;
    const fnStr = getI18nFnInvokeStr(key);
    str = getConcatedStr(nodeVal, node.value, fnStr);
    // if (!path.container || path.container.type !== AST_NODE_TYPES.JSXExpressionContainer) {
    //   str = `{${str}}`;
    // }
    path.replaceWith(babelTypes.JSXExpressionContainer(babelTypes.identifier(str)));
    // path.replaceWithSourceString(str);
  }

  function writeObjectProperty(path, key, nodeVal) {
    exceptions.push(nodeVal);
    const fnStr = getI18nFnInvokeStr(key);
    const str = getConcatedStr(nodeVal, path.node.value, fnStr);
    if (path.container.computed) { // 计算属性
      // path.node.value = path.node.value.replace(nodeVal, fnStr);
      // path.node.value = getConcatedStr(nodeVal, path.node.value, fnStr);
      path.replaceWithSourceString(str);
    } else { // 普通非计算属性
      // path.node.value = path.node.value
      path.container.computed = true;
      path.replaceWithSourceString(str);
    }
  }
  function writeStringLiteral(path, key, nodeVal) {
    const args = Array.from(arguments);
    // if (path.container && path.container.type === AST_NODE_TYPES.ObjectProperty) {
    //   return writeObjectProperty(...args);
    // }
    const node = path.node;
    const fnStr = getI18nFnInvokeStr(key);
    let str = '';
    if (node.value.length === nodeVal.length) {
      str = fnStr;
    } else {
      const index = node.value.indexOf(nodeVal);
      const left = node.value.slice(0, index);
      const right = node.value.slice(index + nodeVal.length);
      // eslint-disable-next-line prefer-template
      str = '`' + left + '${' + fnStr + '}' + right + '`';
    }
    if (path.container && path.container.type === AST_NODE_TYPES.ObjectProperty) {
      if (path.key === 'key') {
        writeObjectProperty(...args);
        // console.warn('暂不处理prop key'); // TODO 由于存在 computed property name的问题
        // path.replaceWithSourceString(`[${str}]`);
      } else {
        path.replaceWithSourceString(str);
      }
    } else if (path.container && path.container.type === AST_NODE_TYPES.JSXAttribute && path.key === 'value') {
      // JSXAttribute 属性值
      writeJSXAttributeValue(...args);
    } else {
      path.replaceWithSourceString(str);
    }
  }

  function writeTemplateElement(path, key, nodeVal) {
    const fnStr = getI18nFnInvokeStr(key);
    // let str = getConcatedStr(nodeVal, path.node.value.raw, fnStr);
    const str = path.node.value.raw.replace(nodeVal, `\${${fnStr}}`);
    path.node.value.raw = str;
    // path.replaceWith(babelTypes.templateElement(babelTypes.identifier(str)));
  }

  const code = await fsPromises.readFile(filePath, {
    encoding: 'utf-8',
  });
  const ast = babylon.parse(code, {
    sourceType: 'module',
    plugins: ['classProperties', 'jsx'],
  });
  // console.log(JSON.stringify(ast))
  const noKeyVals = [];
  traverse(ast, {
    enter(path) {
      const node = path.node;
      let nodeVal = path.node.value;
      // let originNodeVal = nodeVal;
      const zhReg = /[\u4e00-\u9fa5]/;
      if (nodeVal && typeof nodeVal === 'string') {
        if (zhReg.test(nodeVal)) {
          nodeVal = postNormalizeText(nodeVal);
          const key = dirctionary[nodeVal];
          if (key) {
            if (node.type === AST_NODE_TYPES.JSXText) {
              writeJSXText(path, key, nodeVal);
            } else if (node.type === AST_NODE_TYPES.StringLiteral) {
              writeStringLiteral(path, key, nodeVal);
            } else {
              console.error('unhandled node.type', node.type);
            }
          } else if (nodeVal) {
            noKeyVals.push(nodeVal);
            // console.log('此key找不到', nodeVal);
          }
        }
      } else if (node.type === AST_NODE_TYPES.TemplateElement) {
        nodeVal = postNormalizeText(node.value.raw);
        const key = dirctionary[nodeVal];
        if (key) {
          writeTemplateElement(path, key, nodeVal);
        } else if (nodeVal) {
          noKeyVals.push(nodeVal);
        }
      }
    },
  });
  const generated = generate(ast, {
    comments: true,
  }, code);
  // console.log(generated.code);
  fsPromises.writeFile(resolve('../extractZh/src-extract-source/demo.file-modify.js'), generated.code);
  fsPromises.writeFile(resolve('../extractZh/src-extract-source/ast.json'), JSON.stringify(ast));
  return {
    noKeyVals,
    exceptions,
  };
};
