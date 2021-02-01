//* Accessory utilities for the testing

/**
 * Consume an input stream asynchronously
 * @param {stream.Readable} readable  - input stream
 * @param {Array} output  - input stream
 */
function consume (readable, output) {
  return new Promise((resolve, reject) => {
    readable.on('end', function () { resolve() })
      .on('error', function (err) { reject(err) })
      // .on('readable', () => { readable.resume() }) // Omit the remaining data and up to the end
    if (output) {
      readable.on('data', (data) => {
        output.push(data)
      })
    } else readable.resume() // Omit all output data (CSV parsing results), otherwise the input consumption is stopped on filling the output buffer
  })
}

module.exports = {
  consume
}
