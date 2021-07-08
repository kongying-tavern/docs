import { parse, stringify } from 'qs'

describe('parse', () => {
  //分组
  test('one', () => {
    //测试用例
    expect(parse('name=A8').name).toBe('A8')
  })
  test('two', () => {
    expect(parse('name=A8&age=9').age).toBe('9')
  })
})

describe('stringify', () => {
  test('one', () => {
    expect(stringify({ name: 'A8' })).toBe('name=A8')
  })
  test('two', () => {
    expect(stringify({ name: 'A8', age: 9 })).toBe('name=A8&age=9')
  })
})
