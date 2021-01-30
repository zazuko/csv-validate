const CsvParser = require('../index')
// ATTENTION, Readable.from is not supported in a browser> from-browser.js:2 Uncaught Error:  Readable.from is not available in the browser
// const { Readable } = require('readable-stream')
const { PassThrough } = require('readable-stream')
const { once } = require('events')
const { version } = require('../package.json')

;(function () {
  // Drag-and-Drop File Uploader With Progress Bar (Vanilla JavaScript)
  // https://www.smashingmagazine.com/2018/01/drag-drop-file-uploader-vanilla-js/

  const fileElem = document.getElementById('fileElem')
  fileElem.addEventListener('change', function () { handleFiles(this.files) }, false)

  const dropArea = document.getElementById('drop-area')

  // Show the version number
  const appVersion = document.getElementById('app-version')
  appVersion.textContent = version

  // Prevent default behaviors
  ;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false)
  })

  function preventDefaults (e) {
    e.preventDefault()
    e.stopPropagation()
  }

  // Highligh the dropping area
  ;['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false)
  })

  ;['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false)
  })

  function highlight (e) {
    dropArea.classList.add('highlight')
  }

  function unhighlight (e) {
    dropArea.classList.remove('highlight')
  }

  // Process the file dropping event
  dropArea.addEventListener('drop', handleDrop, false)

  function handleDrop (e) {
    const dt = e.dataTransfer
    // Note: there are different interfaces exist for files processing: DataTransferItemList vs
    let files = dt.files // Use DataTransfer interface to access the file(s)
    if (files === undefined && dt.items) {
      // If dropped items aren't files, reject them
      files = [...dt.items].filter(e => e.kind === 'file').map(e => e.getAsFile())
    }
    handleFiles(dt.files)
  }

  // function previewFile(file) {
  //     let reader = new FileReader()
  //     reader.readAsDataURL(file)
  //     reader.onloadend = function() {
  //         let img = document.createElement('img')
  //         img.src = reader.result
  //         document.getElementById('gallery').appendChild(img)
  //     }
  // }

  // Reading csv file using JavaScript and HTML5: https://www.js-tutorials.com/javascript-tutorial/reading-csv-file-using-javascript-html5/
  // The Local files are opened with FileReader API, and remote files are downloaded with XMLHttpRequest
})()

function removeElement (eid) {
  const el = document.getElementById(eid)
  if (el) {
    el.parentElement.removeChild(el)
  }
}

/** Parse
 *
 * @param {File} file  - input file to be parsed
 * @param {Array} msgs  - tracing messages
 * @param {function(sizeProcessed: int} progress  - parsing progress callback
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
        reject(err)
      })
      .resume() // Omit all output data (CSV parsing results), otherwise the input consumption is stopped on filling the output buffer
  })

  // Form a parser input stream form the file
  let processed = 0 // The size of the processed part of the stream in bytes
  let result
  while (!(result = await freader.read()).done) {
    // Note: drain event listener causes
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

export async function handleFiles (files) {
  // Cleanup results representation
  removeElement('summary')
  removeElement('report')
  const progressBar = document.getElementById('progress-all')
  progressBar.value = 0
  if (!files.length) { return }

  const resBlock = document.getElementById('results')
  const dlReport = document.createElement('dl')
  dlReport.id = 'report'
  resBlock.appendChild(dlReport)

  // Evaluate total size of all files
  let totalSize = 0 // Total size of files
  for (const file of files) { totalSize += file.size }
  let processedSize = 0 // Size of the processed files
  // Visualize report
  let fails = 0
  for (const file of files) {
    const dt = document.createElement('dt')
    dt.textContent = file.name
    dlReport.appendChild(dt)

    const msgs = [] // Array of strings
    let parsed = false
    try {
      await parseFile(file, msgs, size => {
        progressBar.value = Math.round((processedSize + size) / totalSize * 100)
      }).then(() => { parsed = true })
    //     .catch((err) => {
    //       parsed = false
    //       msgs.push(err)
    //     })
    } catch (err) {
      msgs.push(err)
      console.error(err)
    }
    console.log(`handleFiles()> parsed (${parsed}): ${file.name}, msgs: ${msgs.length}`)
    processedSize += file.size
    const span = document.createElement('span')
    span.classList.add('ok', 'indicator')
    if (parsed) {
      span.textContent = 'OK'
      span.classList.add('ok')
    } else {
      ++fails
      span.textContent = 'FAIL'
      span.classList.add('fail')
    }
    dt.appendChild(span)

    for (const msg of msgs) {
      const dd = document.createElement('dd')
      dd.textContent = msg
      dlReport.appendChild(dd)
    }
  }

  // Visualize the final summary
  progressBar.value = 100
  const pSum = document.createElement('p')
  pSum.id = 'summary'
  pSum.classList.add(fails ? 'fail' : 'ok')
  pSum.textContent = fails ? `FAILED files: ${fails}/${files.length}`
    : `Succeed all files: ${files.length}`
  resBlock.appendChild(pSum)
}
