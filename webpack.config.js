const path = require("path");

module.exports = {
  entry: {
    connection: "./src/view/app/Connection/",
    fields: "./src/view/app/Fields",
    indexes: "./src/view/app/Indexes",
    query: "./src/view/app/Query"
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
          }
        ]
      }
    ]
  },
  performance: {
    hints: false
  }
};