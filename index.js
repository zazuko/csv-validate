const CsvParser = require('./lib/CsvParser')
const CSVSniffer = require('csv-sniffer')
// const Stream = require('readable-stream')
const { Readable } = require('readable-stream')

// quote.charAt(0); quote.slice(-1); quote.charAt(quote.length - 1)

//* Parser of the input stream (JS string chunks that have UTF16 encoding in ES6)
class Parser { // ValidatingParser
  constructor ({
    relaxColumnCount, skipLinesWithError,
    delimiter, quotes, // Inferred if not specified
    newLine // Optionally used only when quotes or delimiter are inferred
  } = {}
  ) {
    this.relaxColumnCount = relaxColumnCount
    this.skipLinesWithError = skipLinesWithError
    this.delimiter = delimiter
    this.quotes = quotes
    this.newLine = newLine
    // this.logger = logger
  }

  import (input, {
    relaxColumnCount = this.relaxColumnCount,
    skipLinesWithError = this.skipLinesWithError
  } = {}) {
    // input.setEncoding('utf8')
    // console.log(`Parser.import(), input encoding: ${input.readableEncoding}`)
    const output = new CsvParser({
      delimiter: this.delimiter, // ? this.delimiter : ',', // parsedMetadata.delimiter, // this.delimiter = ','
      // ATTENTION: the spread operator ([...symb]) is required in case of a unicode quote that is represented with more than a single code point
      // TODO: consider distinct opening and closing unicode quotes
      quoteChar: this.quotes, // ? [...this.quotes][0] : '"', // parsedMetadata.quoteChar, // this.quoteChar = '"'
      newlineStr: this.newLine,
      relaxColumnCount,
      skipLinesWithError
    })

    // Process the remained input data
    input.on('error', (err) => {
      output.emit('error', err)
      // if (!output.readable) {
      //   output.emit('end')
      // }
    })
    // .on('end', () => {
    //   if (!output.readable) {
    //     output.emit('end')
    //   }
    // })

    // output.on('error', (err) => {
    //   // output.emit('error', err)
    //   console.error(err) // ? Same as throw new Error(err)
    // }

    // Identify delimiter and quotes, given the CSV stream
    if (!this.delimiter || !this.quotes) {
      let inpPart = '' // Partial input string
      // const inpDataStream = new Stream.Readable({ read () {} })

      //* Processing of the partial input string
      const inpPartProc = () => {
        // Sniff the fetch data
        // const csvDelimiters = [',', ';', '\t']
        const sniffer = new (CSVSniffer())() // (CsvSniffer())(csvDelimiters)
        // TODO: consider unicode delimiter and quotes
        const csvMeta = sniffer.sniff(inpPart,
          {
            delimiter: (this.delimiter || '')[0],
            quoteChar: (this.quotes || '')[0],
            newlineStr: this.newLine
          })

        const updOpts = {}
        if (!this.delimiter && csvMeta.delimiter) {
          console.info(`Inferred delimiter: ${csvMeta.delimiter}`)
          updOpts.delimiter = this.delimiter = csvMeta.delimiter
          // console.info(`inpPartProc() after sniffing: delimiter: ${output.parser.options.delimiter}, quote: ${output.parser.options.quote}`)
          // output.setDelimiter(this.delimiter) // || ','
        }
        if (!this.quotes && csvMeta.quoteChar) {
          console.info(`Inferred quoteChar: ${csvMeta.quoteChar}`)
          updOpts.quoteChar = this.quotes = csvMeta.quoteChar // || ''
          // output.parser.setQuote([...this.quotes][0]) // || '"'
        }
        if (!this.newLine && csvMeta.newlineStr) {
          let cpoints = ''
          for (const cp of csvMeta.newlineStr) { cpoints += ' 0x' + cp.codePointAt(0).toString(16).toUpperCase() }
          console.info(`Inferred newLine (codepoints): ${cpoints}`)
          updOpts.newlineStr = this.newLine = csvMeta.newlineStr // || ''
        }

        if (Object.keys(updOpts).length !== 0) { output.updateOptions(updOpts) }

        // Process the sniffed data
        // console.info(`inpPartProc() after sniffing: delimiter: ${output.parser.options.delimiter}, quote: ${output.parser.options.quote}`)

        // ATTENTION: Readable.from is not available in the browser
        // const rdinp = Readable.from([inpPart])
        const rdinp = new Readable()
        rdinp.push(inpPart)
        rdinp.push(null)

        rdinp.on('error', (err) => {
          output.emit('error', err)
        }).pipe(output) // , { end: false }
          .on('end', () => {
            input.pipe(output)
          })

        // console.debug(`inpPartProc() outputting, nlf: ${nlf}, ncr: ${ncr}, inpPart [${inpPart.length}]`)
        // input.pipe(output)
      }

      const linesMin = 10 // Min number of lines to read for the automatic inference
      const lengthMax = 512 * 1024 // Soft max number of codepoints to be read for sniffing
      const clf = '\n'.codePointAt(0)
      const ccr = '\r'.codePointAt(0)
      let nlf = 0 // Linefeed counter
      let ncr = 0 // Carriage return counter
      // const stopRead = () => {
      //   return Math.max(nlf, ncr) >= linesMin || inpPart.length >= lengthMax
      // }
      const onReadable = () => {
        // if (stopRead()) { return }
        let chunk
        // Use a loop to make sure we read all currently available data
        while ((chunk = input.read()) !== null) {
          // Count the number of newline symbols to identify the number of lines to process
          for (const c of chunk) {
            if (c === clf) { // codePointAt(0)
              ++nlf
            } else if (c === ccr) {
              ++ncr
            } // else console.log(c)
          }
          // inpDataStream.push(chunk)
          inpPart += chunk
          // console.debug(`onReadable(), nlf: ${nlf}, ncr: ${ncr}, inpPart [${inpPart.length}]`)
          if (Math.max(nlf, ncr) >= linesMin || inpPart.length >= lengthMax) {
            input.removeListener('readable', onReadable)
            inpPartProc()
            return
          }
        }

        if (chunk === null && inpPart) {
          input.removeListener('readable', onReadable)
          inpPartProc()
        }
      }

      input.on('readable', onReadable)
    } else input.pipe(output)

    return output
  }

  static import (input, options) {
    return (new Parser(options)).import(input)
  }
}

module.exports = Parser
