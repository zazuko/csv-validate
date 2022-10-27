#!/usr/bin/env node

const Parser = require('../index.js')

const fs = require('fs')
const program = require('commander')

program
  .arguments('<filename>')
  .option('-r, --relax-column-count', 'relax column count instead of emitting an error')
  .option('-s, --skip-error-lines', 'skip lines with errors instead of emitting an error')
  .option('-d, --delimiter <symbol>', 'enforce specified CSV delimiter instead of inferring it')
  .option('-q, --quotes <l-r-quotes>', 'left [and right if distinct] quote symbols instead of inferring them', '') // undefined or '' requires the inference
  .option('-n, --new-line <string>', 'enforce specified CSV new line (e.g., \\r\\n) instead of inferring it')
  .option('-e, --encoding <string>', 'file encoding', 'utf8')
  .action((filename, { relaxColumnCount, skipErrorLines, delimiter, quotes, newLine, encoding } = {}) => {
    const fstream = fs.createReadStream(filename)
    if (!encoding) { encoding = 'utf8' }
    fstream.setEncoding(encoding)

    fstream.on('end', function () {
      console.debug(`The ${filename} is read`)
    }).on('error', function (err) {
      console.error(err.stack)
    })

    const parser = new Parser({ relaxColumnCount, skipErrorLines, delimiter, quotes, newLine })

    parser.import(fstream, { relaxColumnCount, skipLinesWithError: skipErrorLines })
  })

program.parse(process.argv)
