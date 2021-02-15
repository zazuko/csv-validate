const CsvParser = require('../index')
const { PassThrough } = require('readable-stream')
const { once } = require('events')

/** Parse
 *
 * @param {File} file  - input file to be parsed
 * @param {Array} msgs  - tracing messages
 * @param {function(sizeProcessed: int)} progress  - parsing progress callback
 * @return succeed
 */
export async function parseFile (file, msgs, progress) {
  const sizeRemMB = file.size % (1024 * 1024)
  console.info(`parseFile()> Parsing ${file.size - sizeRemMB} MB and ${sizeRemMB} bytes: ${file.name}`)
  const freader = file.stream().getReader()
  const input = new PassThrough()
  const csvParser = CsvParser.import(input) // , { newLine: '\n' }
  const parseRes = new Promise((resolve, reject) => {
    csvParser
      .on('finish', function () {
        console.debug('csvParser> CSV Parser finished: ' + file.name)
        resolve()
      })
      .on('end', function () {
        console.debug('csvParser> CSV Parser ended: ' + file.name)
        resolve()
      })
      .on('error', function (err) {
        // ATTENTION: msgs are not always updated on reject, so they should be updated outside
        console.debug(`csvParser> CSV Parser failed: ${err}, msgs: ${msgs && msgs.length}`)
        // resolve(false)  // ATTENTION: Causes Uncaught (in promise) Error and hangs
        reject(err)
      })
    // .on('data', (data) => {
    //  processed += data.length
    //  console.log(`Parsing progress: ${processed / file.size * 100} %`)
    // })
      .resume() // Omit all output data (CSV parsing results), otherwise the input consumption is stopped on filling the output buffer
  })

  // Form a parser input stream form the file
  let processed = 0 // The size of the processed part of the stream in bytes
  let result
  while (!(result = await freader.read()).done) {
    // Note: drain event listener causes
    // from-browser.js:2 Uncaught Error:  Readable.from is not available in the browser
    if (!input.write(result.value)) {
      // Handle backpressure
      // console.log('parseFile()> Handling backpressure')
      await once(input, 'drain')
      // console.log('parseFile()> Backpressure passed')
    }
    processed += result.value.byteLength // value.length
    if (progress !== undefined) {
      progress(processed)
    } else console.log(`parseFile()> File parsing progress: ${processed / file.size * 100} %`)
  }
  input.end()
  console.debug('parseFile()> Input ended')

  // console.log('parseFile() finished')
  return parseRes
}
