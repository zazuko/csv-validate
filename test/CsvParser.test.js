/* global describe, it */

const assert = require('assert')
const { PassThrough } = require('readable-stream')
const CsvParser = require('../lib/CsvParser')
const { consume } = require('./utils')

describe('csvParser', () => {
  it('should be a function', () => {
    assert.strictEqual(typeof CsvParser, 'function')
  })

  it('should return a Transform', () => {
    const parser = new CsvParser()

    assert.strictEqual(parser.readable, true)
    assert.strictEqual(parser.writable, true)
  })

  it('should parse CSV with header', () => {
    const input = new PassThrough()
    const parser = new CsvParser()

    input.pipe(parser)

    parser.resume()

    input.write('key0,key1\n')
    input.write('value0,value1\n')
    input.end()

    consume(parser)
  })

  it('should parse CSV with BOM', async () => {
    const input = new PassThrough()
    const parser = new CsvParser()

    input.pipe(parser)

    const expected = [{
      line: 2,
      row: {
        key0: 'value0',
        key1: 'value1'
      }
    }]

    const output = []
    parser.on('data', (data) => {
      output.push(data)
    })

    input.write('\ufeffkey0,key1\n')
    input.write('value0,value1\n')
    input.end()

    await consume(parser)
    assert.deepStrictEqual(output, expected)
  })

  it('should output objects with line number and row data', () => {
    const input = new PassThrough()
    const parser = new CsvParser()

    input.pipe(parser)

    const expected = [{
      line: 2,
      row: {
        key0: 'value0',
        key1: 'value1'
      }
    }]

    const output = []
    parser.on('data', (data) => {
      output.push(data)
    })

    input.write('key0,key1\n')
    input.write('value0,value1\n')
    input.end()

    consume(parser).then(() => {
      assert.deepStrictEqual(output, expected)
    })
  })

  it('should parse lines with alternative delimiter', () => {
    const input = new PassThrough()
    const parser = new CsvParser({ delimiter: ';' })

    input.pipe(parser)

    const expected = [{
      line: 2,
      row: {
        key0: 'value0',
        key1: 'value1'
      }
    }]

    const output = []
    parser.on('data', (data) => {
      output.push(data)
    })

    input.write('key0;key1\n')
    input.write('value0;value1\n')
    input.end()

    consume(parser).then(() => {
      assert.deepStrictEqual(output, expected)
    })
  })
})
