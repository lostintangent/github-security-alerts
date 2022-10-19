//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

const path = require("path");
const webpack = require("webpack");

const config = {
  mode: "production",
  entry: "./src/extension.ts",
  externals: {
    vscode: "commonjs vscode",
  },
  resolve: {
    extensions: [".ts", ".js", ".json"],
  },
  node: {
    __filename: false,
    __dirname: false,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
          },
        ],
      },
    ],
  },
  devtool: "nosources-source-map", // create a source map that points to the original source file
  infrastructureLogging: {
    level: "log", // enables logging required for problem matchers
  },
};

const nodeConfig = {
  ...config,
  target: "node",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "extension.js",
    libraryTarget: "commonjs2",
    devtoolModuleFilenameTemplate: "../[resource-path]",
  },
};

const webConfig = {
  ...config,
  target: "webworker",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "extension-web.js",
    libraryTarget: "commonjs2",
    devtoolModuleFilenameTemplate: "../[resource-path]",
  },
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
    new webpack.ProvidePlugin({
      process: "process/browser",
    }),
  ],
};

module.exports = [nodeConfig, webConfig];