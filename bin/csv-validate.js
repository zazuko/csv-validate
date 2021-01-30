#!/usr/bin/env node

const CsvParser = require('../index')
const fs = require('fs')
const { program } = require('commander')
const { version } = require('../package.json')

program
  .version(version)
  .arguments('<filenames...>')
  .option('-r, --relax-column-count', 'relax column count instead of emitting an error')
  .option('-s, --skip-error-lines', 'skip lines with errors instead of emitting an error')
  .option('-d, --delimiter <symbol>', 'enforce specified CSV delimiter instead of inferring it')
  .option('-q, --quotes <l-r-quotes>', 'left [and right if distinct] quote symbols instead of inferring them', '') // undefined or '' requires the inference
  .option('-n, --new-line <string>', 'enforce specified CSV new line (e.g., \\r\\n) instead of inferring it')
  .option('-e, --encoding <string>', 'file encoding', 'utf8')
  .action((filenames, { relaxColumnCount, skipErrorLines, delimiter, quotes, newLine, encoding } = {}) => {
    ;(async () => {
      let totalSize = 0 // Total size of files
      const filesInfo = {} // File size info

      for (const filename of filenames) {
        const fstat = fs.fstatSync(fs.openSync(filename, 'r'))
        totalSize += fstat.size
        filesInfo[filename] = { size: fstat.size }
        // console.log(`${filename} size: ${fstat.size}`)
      }

      let processedSize = 0 // Size of the processed files
      // // Visualize report
      // const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
      // progressBar.start(100, 0)
      for (const filename in filesInfo) {
        // Handle the file
        // const msgs = [] // Array of strings
        try {
          console.debug(`\nProcessing: ${filename}`)
          await parseFile(filename, { relaxColumnCount, skipErrorLines, delimiter, quotes, newLine, encoding }, size => {
            // console.log(`Updating ${filename} progress [${processedSize} / ${totalSize}; ${size}]: ${Math.round((processedSize + size) / totalSize * 100)}`)
            // progressBar.update(Math.round((processedSize + size) / totalSize * 100))
            console.info(`Processing progress: ${Math.round((processedSize + size) / totalSize * 100)} %`)
          }).then(() => {
            console.debug(`Completed ${filename}`)
            processedSize += filesInfo[filename].size
            // filesInfo[filename] = {}
            // traceResults()
          })
            .catch((err) => {
              console.error(`ERROR in ${filename}: ${err}`)
              processedSize += filesInfo[filename].size
              Object.assign(filesInfo[filename], { failed: true, msgs: [`${err}`] })
            // traceResults()
            })
        } catch (err) {
          console.error(`ERROR 2 in ${filename}: ${err}`)
          processedSize += filesInfo[filename].size
          Object.assign(filesInfo[filename], { failed: true, msgs: [`${err}`] })
        }
      }
      // progressBar.update(100)
      // progressBar.stop()

      console.info('\nCSV Validation Summary:')
      for (const fname in filesInfo) {
        if (filesInfo[fname].failed) {
          console.info(`${fname}    FAIL`)
        } else {
          console.info(`${fname}    OK`)
        }
        const msgs = filesInfo[fname].msgs || []
        for (const msg of msgs) {
          console.info(`    ${msg}`)
        }
      }

      // const filesInfo = {} // File size info
      // // Visualize report
      // //const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
      // //progressBar.start(100, 0)

      // function traceResults () {
      //   // console.log(`Processed ${Object.keys(filesInfo).length} / ${filenames.length}`)
      //   if (Object.keys(filesInfo).length < filenames.length) {
      //     return
      //   }
      //   //progressBar.update(100)
      //   //progressBar.stop()
      //   for (const fname in filesInfo) {
      //     if (filesInfo[fname].failed) {
      //       console.info(`${fname}    FAIL`)
      //     } else {
      //       console.info(`${fname}    OK`)
      //     }
      //     const msgs = filesInfo[fname].msgs || []
      //     for (const msg of msgs) {
      //       console.info(`    ${msg}`)
      //     }
      //   }
      // }

      // let totalSize = 0 // Total size of files
      // let processedSize = 0 // Size of the processed files
      // for (const filename of filenames) {
      //   fs.open(filename, 'r', (err, fd) => { // open, openSync
      //     if (err) {
      //       filesInfo[filename] = { failed: true, msgs: [`Can not be opened: ${err}`] }
      //       traceResults()
      //       return
      //     }

      //     // Fetch File statistics
      //     fs.fstat(fd, (err, stats) => { // fstat, fstatSync
      //       if (err) {
      //         // Object.assign(filesInfo[filename], { failed: true, msgs: [`Can not fetch the file statistics, including the size: ${err}`] })
      //         filesInfo[filename] = { failed: true, msgs: [`Can not fetch the file statistics, including the size: ${err}`] }
      //         traceResults()
      //         return
      //       }
      //       totalSize += stats.size
      //       // console.debug(`${filename} size: ${stats.size}`)

      //       // Handle the file
      //       // const msgs = [] // Array of strings
      //       parseFile(filename, { relaxColumnCount, skipErrorLines, delimiter, quotes, newLine, encoding }, size => {
      //         // console.log(`Updating ${filename} progress [${processedSize} / ${totalSize}]: ${Math.round((processedSize + size) / totalSize * 100)}`)
      //         // progressBar.update(Math.round((processedSize + size) / totalSize * 100))
      //         console.info(`Processing progress: ${Math.round((processedSize + size) / totalSize * 100)} %`)
      //       }).then(() => {
      //         console.error(`Completed: ${filename}`)
      //         processedSize += stats.size
      //         filesInfo[filename] = {}
      //         traceResults()
      //       }).catch((err) => {
      //         console.error('ERROR catched 1:' + err)
      //         processedSize += stats.size
      //         filesInfo[filename] = { failed: true, msgs: [`${err}`] }
      //         traceResults()
      //       })
      //     })
      //   })
      // }
    })()
  })
  .parse(process.argv)

// /** Show the tracing messages
//  * @param {Array} msgs  - tracing messages
// */
// function showDetails (msgs) {
//   for (const msg of msgs) {
//     console.info(`    ${msg}`)
//   }
// }

/** Parse a file
 *
 * @param {String} filename  - input file to be parsed
 * @param {Array} options  - parsing options
 * @param {function(sizeProcessed: int} progress  - parsing progress callback
 * @return succeed
 */
async function parseFile (filename, { relaxColumnCount, skipErrorLines, delimiter, quotes, newLine, encoding }, progress) {
  // const fstat = await fs.stat(await fs.open(filename, 'r')) // fstat, fstatSync
  // const fileSize = fstat.size
  // const sizeRemMB = fileSize % (1024 * 1024)
  // console.debug(`Parsing ${fileSize - sizeRemMB} MB and ${sizeRemMB} bytes: ${filename}`)

  const fstream = fs.createReadStream(filename)
  if (!encoding) { encoding = 'utf8' }
  fstream.setEncoding(encoding)
  let processed = 0 // Bytes processed

  fstream
  // .on('end', function () {
  //   console.debug(`The ${filename} is read`)
  // })
    .on('data', (data) => {
      //  console.log(`fstream chunk size: ${data.length}`)
      processed += data.length
      progress(processed)
      // console.log(`Parsing progress: ${processed / file.size * 100} %`)
    })
  // .on('error', function (err) {
  //   console.error(err.stack)
  // })

  // const csvParser = new CsvParser({ relaxColumnCount, skipErrorLines, delimiter, quotes, newLine })
  // return fstream.pipe(csvParser)
  //   .resume() // Omit all output data (CSV parsing results), otherwise the input consumption is stopped on filling the output buffer

  // return CsvParser.import(fstream, { relaxColumnCount, skipErrorLines, delimiter, quotes, newLine })
  //   .on('end', function () {
  //     console.debug('csvParser> CSV Parser ended: ' + filename)
  //   })
  //   .on('data', (data) => {
  //     processed += data.length
  //     progress(processed)
  //   // console.log(`Parsing progress: ${processed / file.size * 100} %`)
  //   })
  //   //.resume() // Omit all output data (CSV parsing results), otherwise the input consumption is stopped on filling the output buffer

  // Handle file stream data
  // const csvParser = CsvParser.import(fstream, { relaxColumnCount, skipErrorLines, delimiter, quotes, newLine })
  const parseRes = new Promise((resolve, reject) => {
    try {
      const csvParser = CsvParser.import(fstream, { relaxColumnCount, skipErrorLines, delimiter, quotes, newLine })
      csvParser.on('finish', function () {
        // console.debug('csvParser> CSV Parser finished: ' + filename)
        resolve()
      })
        .on('end', function () {
          // console.debug('csvParser> CSV Parser ended: ' + filename)
          resolve()
        })
        .on('error', function (err) {
          // ATTENTION: msgs are not always updated on reject, so they should be updated outside
          // console.debug(`csvParser> CSV Parser failed: ${err}`) // , msgs: ${msgs && msgs.length}`)
          reject(err)
        })
      // .on('data', (data) => {
      //   console.log(`Parsed bytes: ${data.length}, ${Object.keys(data)}`)
      //   processed += data.length
      //   progress(processed)
      // // console.log(`Parsing progress: ${processed / file.size * 100} %`)
      // })
        .resume() // Omit all output data (CSV parsing results), otherwise the input consumption is stopped on filling the output buffer
    } catch (err) {
      console.debug(`csvParser import> CSV Parser failed: ${err}`) // , msgs: ${msgs && msgs.length}`)
      reject(err)
    }
  })

  // fs.readFile(filename, encoding, (err, data) => {
  //   if (err) {
  //     input.emit('error', err)
  //     return
  //   }
  //   console.log(data)
  // })

  // // Form a parser input stream form the file
  // let processed = 0 // The size of the processed part of the stream in bytes
  // let result
  // while (!(result = await freader.read()).done) {
  //   // Note: drain event listener causes
  //   // from-browser.js:2 Uncaught Error:  Readable.from is not available in the browser
  //   if (!input.write(result.value)) {
  //     // Handle backpressure
  //     // console.log('parseFile()> Handling backpressure')
  //     await once(input, 'drain')
  //     // console.log('parseFile()> Backpressure passed')
  //   }
  //   processed += result.value.byteLength // value.length
  //   if (progress !== undefined) {
  //     progress(processed)
  //   } else console.log(`parseFile()> File parsing progress: ${processed / file.size * 100} %`)
  // }
  // input.end()
  // console.debug('parseFile()> Input ended')

  // console.log('parseFile() finished')
  return parseRes

  //   // const parser = new CsvParser({ relaxColumnCount, skipErrorLines, delimiter, quotes, newLine })
  // // try {
  //   const csvParser = CsvParser.import(fstream, { relaxColumnCount, skipErrorLines, delimiter, quotes, newLine })
  //   return csvParser
  //   // .on('error', function (err) {
  //   //   console.error('\n\nERROR found:' + err.stack) // err.stack
  //   // })
  //   .resume() // Omit all output data (CSV parsing results), otherwise the input consumption is stopped on filling the output buffer
  // // } catch(err) {
  // //   console.error(`ERROR catched: ` + err) // err.stack
  // // }
  // return fstream.pipe(parser)
  // .on('end', function () {
  //   console.debug(`The ${filename} parsing is completed`)
  // }).catch(err => console.error(err))

  // fstream.pipe(parser).on('readable', () => {
  //   // Use a loop to make sure we read all currently available data
  //   while (null !== (chunk = readable.read()))
  //     console.log(fstream.read())  // Read the subsequent chunk
  // }).catch(err => console.error(err))

  // fstream.pipe(parser).on('data', (chunk) => {
  //   console.log(chunk.toString())  // chunk
  // })

  // const freader = file.stream().getReader()
  // const input = new PassThrough()
  // const csvParser = CsvParser.import(input) // , { newLine: '\n' }
  // const parseRes = new Promise((resolve, reject) => {
  //   csvParser
  //     .on('finish', function () {
  //       console.debug('csvParser> CSV Parser finished: ' + file.name)
  //       resolve(fileSize)
  //     })
  //     .on('end', function () {
  //       console.debug('csvParser> CSV Parser ended: ' + file.name)
  //       resolve(fileSize)
  //     })
  //     .on('error', function (err) {
  //       // ATTENTION: msgs are not always updated on reject, so they should be updated outside
  //       console.debug(`csvParser> CSV Parser failed: ${err}, msgs: ${msgs && msgs.length}`)
  //       // resolve(false)  // ATTENTION: Causes Uncaught (in promise) Error and hangs
  //       reject(err)
  //     })
  //   // .on('data', (data) => {
  //   //  processed += data.length
  //   //  console.log(`Parsing progress: ${processed / file.size * 100} %`)
  //   // })
  //     .resume() // Omit all output data (CSV parsing results), otherwise the input consumption is stopped on filling the output buffer
  // })

  // // Form a parser input stream form the file
  // let processed = 0 // The size of the processed part of the stream in bytes
  // let result
  // while (!(result = await freader.read()).done) {
  //   // Note: drain event listener causes
  //   // from-browser.js:2 Uncaught Error:  Readable.from is not available in the browser
  //   if (!input.write(result.value)) {
  //     // Handle backpressure
  //     // console.log('parseFile()> Handling backpressure')
  //     await once(input, 'drain')
  //     // console.log('parseFile()> Backpressure passed')
  //   }
  //   processed += result.value.byteLength // value.length
  //   if (progress !== undefined) {
  //     progress(processed)
  //   } else console.log(`parseFile()> File parsing progress: ${processed / file.size * 100} %`)
  // }
  // input.end()
  // console.debug('parseFile()> Input ended')

  // // console.log('parseFile() finished')
  // return parseRes
}

module.exports = parseFile
