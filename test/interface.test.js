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
    return consume(parser, output).then(() => {
      assert.deepStrictEqual(output, expected)
    })
  })

  it('should parse lines with a common alternative delimiter (;) and a newline (\\n) identification', () => {
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

  it('should parse lines with a non-common alternative delimiter (D), identifying a multi-symbol newline (\\r\\n)', () => {
    const input = new PassThrough()
    input.write('key1|keyD|key3\r\n')
    input.write('value1_1|valueD_1|value3_1\r\n')
    input.write('value1_D||\r\n')
    input.write('value1_3|valueD_3|value3_3\r\n')
    input.end()

    const expected = [{
      line: 2,
      row: {
        'key1|key': 'value1_1|value',
        '|key3': '_1|value3_1'
      }
    }, {
      line: 3,
      row: {
        'key1|key': 'value1_',
        '|key3': '||'
      }
    }, {
      line: 4,
      row: {
        'key1|key': 'value1_3|value',
        '|key3': '_3|value3_3'
      }
    }]

    const output = []
    const parser = Parser.import(input)
    return consume(parser, output).then(() => {
      assert.deepStrictEqual(output, expected)
    })
  })

  it('should parse lines with a non-common alternative delimiter (|), which is missed in the end of line, and identification of a multi-symbol newline (\\n\\r)', () => {
    const input = new PassThrough()
    input.write('keyA|keyB|keyC|keyD\n\r')
    input.write('value1_1|value2_1|value3_1|value4_1\n\r')
    input.write('valueA_2|||\n\r')
    input.write('value1_3|value2_3|value3_3|value4_3\n\r')
    input.end()

    const expected = [{
      line: 2,
      row: {
        keyA: 'value1_1',
        keyB: 'value2_1',
        keyC: 'value3_1',
        keyD: 'value4_1'
      }
    }, {
      line: 3,
      row: {
        keyA: 'valueA_2',
        keyB: '',
        keyC: '',
        keyD: ''
      }
    }, {
      line: 4,
      row: {
        keyA: 'value1_3',
        keyB: 'value2_3',
        keyC: 'value3_3',
        keyD: 'value4_3'
      }
    }]

    const output = []
    const parser = Parser.import(input)
    return consume(parser, output).then(() => {
      assert.deepStrictEqual(output, expected)
    })
  })
})
