const path = require("path");

module.exports = {
  entry: {
    connection: "./src/view/app/connection.tsx",
    fields: "./src/view/app/fields.tsx",
    indexes: "./src/view/app/indexes.tsx",
    query: "./src/view/app/query.tsx"
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