const { Parser } = require('csv-parse')
const { Transform } = require('readable-stream')

class CsvParser extends Transform {
  constructor ({ delimiter, quoteChar, newlineStr, relaxColumnCount, skipLinesWithError } = {}) {
    super({
      readableObjectMode: true
    })

    this.parser = new Parser({
      columns: true,
      delimiter,
      info: true,
      bom: true,
      quote: quoteChar,
      record_delimiter: newlineStr,
      relax_column_count: relaxColumnCount,
      skip_lines_with_error: skipLinesWithError
    })

    this.parser.push = data => {
      if (!data) {
        return
      }

      this.push({
        line: data.info.lines,
        row: data.record
      })
    }
  }

  updateOptions ({ delimiter, quoteChar, newlineStr, relaxColumnCount, skipLinesWithError }) {
    if (delimiter !== undefined) { this.parser.__originalOptions.delimiter = delimiter }
    if (quoteChar !== undefined) { this.parser.__originalOptions.quote = quoteChar }
    if (newlineStr !== undefined) { this.parser.__originalOptions.record_delimiter = newlineStr }
    if (relaxColumnCount !== undefined) { this.parser.__originalOptions.relax_column_count = relaxColumnCount }
    if (skipLinesWithError !== undefined) { this.parser.__originalOptions.skip_lines_with_error = skipLinesWithError }
    this.parser.__normalizeOptions(this.parser.__originalOptions)
  }

  // setDelimiter (delimiter) {
  //   this.parser.options.delimiter = Buffer.from(delimiter, this.parser.options.encoding)
  // }

  // setQuote (quote) {
  //   this.parser.options.quote = Buffer.from(quote, this.parser.options.encoding)
  // }

  // setRecordDelimiter(newLine) {
  //   this.parser.options.record_delimiter = newLine
  //   if(!Array.isArray(this.parser.options.record_delimiter)){
  //     this.parser.options.record_delimiter = [this.parser.options.record_delimiter]
  //   }
  //   this.parser.options.record_delimiter = this.parser.options.record_delimiter.map( function(rd){
  //     if(typeof rd === 'string'){
  //       rd = Buffer.from(rd, this.parser.options.encoding)
  //     }
  //     return rd
  //   })
  // }

  _transform (chunk, encoding, callback) {
    try {
      this.parser.write(chunk, encoding, callback)
    } catch(err) {
      callback(err)
    }
  }

  _flush (callback) {
    this.parser.end(callback)
  }
}

module.exports = CsvParser
