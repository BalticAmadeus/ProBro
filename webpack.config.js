const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    connection: "./src/view/app/Connection/",
    fields: "./src/view/app/Fields",
    indexes: "./src/view/app/Indexes",
    query: "./src/view/app/Query",
    welcomePage: "./src/view/app/Welcome"
  },
  output: {
    path: path.resolve(__dirname, "out/view/app"),
    filename: "[name].js"
  },
  devtool: "eval-source-map",
  resolve: {
    extensions: [".js", ".ts", ".tsx", ".json"]
  },
  module: {
    rules: [
      {
        test: /\.(jpg|png|svg|gif)$/,
        loader: 'url-loader',
        options: {
          limit: 25000,
          name: 'images/[name].[hash:8].[ext]',
        },
      },
      {
        test: /\.md$/,
        use: [
          {
            loader: 'raw-loader',
          },
        ],
      },
      {
        test: /\.(ts|tsx)$/,
        loader: "ts-loader",
        options: {}
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: "style-loader"
          },
          {
            loader: "css-loader"
          },
          
        ]
      }
    ]
  },
  performance: {
    hints: false
  }
};