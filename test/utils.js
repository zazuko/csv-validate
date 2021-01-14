//* Accessory utilities for the testing

/**
 * Consume an input stream asynchronously
 * @param {stream.Readable} readable  - input stream
 * @param {Array} output  - input stream
 */
function consume (readable, output) {
  return new Promise((resolve, reject) => {
    if (output) {
      readable.on('data', (data) => {
        output.push(data)
      })
    }
    readable.on('end', function () { resolve() })
      .on('error', function (err) { reject(err) })
      // .on('readable', () => { readable.resume() }) // Omit the remaining data and up to the end
  })
}

module.exports = {
  consume
}
