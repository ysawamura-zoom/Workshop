const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    mode: 'development',
    entry: './src/index.js',
    output: {
        path: __dirname + '/public',
        filename: 'index.min.js'
    },
    devServer: {
      host: '0.0.0.0',
      port: 4000,
      headers: {
        'Cross-Origin-Embedder-Policy': false ? '' : 'require-corp',
        'Cross-Origin-Opener-Policy': false ? '' : 'same-origin',
      }
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: "./node_modules/@zoom/videosdk/dist/lib", to: "lib" }
        ],
      }),
    ],
};
