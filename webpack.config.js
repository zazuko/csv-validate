const path = require('path')
const webpack = require('webpack')

module.exports = {
  mode: 'development', // 'production'
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist')
  },
  resolve: {
    fallback: {
      stream: require.resolve('readable-stream'), // 'stream-browserify'
      events: require.resolve('events/'),
      buffer: require.resolve('buffer/')
      // path: require.resolve("path-browserify"),
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser'
    })
  ]
}
