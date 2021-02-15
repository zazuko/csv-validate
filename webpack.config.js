const path = require('path')
const { merge } = require('webpack-merge')
const { createDefaultConfig } = require('@open-wc/building-webpack')

module.exports =
  merge(
    createDefaultConfig({
      input: path.resolve(__dirname, './src/index.html')
    }),
    {
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
