const {resolve} = require('path')
const {optimize} = require('webpack');

module.exports = function createWebpackConfig(env) {
  const DEFAULT_PLUGINS = [];
  const PROD_PLUGINS = [
    new optimize.UglifyJsPlugin({
      compress: {
          warnings: false
      }
    })
  ];

  const PLUGINS = env.prod ? [...DEFAULT_PLUGINS, ...PROD_PLUGINS] : PROD_PLUGINS;
  return {
    entry: './app/index',
    output: {
      filename: 'bundle.js',
      path: resolve(__dirname, 'dist'),
      pathinfo: !env.prod,
    },
    plugins: PLUGINS,
    devtool: env.prod ? 'source-map' : 'eval',
    bail: env.prod,
    resolve: {
      extensions: ['.ts', '.js', '.json'],
    },
    module: {
      loaders: [
        {test: /\.ts$/, loader: 'babel!ts', exclude: /node_modules/},
        {test: /\.js$/, loader: 'babel', exclude: /node_modules/},
        {test: /\.css$/, loader: 'style!css'},
      ],
    },
  };
};
