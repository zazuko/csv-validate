const CsvParser = require('./lib/CsvParser')
// const { Sniffer } = require('csv-sniffer')

// quote.charAt(0); quote.slice(-1); quote.charAt(quote.length - 1)

//! Parser of the input stream (JS string chunks that have UTF16 encoding in ES6)
class Parser {
  constructor ({
    delimiter, quotes,
    relaxColumnCount, skipLinesWithError
  } = {}
  ) {
    this.delimiter = delimiter
    this.quotes = quotes
    this.relaxColumnCount = relaxColumnCount
    this.skipLinesWithError = skipLinesWithError
  }

  import (input, {
    relaxColumnCount = this.relaxColumnCount,
    skipLinesWithError = this.skipLinesWithError
  } = {}) {
    // const csvDelimiters = [',', ';', '\t']
    // const sniffer = new (CSVSniffer())(csvDelimiters)
    // input.pipe(csvSniffer)

    const output = new CsvParser({
      delimiter: ',', // parsedMetadata.delimiter, // this.delimiter = ','
      quoteChar: '"', // parsedMetadata.quoteChar, // this.quoteChar = '"'
      relaxColumnCount,
      skipLinesWithError
    })

    // csvSniffer.on('error', (err) => {
    //   output.emit('error', err)
    // })

    input.on('error', (err) => {
      output.emit('error', err)
    })

    input.on('end', () => {
      if (!output.readable) {
        output.emit('end')
      }
    })

    // csvSniffer.data.pipe(output, { end: false })
    input.pipe(output)

    return output
  }

  static import (input, options) {
    return (new Parser(options)).import(input)
  }
}

module.exports = Parser
