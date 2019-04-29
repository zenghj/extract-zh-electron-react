const Types = require('./types');
/**
 * @param {*} obj 被检测的对象
 * @param {*} type 被检测的对象的类型，可以是函数或者 Types中支持的类型字符串 'Function', 'Object'等
 * @param {*} msg
 */
module.exports = function assession(obj, type, msg = 'Error') {
  const typeFn = Types[`is${type}`];
  if (Types.isFunction(typeFn)) {
    if (!typeFn(obj, type)) {
      throw new Error(msg);
    }
  } else if (Types.isFunction(type)) {
    if (!type(obj)) {
      throw new Error(msg);
    }
  } else {
    throw new Error('assession argument illegal');
  }
};
