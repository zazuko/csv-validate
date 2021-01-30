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
        try {
          console.debug(`\nProcessing: ${filename}`)
          await parseFile(filename, { relaxColumnCount, skipErrorLines, delimiter, quotes, newLine, encoding }, size => {
            // progressBar.update(Math.round((processedSize + size) / totalSize * 100))
            console.info(`Processing progress: ${Math.round((processedSize + size) / totalSize * 100)} %`)
          }).then(() => {
            console.debug(`Completed ${filename}`)
            processedSize += filesInfo[filename].size
          }).catch((err) => {
            console.error(`ERROR in ${filename}: ${err}`) // err.stack
            processedSize += filesInfo[filename].size
            Object.assign(filesInfo[filename], { failed: true, msgs: [`${err}`] })
          })
        } catch (err) {
          // Note: this should never happen if CsvParser works correctly
          console.error(`ERROR SYNC in ${filename}: ${err}`)
          processedSize += filesInfo[filename].size
          Object.assign(filesInfo[filename], { failed: true, msgs: [`${err}`] })
        }
      }
      // progressBar.update(100)
      // progressBar.stop()

      // Output final results
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
    })()
  })
  .parse(process.argv)

/** Parse a file
 *
 * @param {String} filename  - input file to be parsed
 * @param {Array} options  - parsing options
 * @param {function(sizeProcessed: int} progress  - parsing progress callback
 * @return succeed
 */
async function parseFile (filename, { relaxColumnCount, skipErrorLines, delimiter, quotes, newLine, encoding }, progress) {
  const fstream = fs.createReadStream(filename)
  if (!encoding) { encoding = 'utf8' }
  fstream.setEncoding(encoding)
  let processed = 0 // Bytes processed

  fstream.on('data', (data) => {
    // console.log(`fstream chunk size: ${data.length}`)
    // console.log(`Parsing progress: ${processed / file.size * 100} %`)
    processed += data.length
    progress(processed)
  })

  // Handle file stream data
  // const csvParser = CsvParser.import(fstream, { relaxColumnCount, skipErrorLines, delimiter, quotes, newLine })
  const parseRes = new Promise((resolve, reject) => {
    CsvParser.import(fstream, { relaxColumnCount, skipErrorLines, delimiter, quotes, newLine })
      .on('finish', function () {
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
        // fstream.close()
        reject(err)
      })
      .resume() // Omit all output data (CSV parsing results), otherwise the input consumption is stopped on filling the output buffer
  })

  // console.log('parseFile() finished')
  return parseRes
}

module.exports = parseFile
