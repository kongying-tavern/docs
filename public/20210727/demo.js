const currying = (fn, args = []) => {
  let len = fn.length
  return (..._) => {
    let arg = args.concat(_)
    if (arg.length < len) {
      return currying(fn, arg)
    }
    return fn(...arg)
  }
}

const isType = (typing, value) =>
  Object.prototype.toString.call(value) === `[object ${typing}]`
;[
  'String',
  'Number',
  'Boolean',
  'Null',
  'Undefined',
  'Date',
  'RegExp',
  'Symbol',
  'BigInt',
  'Promise',
  'Array',
  'Set',
  'Math',
  'Map',
  'WeakMap',
  'WeakSet',
  'ArrayBuffer',
  'SharedArrayBuffer',
  'Atomics',
  'JSON',
  'GeneratorFunction',
  'Intl',
  'WebAssembly',
  'Reflect',
].forEach((type) => (globalThis['is' + type] = currying(isType)(type)))
