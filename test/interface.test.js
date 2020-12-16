/* global describe, it */

const assert = require('assert')
const { PassThrough } = require('readable-stream')
const Parser = require('../index')
const { consume } = require('./utils')

describe('csvValidatingParser', () => {
  it('should be a function', () => {
    assert.strictEqual(typeof Parser, 'function')
  })

  it('should have the import function, which should return a Transform', () => {
    assert.strictEqual(typeof Parser.import, 'function')

    const input = new PassThrough()
    const parser = Parser.import(input, { newLine: '\n' })
    assert.strictEqual(parser.readable, true)
    assert.strictEqual(parser.writable, true)
  })

  it('should parse CSV with header', () => {
    const input = new PassThrough()
    input.write('key1,key2\n')
    input.write('value1_1,value2_1\n')
    input.write('value1_2,value2_2\n')
    input.write('value1_3,value2_3\n')
    input.end()

    // const parser = new Parser()
    consume(Parser.import(input, { newLine: '\n' }))
  })

  it('should parse CSV with BOM', async () => {
    const input = new PassThrough()
    input.write('\ufeffkey1,key2\n')
    input.write('value1_1,value2_1\n')
    input.end()

    const expected = [{
      line: 2,
      row: {
        key1: 'value1_1',
        key2: 'value2_1'
      }
    }]

    const output = []
    const parser = Parser.import(input, { newLine: '\n' })
    parser.on('data', (data) => {
      output.push(data)
    })

    await consume(parser)
    assert.deepStrictEqual(output, expected)
  })

  it('should output objects with line number and row data', () => {
    const input = new PassThrough()
    input.write('key1,key2\n')
    input.write('value1_1,value2_1\n')
    input.write('value1_2,value2_2\n')
    input.end()

    const expected = [{
      line: 2,
      row: {
        key1: 'value1_1',
        key2: 'value2_1'
      }
    }, {
      line: 3,
      row: {
        key1: 'value1_2',
        key2: 'value2_2'
      }
    }]

    const output = []
    // const parser = Parser.import(input, { newLine: '\n', quotes: '"', delimiter: ',' })
    const parser = Parser.import(input, { newLine: '\n', quotes: '"' })
    parser.on('data', (data) => {
      output.push(data)
    })

    return consume(parser).then(() => {
      assert.deepStrictEqual(output, expected)
    })
  })

  it('should parse lines with a common alternative delimiter (;)', () => {
    const input = new PassThrough()
    input.write('key1;key2;key3\n')
    input.write('value1_1;value2_1;value3_1\n')
    input.write('value1_2;value2_2;\n')
    input.write('value1_3;value2_3;value3_3\n')
    input.write('value1_4;value2_4;value3_4\n')
    input.write('value1_5;value2_5;value3_5\n')

    input.end()

    const expected = [{
      line: 2,
      row: {
        key1: 'value1_1',
        key2: 'value2_1',
        key3: 'value3_1'
      }
    }, {
      line: 3,
      row: {
        key1: 'value1_2',
        key2: 'value2_2',
        key3: ''
      }
    }]

    const output = []
    const parser = Parser.import(input) // , { newLine: '\n' }
    // const parser = Parser.import(input, { delimiter: ';' })
    parser.on('data', (data) => {
      if (output.length < 2) { output.push(data) }
    })

    return consume(parser).then(() => {
      assert.deepStrictEqual(output, expected)
    })
  })

  //   it('should parse lines with a non-common alternative (|) and missing ending delimiter', () => {
  //     const input = new PassThrough()
  //     input.write('key1|key2|key3\n')
  //     input.write('value1_1|value2_1|value3_1\n')
  //     input.write('value1_2|\n')
  //     input.end()

  //     const expected = [{
  //       line: 2,
  //       row: {
  //         key1: 'value1_1',
  //         key2: 'value2_1',
  //         key3: 'value3_1'
  //       }
  //     }, {
  //       line: 3,
  //       row: {
  //         key1: 'value1_2',
  //         key2: undefined,
  //         key3: undefined
  //       }
  //     }]

  //     const output = []
  //     const parser = Parser.import(input, { newLine: '\n' })
  //     parser.on('data', (data) => {
  //       output.push(data)
  //     })

  //     console.log(`output: ${output} vs expected: ${expected}`)
  //     return consume(parser).then(() => {
  //       assert.deepStrictEqual(output, expected)
  //     })
  //   })

  //   it('should parse lines with an alternative (|) and missing ending delimiter, and multi-symbol new lines', () => {
  //     const input = new PassThrough()
  //     input.write('key1|key2|key3\r\n')
  //     input.write('value1_1|value2_1;\r\n')
  //     input.write('value1_2|\r\n')
  //     input.write('value1_3|value2_3|value3_3\r\n')
  //     input.write('value1_4|value2_4|value3_4\r\n')
  //     input.write('value1_5|value2_5|value3_5\r\n')
  //     input.end()

  //     const expected = [{
  //       line: 2,
  //       row: {
  //         key1: 'value1_1',
  //         key2: 'value2_1',
  //         key3: 'value3_1'
  //       }
  //     }, {
  //       line: 3,
  //       row: {
  //         key1: 'value1_2',
  //         key2: undefined,
  //         key3: undefined
  //       }
  //     }]

  //     const output = []
  //     const parser = Parser.import(input, { newLine: '\r\n' })
  //     parser.on('data', (data) => {
  //       if (output.length < 2) { output.push(data) }
  //     })

  //     console.log(`output: ${output} vs expected: ${expected}`)
  //     return consume(parser).then(() => {
  //       assert.deepStrictEqual(output, expected)
  //     })
  //   })

  //   it('should parse lines with an alternative (|) and missing ending delimiter, and gues new lines', () => {
  //     const input = new PassThrough()
  //     input.write('key1|key2|key3\n')
  //     input.write('value1_1|value2_1|value3_1\n')
  //     input.write('value1_2|\n')
  //     input.write('value1_3|value2_3|value3_3\n')
  //     input.write('value1_4|value2_4|value3_4\n')
  //     input.write('value1_5|value2_5|value3_5\n')
  //     input.end()

  //     const expected = [{
  //       line: 2,
  //       row: {
  //         key1: 'value1_1',
  //         key2: 'value2_1',
  //         key3: 'value3_1'
  //       }
  //     }, {
  //       line: 3,
  //       row: {
  //         key1: 'value1_2',
  //         key2: undefined,
  //         key3: undefined
  //       }
  //     }]

  //     const output = []
  //     const parser = Parser.import(input)
  //     parser.on('data', (data) => {
  //       if (output.length < 2) { output.push(data) }
  //     })

//     return consume(parser).then(() => {
//       assert.deepStrictEqual(output, expected)
//     })
//   })
})
