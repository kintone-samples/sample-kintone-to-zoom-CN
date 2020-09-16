const path = require('path');
// const KintonePlugin = require('@kintone/webpack-plugin-kintone-plugin');
 
module.exports = {
  entry: {
    config: './src/config.js',
    zoom: './src/zoom.js'
  },
  output: {
    path: path.resolve(__dirname, 'plugin', 'js'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  useBuiltIns: 'usage',
                  corejs: 3
                }
              ]
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          { loader: "style-loader" },
          { loader: "css-loader" }
        ]
      }
    ]
  },
  // plugins: [
  //   new KintonePlugin({
  //     manifestJSONPath: './plugin/manifest.json',
  //     privateKeyPath: './private.ppk',
  //     pluginZipPath: './dist/plugin.zip'
  //   })
  // ]
};