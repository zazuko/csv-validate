#!/usr/bin/env node

const Parser = require('../index.js')

const fs = require('fs')
const program = require('commander')

program
  .arguments('<filename>')
  .option('-e, --encoding <string>', 'file encoding', 'utf8')
  .option('-d, --delimiter <symbol>', 'enforce specified CSV delimiter instead of inferring it')
  .option('-q, --quotes <l-r-quotes>', 'left [and right if distinct] quote symbols', '"')
  .option('-r, --relax-column-count', 'relax column count instead of emitting an error')
  .option('-s, --skip-error-lines', 'skip lines with errors instead of emitting an error')
  .action((filename, { encoding, delimiter, quotes, relaxColumnCount, skipErrorLines } = {}) => {
    const fstream = fs.createReadStream(filename)
    if (!encoding) { encoding = 'utf8' }
    fstream.setEncoding(encoding)

    fstream.on('end', function () {
      console.info(`The ${filename} is read`)
    })

    fstream.on('error', function (err) {
      console.error(err.stack)
    })

    // Handle file stream data
    const parser = new Parser({ delimiter, quotes, relaxColumnCount, skipErrorLines })

    parser.on('end', function () {
      console.info(`The ${filename} parsing is completed`)
    })

    fstream.pipe(parser).on('readable', () => {
      console.log(fstream.read())
    }).catch(err => console.error(err))

    // fstream.pipe(parser).on('data', (chunk) => {
    //   console.log(chunk.toString())  // chunk
    // })
  })

program.parse(process.argv)
