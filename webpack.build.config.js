const path = require('path')
const { merge } = require('webpack-merge')
const { createDefaultConfig } = require('@open-wc/building-webpack')

module.exports =
  merge(
    createDefaultConfig({
      input: path.resolve(__dirname, './csv-validate.js'),
      plugins: {
        workbox: false
      },
      webpackIndexHTMLPlugin: {
        template: () => `
          <html>
            <head></head>
            <body></body>
          </html>
        `
      }
    }),
    {
      output: {
        filename: 'csv-validate.js'
      },
      resolve: {
        alias: {
          stream: 'readable-stream'
        }
      },
      node: {
        crypto: true
      }
    }
  )
