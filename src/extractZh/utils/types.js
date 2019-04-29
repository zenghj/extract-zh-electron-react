const objProto = Object.prototype;
const types = [
  'Object',
  'Array',
  'Function',
  'String',
  'Number',
  'Boolean',
  'Undefined',
  'Null',
  'Symbol',
];
const Types = types.reduce((utilObj, type) => {
  utilObj[`is${type}`] = function (obj) {
    return objProto.toString.call(obj) === `[object ${type}]`;
  };
  return utilObj;
}, {});

module.exports = Types;
