const Path = require('path');
const PortFinder = require('portfinder');
const ClosurePlugin = require('closure-webpack-plugin');
const ProvidePlugin = require('webpack').ProvidePlugin;
const contextPath = '/ile';

module.exports = async function (env) {
    const get = (it, val) => {
        return env === undefined || env[it] === undefined ? val : env[it];
    };

    const rules = [
        {
            test: /(?<!\.min)\.(js)$/,
            exclude: /node_modules/,
            loader: 'babel-loader',
            options: {
                'presets': [
                    '@babel/preset-env'
                ]
            }
        },
        {
            test: /(?<!\.min)\.([s]?css)$/,
            use: [
                'style-loader',
                'css-loader',
                'sass-loader'
            ]
        },
        {
            test: /\.(woff[2]?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
            loader: 'file-loader',
            options: {
                name: '[name].[ext]',
                publicPath: `${contextPath}/resources/fonts`,
                emitFile: false
            }
        },
        {
            test: /\.(jp[e]?g|png|gif|svg)$/i,
            loader: 'file-loader',
            options: {
                name: '[name].[ext]',
                publicPath: (url) => {
                    if (/^ui-icons.*\.png$/.test(url)) {
                        return `${contextPath}/resources/icons/${url}`;
                    }

                    return `${contextPath}/resources/images/${url}`;
                },
                emitFile: false
            }
        }
    ];

    const entry = {
        main: [
            '@babel/polyfill',
            Path.resolve(__dirname, './main.js')
        ]
    };

    const output = {
        path: Path.resolve(__dirname, './resources/js'),
        filename: 'bundle.js'
    };

    const resolve = {
        alias: {
            node_modules: Path.resolve(__dirname, './node_modules'),
            resources: Path.resolve(__dirname, './resources'),
            ile: Path.resolve(__dirname, '.')
        }
    };

    const plugins = {
        development: [
            new ProvidePlugin({
                $: "jquery",
                jQuery: "jquery"
            })
        ],
        production: [
            new ProvidePlugin({
                $: "jquery",
                jQuery: "jquery"
            }),

            new ClosurePlugin({
                mode: 'STANDARD'
            })
        ]
    };

    const devtool = {
        development: 'inline-source-map'
    };

    const environment = get('environment', 'development');

    PortFinder.basePort = (env && env.port) || 3000;
    return PortFinder.getPortPromise().then(port => {
        return {
            mode: environment,
            devtool: devtool[environment],
            entry: entry,
            output: output,
            plugins: plugins[environment],
            module: { rules: rules },
            resolve: resolve,
            performance: { hints: false },
            stats: 'none',
            optimization: { noEmitOnErrors: true },
            node: false,
            devServer: {
                contentBase: Path.join(__dirname, './'),
                contentBasePublicPath: contextPath,
                port: port,
                writeToDisk: true
            }
        };
    });
};
