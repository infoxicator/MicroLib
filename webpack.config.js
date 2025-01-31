const path = require("path");
const ModuleFederationPlugin = require("webpack").container
  .ModuleFederationPlugin;
const fetchRemotes = require("./webpack/fetch-remotes");
const remoteEntries = require("./webpack/remote-entries");
require("dotenv").config();

const port = process.env.PORT || 8070;

module.exports = () => {
  return new Promise(resolve => {
    fetchRemotes(remoteEntries).then(remotes =>
      resolve({
        target: "async-node",
        mode: "development",
        devtool: "source-map",
        entry: ["@babel/polyfill", path.resolve(__dirname, "src/server.js")],
        output: {
          publicPath: `http://localhost:${port}`,
          path: path.resolve(__dirname, "dist"),
          libraryTarget: "commonjs2",
        },
        resolve: {
          extensions: [".js"],
        },
        module: {
          rules: [
            {
              test: /\.js?$/,
              exclude: /node_modules/,
              use: {
                loader: "babel-loader",
                options: {
                  presets: ["@babel/preset-env"],
                },
              },
            },
          ],
        },
        plugins: [
          new ModuleFederationPlugin({
            name: "microlib",
            filename: "remoteEntry.js",
            library: {
              name: "microlib",
              type: "commonjs-module",
            },
            remoteType: "commonjs-module",
            remotes,
            exposes: {
              "./server": "./src/server",
              "./models": "./src/models",
            },
          }),
        ],
      })
    );
  });
};
